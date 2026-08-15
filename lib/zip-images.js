import path from 'node:path';
import { inflateRaw } from 'node:zlib';

const SUPPORTED_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp']);
const MAX_ENTRIES = 500;
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const MAX_TOTAL_BYTES = 200 * 1024 * 1024;

function findEndOfCentralDirectory(buffer) {
  const start = Math.max(0, buffer.length - 65557);
  for (let i = buffer.length - 22; i >= start; i--) {
    if (buffer.readUInt32LE(i) === 0x06054b50) return i;
  }
  return -1;
}

export function hasImageSignature(buffer, ext) {
  if (ext === 'png') return buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (ext === 'jpg' || ext === 'jpeg') return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (ext === 'gif') return buffer.length >= 6 && ['GIF87a', 'GIF89a'].includes(buffer.toString('ascii', 0, 6));
  if (ext === 'webp') return buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';
  if (ext === 'bmp') return buffer.length >= 2 && buffer.toString('ascii', 0, 2) === 'BM';
  return false;
}

// v0.25.0 - 按真实文件签名识别格式（扩展名不可信时兜底：从群/聊天软件复制的动图常被存成 .jpg）
export function detectImageFormat(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 4) return null;
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return 'png';
  if (buffer.length >= 6 && ['GIF87a', 'GIF89a'].includes(buffer.toString('ascii', 0, 6))) return 'gif';
  if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return 'webp';
  if (buffer.length >= 2 && buffer.toString('ascii', 0, 2) === 'BM') return 'bmp';
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'jpg';
  return null;
}

function inflateRawLimited(buffer) {
  return new Promise((resolve, reject) => {
    inflateRaw(buffer, { maxOutputLength: MAX_IMAGE_BYTES }, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
  });
}

export async function extractImagesFromZip(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 22) throw new Error('ZIP 文件无效或已损坏');

  const eocd = findEndOfCentralDirectory(buffer);
  if (eocd < 0) throw new Error('找不到 ZIP 目录信息');

  const diskNumber = buffer.readUInt16LE(eocd + 4);
  const centralDisk = buffer.readUInt16LE(eocd + 6);
  const entryCount = buffer.readUInt16LE(eocd + 10);
  const centralSize = buffer.readUInt32LE(eocd + 12);
  const centralOffset = buffer.readUInt32LE(eocd + 16);

  if (diskNumber !== 0 || centralDisk !== 0) throw new Error('暂不支持分卷 ZIP');
  if (entryCount > MAX_ENTRIES) throw new Error(`ZIP 内文件过多，最多支持 ${MAX_ENTRIES} 个`);
  if (centralOffset + centralSize > buffer.length) throw new Error('ZIP 目录范围异常');

  const images = [];
  const skipped = [];
  let offset = centralOffset;
  let totalBytes = 0;

  for (let index = 0; index < entryCount; index++) {
    if (offset + 46 > buffer.length || buffer.readUInt32LE(offset) !== 0x02014b50) {
      throw new Error('ZIP 目录条目损坏');
    }

    const flags = buffer.readUInt16LE(offset + 8);
    const method = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const uncompressedSize = buffer.readUInt32LE(offset + 24);
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localOffset = buffer.readUInt32LE(offset + 42);
    const nameEnd = offset + 46 + nameLength;
    if (nameEnd > buffer.length) throw new Error('ZIP 文件名信息损坏');

    const encoding = (flags & 0x0800) ? 'utf8' : 'latin1';
    const rawName = buffer.toString(encoding, offset + 46, nameEnd).replace(/\\/g, '/');
    const fileName = path.posix.basename(rawName);
    const ext = fileName.includes('.') ? fileName.split('.').pop().toLowerCase() : '';
    offset = nameEnd + extraLength + commentLength;

    if (!fileName || rawName.endsWith('/')) continue;
    if (!SUPPORTED_EXTENSIONS.has(ext)) {
      skipped.push({ file: fileName, reason: '不是支持的图片格式' });
      continue;
    }
    if (flags & 0x0001) {
      skipped.push({ file: fileName, reason: '加密文件无法读取' });
      continue;
    }
    if (![0, 8].includes(method)) {
      skipped.push({ file: fileName, reason: '不支持的压缩方式' });
      continue;
    }
    if (uncompressedSize > MAX_IMAGE_BYTES) {
      skipped.push({ file: fileName, reason: '单张图片超过 20MB' });
      continue;
    }
    totalBytes += uncompressedSize;
    if (totalBytes > MAX_TOTAL_BYTES) throw new Error('ZIP 解压后的图片总大小超过 200MB');

    if (localOffset + 30 > buffer.length || buffer.readUInt32LE(localOffset) !== 0x04034b50) {
      skipped.push({ file: fileName, reason: '本地文件头损坏' });
      continue;
    }
    const localNameLength = buffer.readUInt16LE(localOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localOffset + 28);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    const dataEnd = dataStart + compressedSize;
    if (dataEnd > buffer.length) {
      skipped.push({ file: fileName, reason: '压缩数据不完整' });
      continue;
    }

    try {
      const compressed = buffer.subarray(dataStart, dataEnd);
      const data = method === 0 ? Buffer.from(compressed) : await inflateRawLimited(compressed);
      if (data.length !== uncompressedSize || !hasImageSignature(data, ext)) {
        skipped.push({ file: fileName, reason: '图片内容与格式不符' });
        continue;
      }
      images.push({ fileName, ext, data });
    } catch {
      skipped.push({ file: fileName, reason: '解压失败' });
    }
  }

  return { images, skipped };
}
