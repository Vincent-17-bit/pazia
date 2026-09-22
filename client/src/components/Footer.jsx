import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="px-5 pt-10 pb-[60px] border-t border-line mt-8">
      <p className="text-xs text-inkdim leading-relaxed">
        This product uses the TMDB API but is not endorsed or certified by TMDB.
      </p>
      <div className="flex gap-4 mt-2.5">
        <Link to="/terms" className="text-xs text-inkdim">Terms</Link>
        <Link to="/privacy" className="text-xs text-inkdim">Privacy</Link>
        <Link to="/dmca" className="text-xs text-inkdim">DMCA</Link>
      </div>
    </footer>
  );
}
