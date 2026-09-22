export default function Header({ onSearchClick }) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between border-b border-line bg-bg/90 backdrop-blur px-5 py-3 pt-[calc(0.75rem+env(safe-area-inset-top,0px))]">
      <div className="brand w-9 h-9 flex items-center justify-center rounded-[10px] border-2 border-red text-xl font-bold">
        P
      </div>
      <button
        aria-label="Open search"
        onClick={onSearchClick}
        className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface2"
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-ink fill-none stroke-2">
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.6" y2="16.6" />
        </svg>
      </button>
    </header>
  );
}
