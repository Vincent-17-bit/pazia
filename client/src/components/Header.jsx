export default function Header({ onMenuClick }) {
  return (
    <header className="fixed top-0 left-0 right-0 z-[110] flex items-center justify-between border-b border-line bg-bg/90 backdrop-blur px-5 py-3 pt-[calc(0.75rem+env(safe-area-inset-top,0px))]">
      <div className="brand w-9 h-9 flex items-center justify-center rounded-[10px] border-2 border-red text-xl font-bold">
        N
      </div>
      <button
        aria-label="Open menu"
        onClick={onMenuClick}
        className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface2"
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-ink fill-none stroke-2">
          <line x1="4" y1="7" x2="20" y2="7" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="17" x2="20" y2="17" />
        </svg>
      </button>
    </header>
  );
}
