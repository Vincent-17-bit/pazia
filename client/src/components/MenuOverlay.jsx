import { useState } from 'react';
import { MENU_CATEGORIES } from '../data/menuCategories.js';

export default function MenuOverlay({ open, onClose, onSearchClick, onSelectSubcategory }) {
  const [openKey, setOpenKey] = useState(null);

  function toggle(key) {
    setOpenKey((k) => (k === key ? null : key));
  }

  function pick(item) {
    setOpenKey(null);
    onClose();
    onSelectSubcategory?.(item);
  }

  return (
    <div className={`fixed inset-0 z-[90] transition-opacity duration-200 ${open ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
      <div className="absolute inset-0 bg-bg/70 backdrop-blur-md backdrop-saturate-50" onClick={onClose} />
      <div
        className={`relative z-10 h-full flex flex-col px-5 pb-5 pt-[calc(16px+env(safe-area-inset-top,0px)+56px)] transition-transform duration-200 ${
          open ? 'translate-y-0' : '-translate-y-2'
        }`}
      >
        <button
          onClick={onSearchClick}
          className="flex items-center gap-2.5 bg-surface border border-line rounded-[10px] px-3.5 py-2.5 mb-4.5 text-left"
        >
          <svg viewBox="0 0 24 24" className="w-4.5 h-4.5 stroke-inkdim fill-none stroke-2 flex-none">
            <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.6" y2="16.6" />
          </svg>
          <span className="text-[15px] text-inkdim/55">Search titles, people, genres…</span>
        </button>

        <div className="border-t border-line mb-2" />

        <div className="flex-1 overflow-y-auto">
          {MENU_CATEGORIES.map((cat) => {
            const isOpen = openKey === cat.key;
            return (
              <div key={cat.key} className="border-b border-line">
                <button
                  onClick={() => toggle(cat.key)}
                  className="w-full flex items-center justify-between py-3.5 text-[15px] font-medium"
                >
                  {cat.label}
                  <svg
                    viewBox="0 0 24 24"
                    className={`w-4 h-4 stroke-inkdim fill-none stroke-2 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
                  >
                    <polyline points="9 6 15 12 9 18" />
                  </svg>
                </button>
                {isOpen && (
                  <div className="pb-3.5 flex flex-col gap-1">
                    {cat.items.map((item) => (
                      <button
                        key={item.rowKey}
                        onClick={() => pick(item)}
                        className="text-left py-2 text-[14px] text-inkdim"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
