import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { grad } from './PosterCard.jsx';
import { api } from '../lib/api.js';

const RECENT_KEY = 'pazia:recentSearches';
function readRecent() {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY)) || []; } catch { return []; }
}
function pushRecent(q) {
  const list = [q, ...readRecent().filter((r) => r !== q)].slice(0, 8);
  localStorage.setItem(RECENT_KEY, JSON.stringify(list));
  return list;
}

export default function SearchOverlay({ open, onClose }) {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('idle');
  const [results, setResults] = useState([]);
  const [topSearches, setTopSearches] = useState([]);
  const [recent, setRecent] = useState(readRecent);
  const [listening, setListening] = useState(false);
  const inputRef = useRef(null);
  const timerRef = useRef(null);
  const recognitionRef = useRef(null);
  const navigate = useNavigate();

  const SpeechRecognition = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);

  function startVoiceSearch() {
    if (!SpeechRecognition) return;
    const rec = new SpeechRecognition();
    rec.lang = 'en-US';
    rec.interimResults = false;
    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onresult = (e) => setQ(e.results[0][0].transcript);
    recognitionRef.current = rec;
    rec.start();
  }

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      api.search({}).then((r) => setTopSearches(r.topSearches || [])).catch(() => {});
    } else {
      setQ('');
      setStatus('idle');
      setResults([]);
      recognitionRef.current?.stop();
    }
  }, [open]);

  useEffect(() => {
    clearTimeout(timerRef.current);
    if (!q.trim()) {
      setStatus('idle');
      setResults([]);
      return;
    }
    setStatus('searching');
    timerRef.current = setTimeout(async () => {
      try {
        const r = await api.search({ q: q.trim() });
        setResults(r.items || []);
        setStatus('done');
      } catch {
        setStatus('error');
      }
    }, 300);
    return () => clearTimeout(timerRef.current);
  }, [q]);

  function runQuery(text) {
    setQ(text);
    setRecent(pushRecent(text));
  }

  function goToTitle(item) {
    pushRecent(q);
    onClose();
    navigate(`/title/${item.mediaType}/${item.id}`);
  }

  useEffect(() => {
    function onEsc(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [onClose]);

  return (
    <div
      className={`fixed inset-0 z-[100] transition-opacity duration-200 ${open ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
    >
      <div className="absolute inset-0 bg-bg/70 backdrop-blur-md backdrop-saturate-50" onClick={onClose} />
      <div
        className={`relative z-10 h-full flex flex-col px-5 pb-5 pt-[calc(16px+env(safe-area-inset-top,0px))] transition-transform duration-200 ${
          open ? 'translate-y-0' : '-translate-y-2'
        }`}
      >
        <div className="flex items-center gap-3 mb-4.5">
          <div className="flex-1 flex items-center gap-2.5 bg-surface border border-line rounded-[10px] px-3.5 py-2.5">
            <svg viewBox="0 0 24 24" className="w-4.5 h-4.5 stroke-inkdim fill-none stroke-2 flex-none">
              <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.6" y2="16.6" />
            </svg>
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search titles, people, genres…"
              autoComplete="off"
              className="flex-1 bg-transparent outline-none text-[15px] placeholder:text-inkdim/55"
            />
            {SpeechRecognition && (
              <button
                type="button"
                aria-label="Voice search"
                onClick={startVoiceSearch}
                className={`flex-none w-6 h-6 flex items-center justify-center rounded-full ${listening ? 'text-red' : 'text-inkdim'}`}
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-current fill-none stroke-2">
                  <rect x="9" y="2" width="6" height="12" rx="3" />
                  <path d="M5 10a7 7 0 0 0 14 0M12 19v3" />
                </svg>
              </button>
            )}
          </div>
          <button onClick={onClose} aria-label="Close search" className="w-9 h-9 flex-none rounded-full bg-surface2 border border-line flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-4.5 h-4.5 stroke-ink fill-none stroke-2">
              <line x1="5" y1="5" x2="19" y2="19" /><line x1="19" y1="5" x2="5" y2="19" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {status === 'idle' && (
            <>
              {recent.length > 0 && (
                <div className="mb-5">
                  <div className="text-[13px] font-semibold text-inkdim mb-3">Recent</div>
                  <div className="flex flex-wrap gap-2">
                    {recent.map((r) => (
                      <button key={r} onClick={() => runQuery(r)} className="px-3.5 py-2 rounded-full border border-line text-[13px] text-inkdim">{r}</button>
                    ))}
                  </div>
                </div>
              )}
              <div className="text-[13px] font-semibold text-inkdim mb-3">Top searches</div>
              <div className="flex flex-wrap gap-2">
                {topSearches.map((t) => (
                  <button key={t} onClick={() => runQuery(t)} className="px-3.5 py-2 rounded-full border border-line text-[13px] text-inkdim">{t}</button>
                ))}
              </div>
            </>
          )}

          {status === 'searching' && <div className="text-[13px] text-inkdim py-2">Searching…</div>}
          {status === 'error' && <div className="text-[13px] text-inkdim py-2">Something went wrong. Try again.</div>}
          {status === 'done' && results.length === 0 && (
            <div className="text-[13px] text-inkdim py-2">No matches for "{q}".</div>
          )}
          {status === 'done' && results.length > 0 && (
            <div className="grid gap-3.5" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(110px,1fr))' }}>
              {results.map((r) => (
                <button key={`${r.mediaType}-${r.id}`} onClick={() => goToTitle(r)} className="text-left">
                  <div
                    className="w-full h-[150px] rounded-lg bg-cover bg-center"
                    style={{ backgroundImage: r.posterPath ? `url(${r.posterPath})` : grad(r.colorSeed ?? 0) }}
                  />
                  <div className="text-xs mt-1.5 leading-snug">{r.title}</div>
                  <div className="text-[11px] text-inkdim">{r.year}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
