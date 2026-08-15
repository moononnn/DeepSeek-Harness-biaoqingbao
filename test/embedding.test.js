// 向量工具测试：cosineSimilarity + generateEmbeddings 错误分支
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cosineSimilarity, generateEmbeddings } from '../lib/embedding.js'

test('cosineSimilarity：相同向量 = 1', () => {
  assert.equal(cosineSimilarity([1, 2, 3], [1, 2, 3]), 1)
})

test('cosineSimilarity：正交向量 = 0', () => {
  assert.ok(Math.abs(cosineSimilarity([1, 0], [0, 1])) < 1e-12)
})

test('cosineSimilarity：相反向量 = -1', () => {
  assert.equal(cosineSimilarity([1, 0], [-1, 0]), -1)
})

test('cosineSimilarity：维度不一致返回 0', () => {
  assert.equal(cosineSimilarity([1, 2], [1, 2, 3]), 0)
})

test('cosineSimilarity：非数组输入返回 0', () => {
  assert.equal(cosineSimilarity(null, [1]), 0)
  assert.equal(cosineSimilarity([1], 'x'), 0)
})

test('cosineSimilarity：相似向量接近 1', () => {
  const a = [1, 0.1, 0.2, -0.05]
  const b = [1.1, 0.05, 0.25, 0]
  const sim = cosineSimilarity(a, b)
  assert.ok(sim > 0.95 && sim <= 1)
})

test('generateEmbeddings：未配置时返回错误', async () => {
  const r = await generateEmbeddings({ baseUrl: '', apiKey: '', model: '' }, ['测试'])
  assert.equal(r.ok, false)
  assert.match(r.error, /未配置/)
})

test('generateEmbeddings：baseUrl 尾部斜杠被去掉后请求', async () => {
  let captured = null
  const origFetch = globalThis.fetch
  globalThis.fetch = async (url, opts) => {
    captured = { url, opts }
    return {
      ok: true,
      async json() {
        return { data: [{ index: 0, embedding: [0.1, 0.2, 0.3] }] }
      }
    }
  }
  try {
    const r = await generateEmbeddings({ baseUrl: 'https://example.com/v1/', apiKey: 'sk-test', model: 'embed-m' }, ['你好'])
    assert.equal(r.ok, true)
    assert.equal(captured.url, 'https://example.com/v1/embeddings')
    assert.equal(captured.opts.headers.Authorization, 'Bearer sk-test')
    assert.deepEqual(JSON.parse(captured.opts.body).input, ['你好'])
    assert.equal(r.data[0].length, 3)
  } finally {
    globalThis.fetch = origFetch
  }
})

test('generateEmbeddings：HTTP 错误返回错误信息', async () => {
  const origFetch = globalThis.fetch
  globalThis.fetch = async () => {
    return { ok: false, status: 401, async text() { return 'unauthorized' } }
  }
  try {
    const r = await generateEmbeddings({ baseUrl: 'https://example.com/v1', apiKey: 'bad', model: 'embed-m' }, ['x'])
    assert.equal(r.ok, false)
    assert.match(r.error, /401/)
    assert.match(r.error, /unauthorized/)
  } finally {
    globalThis.fetch = origFetch
  }
})

test('generateEmbeddings：返回数量不一致时报错', async () => {
  const origFetch = globalThis.fetch
  globalThis.fetch = async () => {
    return { ok: true, async json() { return { data: [{ index: 0, embedding: [1] }] } } }
  }
  try {
    const r = await generateEmbeddings({ baseUrl: 'https://example.com/v1', apiKey: 'k', model: 'm' }, ['a', 'b'])
    assert.equal(r.ok, false)
    assert.match(r.error, /数量不一致/)
  } finally {
    globalThis.fetch = origFetch
  }
})
