import { NavLink } from 'react-router-dom';

const ITEMS = [
  { to: '/', label: 'Home', icon: 'M3 11l9-8 9 8M5 10v10h14V10' },
  { to: '/search', label: 'Search', icon: 'M11 4a7 7 0 100 14 7 7 0 000-14zM21 21l-4.35-4.35' },
  { to: '/my-list', label: 'My List', icon: 'M12 5v14M5 12h14' },
  { to: '/history', label: 'Profile', icon: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 20c1.5-4 5-6 8-6s6.5 2 8 6' },
];

export default function BottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex justify-around bg-bg/95 backdrop-blur border-t border-line py-2 pb-[calc(8px+env(safe-area-inset-bottom,0px))]">
      {ITEMS.map((it) => (
        <NavLink
          key={it.to}
          to={it.to}
          end={it.to === '/'}
          className={({ isActive }) => `flex flex-col items-center gap-1 text-[10px] ${isActive ? 'text-red' : 'text-inkdim'}`}
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-current fill-none stroke-2">
            <path d={it.icon} />
          </svg>
          {it.label}
        </NavLink>
      ))}
    </nav>
  );
}
