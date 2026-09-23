const KEY = 'pazia:ratings';

function readAll() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
}

export function getRating(mediaType, id) {
  return readAll()[`${mediaType}:${id}`] || null;
}

export function setRating(mediaType, id, value) {
  const all = readAll();
  const key = `${mediaType}:${id}`;
  if (all[key] === value) delete all[key];
  else all[key] = value;
  localStorage.setItem(KEY, JSON.stringify(all));
  return all[key] || null;
}
