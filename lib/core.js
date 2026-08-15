// 表情包插件（DSH 版）核心纯函数模块
// 从 host 半提取的纯函数：打分、偏好、标签清洗、频率门控、文本工具
// 无 ctx 依赖，可独立单元测试

// ═══════════════ 标签清洗 ═══════════════
export function sanitizeTag(raw, maxLen) {
  if (raw === undefined || raw === null) return ''
  const cap = maxLen || 30
  let s = String(raw).replace(/[\u0000-\u001f\u007f]/g, '').replace(/[`$'"\[\]{}]/g, '').trim()
  if (s.length > cap) s = s.slice(0, cap)
  return s
}

export function strArr(v) {
  if (Array.isArray(v)) return v.map(x => sanitizeTag(x)).filter(Boolean)
  if (typeof v === 'string' && v.trim()) return [sanitizeTag(v)]
  return []
}

// ═══════════════ 文本工具 ═══════════════
export function textOfContent(content) {
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    return content.filter(p => p && p.type === 'text' && typeof p.text === 'string').map(p => p.text).join('\n')
  }
  return ''
}

export function lastUserText(messages) {
  for (let i = (messages || []).length - 1; i >= 0; i--) {
    const m = messages[i]
    if (m && m.role === 'user') return textOfContent(m.content)
  }
  return ''
}

// ═══════════════ 自然度 / 仪式词 / 频率门控 ═══════════════
const NATURAL_FILTERS = [
  { re: /```[\s\S]*?```/g },
  { re: /https?:\/\/[^\s'"]{40,}/g },
  { re: /\b(pip|npm|git|ssh|cd|ls|rm|cp|mv|mkdir|powershell|cmd)\s+[^\n]{10,}/g },
]

export function looksNatural(text) {
  if (!text || typeof text !== 'string' || text.length < 2) return false
  let rest = text
  for (const f of NATURAL_FILTERS) rest = rest.replace(f.re, ' ')
  const restRatio = rest.trim().length / Math.max(text.length, 1)
  return restRatio >= 0.6
}

const RITUAL_WORDS = ['早安', '早呀', '早上好', '早安呀', '中午好', '下午好', '晚安', '晚安安', '不早了', '该睡了', '你好', '哈喽', '嗨', 'hi', 'hello', '在吗', '想你']

export function matchRitualWord(text, word) {
  if (/^[a-z]+$/.test(word)) {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return new RegExp('\\b' + escaped + '\\b').test(text)
  }
  return text === word || text.includes(word)
}

export function detectRitual(text) {
  const t = String(text || '').toLowerCase().trim()
  if (!t) return null
  for (const w of RITUAL_WORDS) {
    if (matchRitualWord(t, w)) return { word: w }
  }
  return null
}

export function passesFrequency(percent, randomValue) {
  const probability = Math.max(0, Math.min(100, Number(percent) || 0))
  return (randomValue === undefined ? Math.random() : randomValue) < probability / 100
}

const WORK_KEYWORDS = ['代码', 'bug', '修复', '测试', '插件', '报错', '部署', '服务器', '数据库', '接口', '命令', '终端', '编译', '重构', 'git', 'npm', '脚本', '函数', '日志', 'api', 'sql', 'ssh', 'docker', 'json', '验收', '编程', '调试', '仓库', '提交', '分支', '冲突']

export function isWorkTalk(text) {
  if (!text) return false
  const t = String(text).toLowerCase()
  return WORK_KEYWORDS.some(k => t.includes(k))
}

export function shouldBoostRound(messagesLength, randomValue) {
  if (!Number.isFinite(messagesLength) || messagesLength < 0) return false
  if (messagesLength <= 8) return true
  return (randomValue === undefined ? Math.random() : randomValue) < 0.6
}

// ═══════════════ 偏好与打分 ═══════════════
export function collectPrefsForEmotion(mappings, emotion) {
  const result = { preferred: [], vetoed: [], dislikes: {} }
  if (!emotion) return result
  for (const m of (mappings || [])) {
    const ctxEmotion = m && m.context ? m.context.emotion : null
    if (ctxEmotion && (emotion.includes(ctxEmotion) || ctxEmotion.includes(emotion))) {
      result.preferred = result.preferred.concat(m.preferred_ids || [])
      result.vetoed = result.vetoed.concat(m.vetoed_ids || [])
      const dc = m.dislike_counts || {}
      for (const key of Object.keys(dc)) {
        if (dc[key] > 0) result.dislikes[key] = (result.dislikes[key] || 0) + dc[key]
      }
    }
  }
  return result
}

export function prefsScoreBonus(stickerId, prefs) {
  const p = prefs || {}
  let bonus = 0
  if ((p.preferred || []).includes(stickerId)) bonus += 10
  if ((p.vetoed || []).includes(stickerId)) bonus -= 20
  const dc = (p.dislikes || {})[stickerId] || 0
  if (dc > 0) bonus -= Math.min(dc, 5) * 5
  return bonus
}

export function scoreStickers(stickers, emotion, excludeIds, prefs) {
  const emo = sanitizeTag(emotion, 60)
  const emoLower = emo.toLowerCase()
  return stickers
    .filter(s => s && !excludeIds.includes(s.id))
    .map(sticker => {
      let emotionScore = 0
      const tags = sticker.tags || {}
      for (const tag of (tags.emotion || [])) {
        const tagLower = String(tag).toLowerCase()
        if (tag === emo) emotionScore += 8
        else if (tag.includes(emo) || emo.includes(tag)) emotionScore += 5
        else if (tagLower.includes(emoLower) || emoLower.includes(tagLower)) emotionScore += 3
      }
      for (const tag of (tags.scene || [])) {
        if (tag === emo) emotionScore += 5
        else if (tag.includes(emo) || emo.includes(tag)) emotionScore += 3
      }
      for (const tag of (tags.keywords || [])) {
        if (tag === emo) emotionScore += 4
        else if (tag.includes(emo) || emo.includes(tag)) emotionScore += 2
      }
      if (sticker.description && sticker.description.includes(emo)) emotionScore += 3
      return { ...sticker, _score: emotionScore + prefsScoreBonus(sticker.id, prefs) }
    })
    .filter(s => s._score > 0)
    .sort((a, b) => b._score - a._score)
}

export function substringMatch(stickers, query) {
  const q = String(query || '').toLowerCase()
  if (!q) return stickers
  const out = []
  for (const s of stickers) {
    const tags = s.tags || {}
    const hay = [s.description || '', ...(tags.emotion || []), ...(tags.scene || []), ...(tags.keywords || [])].join(' ').toLowerCase()
    if (hay.includes(q)) out.push(s)
  }
  return out
}

// ═══════════════ ID 生成 ═══════════════
export function genId(stickers) {
  let max = 0
  for (const s of stickers) {
    const m = /^stk_(\d+)$/.exec(s.id || '')
    if (m) max = Math.max(max, parseInt(m[1], 10))
  }
  return 'stk_' + String(max + 1).padStart(3, '0')
}
