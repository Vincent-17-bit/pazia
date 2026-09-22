import { Link } from 'react-router-dom';

const GRADIENTS = [
  ['#3a0d10', '#0b0b0f'], ['#4a1116', '#1a0508'], ['#2a0a10', '#0b0b0f'],
  ['#5c1018', '#120306'], ['#331013', '#0b0b0f'], ['#421015', '#150507'],
];
function grad(seed = 0) {
  const [a, b] = GRADIENTS[seed % GRADIENTS.length];
  return `linear-gradient(135deg, ${a}, ${b})`;
}

export default function PosterCard({ item, wide = false }) {
  const bg = item.posterPath ? `url(${item.posterPath})` : grad(item.colorSeed ?? item.id?.length ?? 0);
  return (
    <Link
      to={`/title/${item.mediaType}/${item.id}`}
      className="group flex-none"
      style={{ width: wide ? 210 : 132 }}
    >
      <div
        className="rounded-lg bg-cover bg-center flex items-end p-2 overflow-hidden transition-transform duration-200 group-hover:scale-[1.08]"
        style={{ height: wide ? 118 : 198, backgroundImage: bg }}
      >
        {!item.posterPath && (
          <span className="text-[11px] font-semibold text-white [text-shadow:0_1px_4px_rgba(0,0,0,0.6)]">
            {item.title}
          </span>
        )}
      </div>
    </Link>
  );
}

export { grad };
