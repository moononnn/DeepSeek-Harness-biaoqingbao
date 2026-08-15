// ZIP 解压测试：构造最小 zip（stored + deflate）验证 extractImagesFromZip
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { deflateRawSync } from 'node:zlib'
import { extractImagesFromZip, hasImageSignature, detectImageFormat } from '../lib/zip-images.js'

// ── crc32（表驱动）──
const CRC_TABLE = (() => {
  const table = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c
  }
  return table
})()

function crc32(buf) {
  let crc = -1
  for (let i = 0; i < buf.length; i++) crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8)
  return (crc ^ -1) >>> 0
}

// 构造 zip：entries = [{ name, data, deflate? }]
function buildZip(entries) {
  const chunks = []
  const central = []
  let offset = 0
  for (const e of entries) {
    const nameBuf = Buffer.from(e.name, 'utf8')
    const raw = Buffer.isBuffer(e.data) ? e.data : Buffer.from(e.data)
    const data = e.deflate ? deflateRawSync(raw) : raw
    const crc = crc32(raw)
    const method = e.deflate ? 8 : 0
    const local = Buffer.alloc(30)
    local.writeUInt32LE(0x04034b50, 0)
    local.writeUInt16LE(20, 4)
    local.writeUInt16LE(0x0800, 6) // UTF-8 文件名
    local.writeUInt16LE(method, 8)
    local.writeUInt32LE(crc, 14)
    local.writeUInt32LE(data.length, 18)
    local.writeUInt32LE(raw.length, 22)
    local.writeUInt16LE(nameBuf.length, 26)
    local.writeUInt16LE(0, 28)
    chunks.push(local, nameBuf, data)
    const c = Buffer.alloc(46)
    c.writeUInt32LE(0x02014b50, 0)
    c.writeUInt16LE(20, 4)
    c.writeUInt16LE(20, 6)
    c.writeUInt16LE(0x0800, 8)
    c.writeUInt16LE(method, 10)
    c.writeUInt32LE(crc, 16)
    c.writeUInt32LE(data.length, 20)
    c.writeUInt32LE(raw.length, 24)
    c.writeUInt16LE(nameBuf.length, 28)
    c.writeUInt16LE(0, 30)
    c.writeUInt16LE(0, 32)
    c.writeUInt32LE(offset, 42)
    central.push(c, nameBuf)
    offset += 30 + nameBuf.length + data.length
  }
  const cdStart = offset
  const centralBuf = Buffer.concat(central)
  const eocd = Buffer.alloc(22)
  eocd.writeUInt32LE(0x06054b50, 0)
  eocd.writeUInt16LE(0, 4)
  eocd.writeUInt16LE(0, 6)
  eocd.writeUInt16LE(entries.length, 8)
  eocd.writeUInt16LE(entries.length, 10)
  eocd.writeUInt32LE(centralBuf.length, 12)
  eocd.writeUInt32LE(cdStart, 16)
  eocd.writeUInt16LE(0, 20)
  return Buffer.concat([...chunks, centralBuf, eocd])
}

// 最小 PNG 假文件（只要签名 + 一点数据；解压只校验签名）
function fakePng(seed) {
  const buf = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  return Buffer.concat([buf, Buffer.from(String(seed).padEnd(16, '0'))])
}
function fakeGif() {
  return Buffer.from('GIF89a' + '0123456789abcdef')
}
function fakeJpg() {
  return Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01])
}

test('extractImagesFromZip：单张 PNG（stored）解出 1 张', async () => {
  const zip = buildZip([{ name: 'a.png', data: fakePng(1) }])
  const r = await extractImagesFromZip(zip)
  assert.equal(r.images.length, 1)
  assert.equal(r.images[0].fileName, 'a.png')
  assert.equal(r.images[0].ext, 'png')
  assert.equal(r.skipped.length, 0)
})

test('extractImagesFromZip：deflate 压缩的图片正常解出', async () => {
  const zip = buildZip([{ name: 'b.png', data: fakePng(2), deflate: true }])
  const r = await extractImagesFromZip(zip)
  assert.equal(r.images.length, 1)
  assert.deepEqual(r.images[0].data, fakePng(2))
})

test('extractImagesFromZip：混合内容（图片 + 文本 + 子目录）', async () => {
  const zip = buildZip([
    { name: 'pics/cat.png', data: fakePng(3) },
    { name: 'readme.txt', data: Buffer.from('hello') },
    { name: 'pics/dog.gif', data: fakeGif() },
    { name: 'pics/', data: Buffer.alloc(0) },
  ])
  const r = await extractImagesFromZip(zip)
  assert.equal(r.images.length, 2)
  // 子目录里的文件取 basename
  assert.deepEqual(r.images.map(i => i.fileName).sort(), ['cat.png', 'dog.gif'])
  assert.equal(r.skipped.length, 1)
  assert.equal(r.skipped[0].file, 'readme.txt')
})

test('extractImagesFromZip：假扩展名（内容签名不匹配）被跳过', async () => {
  const zip = buildZip([{ name: 'trick.jpg', data: fakePng(4) }])
  const r = await extractImagesFromZip(zip)
  assert.equal(r.images.length, 0)
  assert.equal(r.skipped.length, 1)
  assert.match(r.skipped[0].reason, /内容与格式不符/)
})

test('extractImagesFromZip：jpg/gif/webp 签名识别', () => {
  assert.equal(hasImageSignature(fakeJpg(), 'jpg'), true)
  assert.equal(hasImageSignature(fakeGif(), 'gif'), true)
  assert.equal(detectImageFormat(fakePng(5)), 'png')
  assert.equal(detectImageFormat(fakeGif()), 'gif')
  assert.equal(detectImageFormat(fakeJpg()), 'jpg')
  assert.equal(detectImageFormat(Buffer.from('not an image')), null)
})

test('extractImagesFromZip：损坏 zip 抛错', async () => {
  await assert.rejects(() => extractImagesFromZip(Buffer.from('garbage data here')), /ZIP/)
})

test('extractImagesFromZip：目录范围异常抛错', async () => {
  const zip = buildZip([{ name: 'a.png', data: fakePng(6) }])
  // 截断 central directory 部分
  const truncated = zip.subarray(0, zip.length - 30)
  await assert.rejects(() => extractImagesFromZip(truncated))
})
