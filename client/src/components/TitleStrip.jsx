export default function TitleStrip({ items, activeId, onSelect }) {
  if (!items?.length) return null;
  return (
    <div className="overflow-x-auto overflow-y-hidden no-scrollbar [mask-image:linear-gradient(90deg,transparent,#000_24px,#000_calc(100%-24px),transparent)]">
      <div className="inline-flex items-baseline text-[13px] py-0.5 whitespace-nowrap">
        {items.map((it, i) => (
          <span key={it.id}>
            <span
              id={`strip-${it.id}`}
              role="button"
              tabIndex={0}
              aria-current={it.id === activeId}
              onClick={() => onSelect(it)}
              onKeyDown={(e) => e.key === 'Enter' && onSelect(it)}
              className={`px-1 cursor-pointer ${it.id === activeId ? 'text-ink font-semibold' : 'text-inkdim'}`}
            >
              {it.title}
            </span>
            {i < items.length - 1 && <span className="text-red mx-0.5">·</span>}
          </span>
        ))}
      </div>
    </div>
  );
}
