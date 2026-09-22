const TABS = [
  { key: 'home', label: 'Home' },
  { key: 'tvshows', label: 'TV Shows' },
  { key: 'movies', label: 'Movies' },
  { key: 'series', label: 'Series' },
  { key: 'swahili', label: 'Swahili' },
];

export default function TabsBar({ active, onChange }) {
  function onKeyDown(e) {
    if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    const idx = TABS.findIndex((t) => t.key === active);
    const next = e.key === 'ArrowRight' ? (idx + 1) % TABS.length : (idx - 1 + TABS.length) % TABS.length;
    onChange(TABS[next].key);
    document.getElementById(`tab-${TABS[next].key}`)?.focus();
  }

  return (
    <nav
      role="tablist"
      aria-label="Browse"
      onKeyDown={onKeyDown}
      className="fixed left-0 right-0 z-40 flex gap-2.5 overflow-x-auto no-scrollbar px-5 py-3 top-[calc(66px+env(safe-area-inset-top,0px))] bg-gradient-to-b from-bg/85 to-transparent"
    >
      {TABS.map((t) => (
        <button
          key={t.key}
          id={`tab-${t.key}`}
          role="tab"
          aria-selected={active === t.key}
          onClick={() => onChange(t.key)}
          className={`flex-none whitespace-nowrap px-[18px] py-2 rounded-full text-sm border ${
            active === t.key ? 'bg-red border-red text-white font-semibold' : 'border-line text-inkdim font-medium'
          }`}
        >
          {t.label}
        </button>
      ))}
    </nav>
  );
}
