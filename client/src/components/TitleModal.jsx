import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import TitleContent from './TitleContent.jsx';

export default function TitleModal({ background }) {
  const { mediaType, id } = useParams();
  const navigate = useNavigate();
  const [activeType, setActiveType] = useState(mediaType);
  const [activeId, setActiveId] = useState(id);
  const scrollRef = useRef(null);
  const touchStartY = useRef(null);

  useEffect(() => {
    setActiveType(mediaType);
    setActiveId(id);
  }, [mediaType, id]);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, 0);
  }, [activeType, activeId]);

  const [closing, setClosing] = useState(false);

  function close() {
    if (closing) return;
    setClosing(true);
    setTimeout(() => navigate(-1), 220);
  }

  useEffect(() => {
    function onEsc(e) { if (e.key === 'Escape') close(); }
    document.addEventListener('keydown', onEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onEsc);
      document.body.style.overflow = '';
    };
  }, []);

  function onSwap(nextType, nextId) {
    setActiveType(nextType);
    setActiveId(nextId);
    navigate(`/title/${nextType}/${nextId}`, { replace: true, state: { background } });
  }

  function onTouchStart(e) {
    if (scrollRef.current.scrollTop === 0) touchStartY.current = e.touches[0].clientY;
  }
  function onTouchMove(e) {
    if (touchStartY.current == null) return;
    const dy = e.touches[0].clientY - touchStartY.current;
    if (dy > 120) {
      touchStartY.current = null;
      close();
    }
  }
  function onTouchEnd() {
    touchStartY.current = null;
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-end md:items-center justify-center" role="dialog" aria-modal="true">
      <div
        className={`absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-200 ${closing ? 'opacity-0' : 'opacity-100'}`}
        onClick={close}
      />
      <div
        ref={scrollRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className={`relative w-full md:max-w-3xl md:max-h-[88vh] md:rounded-xl bg-bg overflow-y-auto max-h-[92vh] transition-opacity duration-200 md:duration-200 ${
          closing ? 'animate-sheet-down md:animate-none md:opacity-0' : 'animate-sheet-up md:animate-none'
        }`}
      >
        <div className="md:hidden sticky top-0 z-10 flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/30" />
        </div>
        <TitleContent
          mediaType={activeType}
          id={activeId}
          variant="modal"
          onClose={close}
          onNavigateTitle={onSwap}
        />
      </div>
    </div>
  );
}
