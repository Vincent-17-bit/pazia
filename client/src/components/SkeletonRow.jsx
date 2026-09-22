export default function SkeletonRow({ count = 6 }) {
  return (
    <div className="flex gap-3 px-5 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex-none w-[132px] h-[198px] rounded-lg bg-surface2 animate-pulse" />
      ))}
    </div>
  );
}
