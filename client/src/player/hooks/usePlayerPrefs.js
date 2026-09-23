const KEY = 'pazia:playerPrefs';

export function loadPlayerPrefs() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY));
    return { volume: raw?.volume ?? 1, muted: raw?.muted ?? false };
  } catch {
    return { volume: 1, muted: false };
  }
}

export function savePlayerPrefs(prefs) {
  localStorage.setItem(KEY, JSON.stringify(prefs));
}
