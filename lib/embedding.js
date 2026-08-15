// 表情包插件（DSH 版）向量检索工具
// 零依赖：直接 POST OpenAI 兼容的 /embeddings 端点（dsh 的 llm 服务没有 embedding 接口）
// 参考原版 hanako-biaoqingbao lib/shared.js 的 generateEmbeddings / cosineSimilarity

// 生成向量：批量 20/批，按 API 返回的 index 排序防止乱序，校验维度一致
// cfg: { baseUrl, apiKey, model }
export async function generateEmbeddings(cfg, texts) {
  const baseUrl = cfg && cfg.baseUrl ? String(cfg.baseUrl).replace(/\/+$/, '') : ''
  const apiKey = cfg && cfg.apiKey ? String(cfg.apiKey) : ''
  const model = cfg && cfg.model ? String(cfg.model) : ''
  if (!baseUrl || !apiKey || !model) return { ok: false, error: '未配置 Embedding 模型' }
  const input = Array.isArray(texts) ? texts : [texts]
  if (input.length === 0) return { ok: true, data: [] }
  try {
    const resp = await fetch(baseUrl + '/embeddings', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, input }),
      signal: AbortSignal.timeout(30000),
    })
    if (!resp.ok) {
      const t = await resp.text().catch(() => '')
      return { ok: false, error: 'Embedding API HTTP ' + resp.status + ': ' + String(t).substring(0, 200) }
    }
    const data = await resp.json()
    const embeddings = (data && Array.isArray(data.data) ? data.data : [])
      .slice()
      .sort((a, b) => (a && a.index !== undefined ? a.index : 0) - (b && b.index !== undefined ? b.index : 0))
      .map(d => d && d.embedding)
      .filter(v => Array.isArray(v) && v.length > 0 && v.every(n => typeof n === 'number' && Number.isFinite(n)))
    if (embeddings.length === 0) return { ok: false, error: 'Embedding API 返回空向量' }
    if (embeddings.length !== input.length) {
      return { ok: false, error: 'Embedding API 返回数量不一致（期望 ' + input.length + '，实际 ' + embeddings.length + '）' }
    }
    const dim = embeddings[0].length
    for (const v of embeddings) {
      if (v.length !== dim) return { ok: false, error: 'Embedding API 返回的向量维度不一致' }
    }
    return { ok: true, data: embeddings }
  } catch (e) {
    return { ok: false, error: e && e.message ? e.message : String(e) }
  }
}

// 余弦相似度（-1 ~ 1），维度不一致返回 0
export function cosineSimilarity(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return 0
  let dot = 0, magA = 0, magB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    magA += a[i] * a[i]
    magB += b[i] * b[i]
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB)
  return denom === 0 ? 0 : dot / denom
}
