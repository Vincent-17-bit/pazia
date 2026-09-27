// Reads just enough of an mp4 (via HTTP Range) to find the mvhd box and
// compute duration, so we can rank/filter external video sources by real
// length without downloading the whole file or shelling out to ffprobe.

const HEAD_BYTES = 262144; // 256KB — covers moov when the file is faststart-optimized
const TAIL_BYTES = 524288; // 512KB — moov is often larger when it trails mdat

async function rangeFetch(url, start, end, timeoutMs) {
  const res = await fetch(url, {
    headers: { Range: `bytes=${start}-${end}` },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok && res.status !== 206) throw new Error(`range fetch ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

function findBox(buf, type, start = 0, end = buf.length) {
  let offset = start;
  while (offset + 8 <= end) {
    const size = buf.readUInt32BE(offset);
    const boxType = buf.toString('ascii', offset + 4, offset + 8);
    if (size < 8) break; // malformed or 64-bit size we don't handle
    if (boxType === type) return { start: offset, size, bodyStart: offset + 8 };
    offset += size;
  }
  return null;
}

function readMvhdDuration(buf, mvhdBodyStart) {
  const version = buf.readUInt8(mvhdBodyStart);
  if (version === 1) {
    const timescale = buf.readUInt32BE(mvhdBodyStart + 20);
    const duration = Number(buf.readBigUInt64BE(mvhdBodyStart + 24));
    return timescale ? duration / timescale : 0;
  }
  const timescale = buf.readUInt32BE(mvhdBodyStart + 12);
  const duration = buf.readUInt32BE(mvhdBodyStart + 16);
  return timescale ? duration / timescale : 0;
}

function durationFromMoovChunk(buf) {
  const moov = findBox(buf, 'moov');
  if (!moov) return 0;
  const mvhd = findBox(buf, 'mvhd', moov.bodyStart, moov.start + moov.size);
  if (!mvhd) return 0;
  try {
    return readMvhdDuration(buf, mvhd.bodyStart);
  } catch {
    return 0;
  }
}

export async function probeMp4DurationSeconds(url, { timeoutMs = 6000 } = {}) {
  try {
    const head = await rangeFetch(url, 0, HEAD_BYTES - 1, timeoutMs);
    const fromHead = durationFromMoovChunk(head);
    if (fromHead) return Math.round(fromHead);

    const headRes = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(timeoutMs) });
    const len = Number(headRes.headers.get('content-length') || 0);
    if (!len) return 0;

    const tailStart = Math.max(0, len - TAIL_BYTES);
    const tail = await rangeFetch(url, tailStart, len - 1, timeoutMs);
    return Math.round(durationFromMoovChunk(tail));
  } catch {
    return 0;
  }
}
