// 表情包插件 DSH 移植版 —— 打分/偏好逻辑验证
// 函数体逐字来自 biaoq-4/pkg-8 host 半；断言来自 hana 插件 tests/critical-logic.test.js
'use strict'
const assert = require('node:assert/strict')

// ── 移植自 pkg-8 host ──
function sanitizeTag(raw, maxLen) {
  if (raw === undefined || raw === null) return ''
  const cap = maxLen || 30
  let s = String(raw).replace(/[\u0000-\u001f\u007f]/g, '').replace(/[`$'"\[\]{}]/g, '').trim()
  if (s.length > cap) s = s.slice(0, cap)
  return s
}
function collectPrefsForEmotion(mappings, emotion) {
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
function prefsScoreBonus(stickerId, prefs) {
  const p = prefs || {}
  let bonus = 0
  if ((p.preferred || []).includes(stickerId)) bonus += 10
  if ((p.vetoed || []).includes(stickerId)) bonus -= 20
  const dc = (p.dislikes || {})[stickerId] || 0
  if (dc > 0) bonus -= Math.min(dc, 5) * 5
  return bonus
}
function scoreStickers(stickers, emotion, excludeIds, prefs) {
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

// ── 用例 1：标签打分遵守偏好、否决和排除名单（hana critical-logic.test.js L43）──
{
  const stickers = [
    { id: 'a', description: '开心猫咪挥手', tags: { emotion: ['开心'], scene: ['问候'], keywords: ['猫咪'] } },
    { id: 'b', description: '笑着打招呼', tags: { emotion: ['开心'], scene: ['早安'], keywords: ['挥手'] } },
    { id: 'c', description: '伤心落泪', tags: { emotion: ['难过'], scene: ['安慰'], keywords: ['眼泪'] } },
  ]
  const preferred = scoreStickers(stickers, '开心', [], { preferred: ['b'], vetoed: ['a'], dislikes: {} })
  assert.deepEqual(preferred.map(item => item.id), ['b'])
  assert.equal(preferred[0]._score, 18)
  const excluded = scoreStickers(stickers, '开心', ['b'], { preferred: [], vetoed: [], dislikes: {} })
  assert.deepEqual(excluded.map(item => item.id), ['a'])
  console.log('✓ 用例1 标签打分遵守偏好/否决/排除名单')
}

// ── 用例 2：累计不喜欢降权（L166）──
{
  const stickers = [{ id: 'a', description: '开心大笑', tags: { emotion: ['开心'], scene: ['问候'] } }]
  const once = scoreStickers(stickers, '开心', [], { preferred: [], vetoed: [], dislikes: { a: 1 } })
  assert.equal(once.length, 1)
  assert.equal(once[0]._score, 6)
  const twice = scoreStickers(stickers, '开心', [], { preferred: [], vetoed: [], dislikes: { a: 2 } })
  assert.equal(twice.length, 1)
  assert.equal(twice[0]._score, 1)
  const thrice = scoreStickers(stickers, '开心', [], { preferred: [], vetoed: [], dislikes: { a: 3 } })
  assert.equal(thrice.length, 0)
  const many = scoreStickers(stickers, '开心', [], { preferred: [], vetoed: [], dislikes: { a: 9 } })
  assert.equal(many.length, 0)
  console.log('✓ 用例2 累计不喜欢降权梯度')
}

// ── 用例 3：不喜欢累计与硬拉黑叠加（L190）──
{
  const stickers = [{ id: 'a', description: '开心大笑', tags: { emotion: ['开心'], scene: ['问候'] } }]
  const result = scoreStickers(stickers, '开心', [], { preferred: [], vetoed: ['a'], dislikes: { a: 2 } })
  assert.equal(result.length, 0)
  console.log('✓ 用例3 不喜欢+硬拉黑叠加')
}

// ── 用例 4：偏好按映射隔离（L236）──
{
  const agentA = [
    { context: { emotion: '开心' }, preferred_ids: ['a1'], vetoed_ids: ['a2'], dislike_counts: { a3: 2 } },
    { context: { emotion: '难过' }, preferred_ids: ['a3'] },
  ]
  const agentB = [
    { context: { emotion: '开心' }, preferred_ids: ['b1'], vetoed_ids: ['b2'] },
  ]
  const forA = collectPrefsForEmotion(agentA, '开心')
  assert.deepEqual(forA, { preferred: ['a1'], vetoed: ['a2'], dislikes: { a3: 2 } })
  const forB = collectPrefsForEmotion(agentB, '开心')
  assert.deepEqual(forB, { preferred: ['b1'], vetoed: ['b2'], dislikes: {} })
  const sadA = collectPrefsForEmotion(agentA, '难过')
  assert.deepEqual(sadA, { preferred: ['a3'], vetoed: [], dislikes: {} })
  assert.deepEqual(collectPrefsForEmotion(undefined, '开心'), { preferred: [], vetoed: [], dislikes: {} })
  assert.deepEqual(collectPrefsForEmotion(agentA, ''), { preferred: [], vetoed: [], dislikes: {} })
  console.log('✓ 用例4 偏好映射隔离与空情绪')
}

// ── 用例 5：种子图库真实数据抽查 ──
{
  const stickers = [
    { id: 'stk_001', description: '一只橘猫委屈地凝视镜头，配以调侃出轨的文字，幽默中带着无奈。', tags: { emotion: ['委屈', '调侃', '幽默'], scene: ['催回复', '调侃', '玩笑'], keywords: ['猫', '橘猫', '委屈', '凝视', '文字', '小三梗', '调侃', '幽默'] } },
    { id: 'stk_002', description: '猫咪闭眼自嘲，文字调侃被忽略后夸张联想。', tags: { emotion: ['委屈', '自嘲', '幽默'], scene: ['催回复', '调侃', '要红包'], keywords: ['猫', '闭眼', '委屈', '文字梗', '自嘲', '红包'] } },
    { id: 'stk_010', description: '小橘猫挂着闪亮泪珠低头，配文我哭了，委屈又可爱', tags: { emotion: ['委屈', '可怜', '撒娇'], scene: ['求安慰', '装可怜', '假哭', '示弱'], keywords: ['橘猫', '奶猫', '泪珠', '低头', '我哭了', '萌宠', '特效'] } },
  ]
  const sad = scoreStickers(stickers, '委屈', [], { preferred: [], vetoed: [], dislikes: {} })
  assert.equal(sad.length, 3)
  assert.ok(sad[0]._score >= 8, '委屈 exact 情绪标签应 ≥8')
  // 排除最近用过的
  const excl = scoreStickers(stickers, '委屈', ['stk_001'], { preferred: [], vetoed: [], dislikes: {} })
  assert.equal(excl.length, 2)
  assert.ok(!excl.some(s => s.id === 'stk_001'))
  // 求安慰场景词命中
  const comfort = scoreStickers(stickers, '求安慰', [], { preferred: [], vetoed: [], dislikes: {} })
  assert.ok(comfort.some(s => s.id === 'stk_010'), '场景标签「求安慰」应命中 stk_010')
  // 无匹配
  const none = scoreStickers(stickers, '打篮球', [], { preferred: [], vetoed: [], dislikes: {} })
  assert.equal(none.length, 0)
  console.log('✓ 用例5 种子图库真实打分（委屈/排除/场景/无匹配）')
}

console.log('\n全部 5 组断言通过 ✔')
