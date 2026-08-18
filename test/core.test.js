// 核心纯函数单元测试（node:test，零依赖）
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  sanitizeTag, strArr, textOfContent, lastUserText, looksNatural,
  detectRitual, passesFrequency, isWorkTalk, shouldBoostRound,
  collectPrefsForEmotion, prefsScoreBonus, scoreStickers, substringMatch, genId,
  parseSuggestion, stripSuggestion, resolvePresetId, effectivePresetConfig
} from '../lib/core.js'

// ═══════════════ 标签清洗 ═══════════════
test('sanitizeTag: 清洗控制字符与特殊符号', () => {
  assert.equal(sanitizeTag('a\u0000b', 30), 'ab')
  assert.equal(sanitizeTag('x`y', 30), 'xy')
  assert.equal(sanitizeTag(undefined, 30), '')
  assert.equal(sanitizeTag(null, 30), '')
  assert.equal(sanitizeTag(123, 30), '123')
})

test('sanitizeTag: 超长截断', () => {
  assert.equal(sanitizeTag('abcdefghij', 5), 'abcde')
  assert.equal(sanitizeTag('短', 5), '短')
})

test('strArr: 数组与字符串归一化', () => {
  assert.deepEqual(strArr(['开心', '', ' 委屈 ']), ['开心', '委屈'])
  assert.deepEqual(strArr('开心'), ['开心'])
  assert.deepEqual(strArr(''), [])
  assert.deepEqual(strArr(undefined), [])
})

// ═══════════════ 文本工具 ═══════════════
test('textOfContent: 字符串与消息数组', () => {
  assert.equal(textOfContent('hello'), 'hello')
  assert.equal(textOfContent([{ type: 'text', text: 'a' }, { type: 'text', text: 'b' }]), 'a\nb')
  assert.equal(textOfContent([{ type: 'image' }, { type: 'text', text: 'c' }]), 'c')
  assert.equal(textOfContent(undefined), '')
})

test('lastUserText: 取最后一条用户消息', () => {
  const msgs = [
    { role: 'user', content: '第一条' },
    { role: 'assistant', content: '回复' },
    { role: 'user', content: [{ type: 'text', text: '第二条' }] }
  ]
  assert.equal(lastUserText(msgs), '第二条')
  assert.equal(lastUserText([]), '')
})

// ═══════════════ 自然度 / 仪式词 / 频率 ═══════════════
test('looksNatural: 过滤代码块和命令', () => {
  assert.equal(looksNatural('今天天气不错'), true)
  assert.equal(looksNatural('```\nconst a = 1\n```'), false)
  assert.equal(looksNatural('npm install --save-dev xxx 这是一条命令'), false)
  assert.equal(looksNatural('短'), false)
})

test('detectRitual: 识别问候仪式词', () => {
  // '早安' 在列表中先于 '早安呀'，子串匹配先命中前者（行为符合预期）
  assert.deepEqual(detectRitual('早安呀'), { word: '早安' })
  assert.deepEqual(detectRitual('你好，在吗'), { word: '你好' })
  assert.deepEqual(detectRitual('中午好呀'), { word: '中午好' })
  assert.equal(detectRitual('今天写代码'), null)
  assert.equal(detectRitual(''), null)
})

test('passesFrequency: 概率门控', () => {
  assert.equal(passesFrequency(100, 0), true)
  assert.equal(passesFrequency(0, 0.5), false)
  assert.equal(passesFrequency(30, 0.2), true)
  assert.equal(passesFrequency(30, 0.8), false)
  assert.equal(passesFrequency(150, 0.9), true)
})

test('isWorkTalk: 工作话题检测', () => {
  assert.equal(isWorkTalk('帮我修个 bug'), true)
  assert.equal(isWorkTalk('这个接口报错了'), true)
  assert.equal(isWorkTalk('今天吃了什么'), false)
})

test('shouldBoostRound: 短对话必 boost', () => {
  assert.equal(shouldBoostRound(3, 0.99), true)
  assert.equal(shouldBoostRound(8, 0.99), true)
  assert.equal(shouldBoostRound(20, 0.1), true)
  assert.equal(shouldBoostRound(20, 0.9), false)
  assert.equal(shouldBoostRound(-1, 0), false)
})

// ═══════════════ 偏好与打分 ═══════════════
test('collectPrefsForEmotion: 按情绪上下文收集偏好', () => {
  const mappings = [
    { context: { emotion: '委屈' }, preferred_ids: ['stk_001'], vetoed_ids: [], dislike_counts: {} },
    { context: { emotion: '开心' }, preferred_ids: ['stk_002'], vetoed_ids: ['stk_003'], dislike_counts: { stk_003: 2 } },
    { context: { emotion: '委屈巴巴' }, preferred_ids: ['stk_004'], vetoed_ids: [], dislike_counts: {} }
  ]
  const r = collectPrefsForEmotion(mappings, '委屈')
  assert.ok(r.preferred.includes('stk_001'))
  assert.ok(r.preferred.includes('stk_004'))
  assert.ok(!r.preferred.includes('stk_002'))
})

test('prefsScoreBonus: 喜欢/拉黑/累计不喜欢', () => {
  const prefs = { preferred: ['a'], vetoed: ['b'], dislikes: { c: 3 } }
  assert.equal(prefsScoreBonus('a', prefs), 10)
  assert.equal(prefsScoreBonus('b', prefs), -20)
  assert.equal(prefsScoreBonus('c', prefs), -15)
  assert.equal(prefsScoreBonus('d', prefs), 0)
  assert.equal(prefsScoreBonus('e', null), 0)
})

test('scoreStickers: 情绪打分排序与偏好加成', () => {
  const stickers = [
    { id: 'stk_001', description: '委屈的猫', tags: { emotion: ['委屈'], scene: [], keywords: [] } },
    { id: 'stk_002', description: '开心的狗', tags: { emotion: ['开心'], scene: [], keywords: [] } },
    { id: 'stk_003', description: '委屈的狗', tags: { emotion: ['委屈'], scene: [], keywords: [] } }
  ]
  const prefs = { preferred: ['stk_003'], vetoed: [], dislikes: {} }
  const scored = scoreStickers(stickers, '委屈', [], prefs)
  assert.equal(scored.length, 2)
  // stk_003：8(精确匹配) + 10(偏好) = 18；stk_001：8
  assert.equal(scored[0].id, 'stk_003')
  assert.equal(scored[1].id, 'stk_001')
})

test('scoreStickers: 排除列表生效', () => {
  const stickers = [
    { id: 'stk_001', description: '委屈', tags: { emotion: ['委屈'], scene: [], keywords: [] } }
  ]
  assert.equal(scoreStickers(stickers, '委屈', ['stk_001'], {}).length, 0)
  // 全被排除后无结果
})

test('substringMatch: 关键词子串搜索', () => {
  const stickers = [
    { id: 'a', description: '橘猫委屈', tags: { emotion: ['委屈'], scene: [], keywords: ['猫'] } },
    { id: 'b', description: '小狗开心', tags: { emotion: ['开心'], scene: [], keywords: ['狗'] } }
  ]
  assert.equal(substringMatch(stickers, '猫').length, 1)
  assert.equal(substringMatch(stickers, '开心').length, 1)
  assert.equal(substringMatch(stickers, '').length, 2)
  assert.equal(substringMatch(stickers, '不存在').length, 0)
})

// ═══════════════ ID 生成 ═══════════════
test('genId: 自增补零', () => {
  assert.equal(genId([]), 'stk_001')
  assert.equal(genId([{ id: 'stk_001' }, { id: 'stk_002' }]), 'stk_003')
  assert.equal(genId([{ id: 'stk_009' }, { id: 'stk_010' }]), 'stk_011')
  assert.equal(genId([{ id: 'other' }]), 'stk_001')
})

// ═══════════════ 聊天建议解析（和助手聊聊） ═══════════════
test('parseSuggestion: 正常提取 suggestion JSON', () => {
  const reply = '你说得对，我来调整一下标签。\n\n<suggestion>\n{"description":"新描述","semantic_description":"新语义","emotion":["委屈","撒娇"],"scene":["认错"],"keywords":["猫","低头"]}\n</suggestion>'
  const sug = parseSuggestion(reply)
  assert.ok(sug)
  assert.equal(sug.description, '新描述')
  assert.equal(sug.semantic_description, '新语义')
  assert.deepEqual(sug.emotion, ['委屈', '撒娇'])
  assert.deepEqual(sug.scene, ['认错'])
  assert.deepEqual(sug.keywords, ['猫', '低头'])
})

test('parseSuggestion: 无 suggestion 块返回 null', () => {
  assert.equal(parseSuggestion('这张图我觉得还行'), null)
  assert.equal(parseSuggestion(''), null)
  assert.equal(parseSuggestion(undefined), null)
})

test('parseSuggestion: JSON 损坏返回 null', () => {
  assert.equal(parseSuggestion('<suggestion>{not json}</suggestion>'), null)
  assert.equal(parseSuggestion('<suggestion>42</suggestion>'), null)
})

test('parseSuggestion: 字段缺省时对应值为 null/空', () => {
  const sug = parseSuggestion('<suggestion>{"description":"仅描述"}</suggestion>')
  assert.ok(sug)
  assert.equal(sug.description, '仅描述')
  assert.equal(sug.emotion, null)
  assert.equal(sug.scene, null)
})

test('stripSuggestion: 剥掉 suggestion 块只留自然语言', () => {
  const reply = '好的，改一下。\n\n<suggestion>{"description":"x"}</suggestion>'
  assert.equal(stripSuggestion(reply), '好的，改一下。')
  assert.equal(stripSuggestion('没有块'), '没有块')
  assert.equal(stripSuggestion(''), '')
})

// ═══════════════ 会话 → 助手（preset）解析 ═══════════════
test('resolvePresetId: header.agentPreset 直接命中', () => {
  const session = { header: { id: 's1', agentPreset: 'xiaohua' }, events: [] }
  assert.equal(resolvePresetId(session), 'xiaohua')
})

test('resolvePresetId: 空白窗口切换后以最新 selected 事件为准', () => {
  const session = {
    header: { id: 's1', agentPreset: 'xiaohua' },
    events: [
      { type: 'agent-preset/selected', data: { agentPreset: 'yue' } },
      { type: 'agent-preset/selected', data: { agentPreset: 'butter' } },
      { type: 'user/message' },
    ]
  }
  assert.equal(resolvePresetId(session), 'butter')
})

test('resolvePresetId: 无 header 时从事件拿', () => {
  const session = {
    header: undefined,
    events: [{ type: 'agent-preset/selected', data: { agentPreset: 'ming' } }]
  }
  assert.equal(resolvePresetId(session), 'ming')
})

test('resolvePresetId: 拿不到时返回 default（兜底）', () => {
  assert.equal(resolvePresetId(null), 'default')
  assert.equal(resolvePresetId({}), 'default')
  assert.equal(resolvePresetId({ header: { id: 's1' }, events: [] }), 'default')
  assert.equal(resolvePresetId({ header: { id: 's1', agentPreset: '' }, events: [{ type: 'user/message' }] }), 'default')
})

// ═══════════════ per-preset 配置合并 ═══════════════
test('effectivePresetConfig: 无覆盖时全部沿用全局默认', () => {
  const g = { enabled: true, dialect: { id: 'sichuan', boost: false }, freq: { daily: 50, task: 20 } }
  const eff = effectivePresetConfig(g, null)
  assert.equal(eff.enabled, true)
  assert.equal(eff.dialect.id, 'sichuan')
  assert.equal(eff.dialect.boost, false)
  assert.equal(eff.freq.daily, 50)
  assert.equal(eff.freq.task, 20)
})

test('effectivePresetConfig: 覆盖只改显式字段，其余继承全局', () => {
  const g = { enabled: true, dialect: { id: 'sichuan', boost: false }, freq: { daily: 50, task: 20 } }
  const eff = effectivePresetConfig(g, { enabled: false, freq: { daily: 0 } })
  assert.equal(eff.enabled, false)
  assert.equal(eff.dialect.id, 'sichuan')
  assert.equal(eff.freq.daily, 0)
  assert.equal(eff.freq.task, 20)
})

test('effectivePresetConfig: 全局缺省字段给默认值', () => {
  const eff = effectivePresetConfig({}, {})
  assert.equal(eff.enabled, true)
  assert.equal(eff.dialect.id, '')
  assert.equal(eff.freq.daily, 50)
  assert.equal(eff.freq.task, 20)
  const eff2 = effectivePresetConfig(undefined, undefined)
  assert.equal(eff2.enabled, true)
})

test('effectivePresetConfig: 全局关闭时未覆盖的助手也关闭', () => {
  const g = { enabled: false }
  assert.equal(effectivePresetConfig(g, null).enabled, false)
  assert.equal(effectivePresetConfig(g, { enabled: true }).enabled, true)
})
