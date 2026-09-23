export default function SkeletonRow({ count = 6 }) {
  return (
    <div className="flex gap-3 px-5 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex-none w-[112px] sm:w-[132px] md:w-[152px] lg:w-[172px] xl:w-[188px] aspect-[2/3] rounded-lg bg-surface2 animate-pulse" />
      ))}
    </div>
  );
}
