import { useEffect, useRef, useState } from 'react';
import PosterCard from './PosterCard.jsx';
import SkeletonRow from './SkeletonRow.jsx';

export default function Row({ title, items, loading, lazy = false, onItemClick }) {
  const sectionRef = useRef(null);
  const trackRef = useRef(null);
  const [visible, setVisible] = useState(!lazy);

  useEffect(() => {
    if (!lazy || visible) return;
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { rootMargin: '300px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [lazy, visible]);

  function scrollBy(dir) {
    trackRef.current?.scrollBy({ left: dir * 480, behavior: 'smooth' });
  }

  return (
    <section className="pt-5 pb-1.5" ref={sectionRef}>
      <div className="flex items-baseline justify-between px-5 pb-3">
        <h2 className="text-[17px] font-semibold">{title}</h2>
        <div className="hidden md:flex gap-2">
          <button aria-label={`Scroll ${title} left`} onClick={() => scrollBy(-1)} className="text-inkdim hover:text-ink">‹</button>
          <button aria-label={`Scroll ${title} right`} onClick={() => scrollBy(1)} className="text-inkdim hover:text-ink">›</button>
        </div>
      </div>
      {!visible || loading ? (
        <SkeletonRow />
      ) : (
        <div ref={trackRef} className="flex gap-3 overflow-x-auto no-scrollbar px-5 pb-1.5">
          {items?.map((item) => (
            <PosterCard key={`${item.mediaType}-${item.id}`} item={item} onItemClick={onItemClick} />
          ))}
        </div>
      )}
    </section>
  );
}
