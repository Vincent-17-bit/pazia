import { useCallback, useEffect, useState } from 'react';

const KEY = 'pazia:subtitleSettings';

export const DEFAULTS = {
  fontFamily: 'sans',
  fontSize: 100,
  fontColor: '#ffffff',
  fontOpacity: 100,
  edgeStyle: 'dropshadow',
  edgeColor: '#000000',
  bgColor: '#000000',
  bgOpacity: 60,
  windowColor: '#000000',
  windowOpacity: 0,
};

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
  } catch {
    return { ...DEFAULTS };
  }
}

export function useSubtitleSettings() {
  const [settings, setSettings] = useState(load);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(settings));
  }, [settings]);

  const update = useCallback((patch) => setSettings((s) => ({ ...s, ...patch })), []);
  const reset = useCallback(() => setSettings({ ...DEFAULTS }), []);

  return { settings, update, reset };
}

const FONT_STACKS = {
  sans: "'Inter', Helvetica, Arial, sans-serif",
  serif: "Georgia, 'Times New Roman', serif",
  monospace: "'Courier New', monospace",
  casual: "'Comic Sans MS', 'Segoe Print', cursive",
};

const EDGE_SHADOWS = {
  none: 'none',
  dropshadow: '1px 1px 2px var(--sub-edge)',
  raised: '-1px -1px 1px var(--sub-edge), 1px 1px 1px rgba(0,0,0,0.6)',
  depressed: '1px 1px 1px var(--sub-edge), -1px -1px 1px rgba(0,0,0,0.6)',
  outline: '1px 0 var(--sub-edge), -1px 0 var(--sub-edge), 0 1px var(--sub-edge), 0 -1px var(--sub-edge)',
};

export function subtitleCssVars(settings) {
  return {
    '--sub-font': FONT_STACKS[settings.fontFamily] || FONT_STACKS.sans,
    '--sub-size': `${settings.fontSize}%`,
    '--sub-color': settings.fontColor,
    '--sub-color-opacity': settings.fontOpacity / 100,
    '--sub-edge': settings.edgeColor,
    '--sub-edge-shadow': EDGE_SHADOWS[settings.edgeStyle] || 'none',
    '--sub-bg': settings.bgColor,
    '--sub-bg-opacity': settings.bgOpacity / 100,
    '--sub-window': settings.windowColor,
    '--sub-window-opacity': settings.windowOpacity / 100,
  };
}
