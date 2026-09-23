function toSeconds(ts) {
  const m = ts.trim().match(/(?:(\d+):)?(\d{2}):(\d{2})[.,](\d{3})/);
  if (!m) return 0;
  const [, h, mm, ss, ms] = m;
  return (Number(h) || 0) * 3600 + Number(mm) * 60 + Number(ss) + Number(ms) / 1000;
}

export function parseVtt(text) {
  const lines = text.replace(/\r/g, '').split('\n');
  const cues = [];
  let i = 0;
  while (i < lines.length && !lines[i].includes('-->')) i++;
  while (i < lines.length) {
    if (lines[i].includes('-->')) {
      const [start, end] = lines[i].split('-->');
      const body = [];
      i++;
      while (i < lines.length && lines[i].trim() !== '') {
        body.push(lines[i].replace(/<[^>]+>/g, ''));
        i++;
      }
      cues.push({ start: toSeconds(start), end: toSeconds(end), text: body.join('\n') });
    }
    i++;
  }
  return cues;
}

export function getActiveCue(cues, time) {
  if (!cues?.length) return null;
  return cues.find((c) => time >= c.start && time <= c.end) || null;
}
