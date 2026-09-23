export default function BufferingSpinner({ weakConnection }) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 pointer-events-none">
      <div className="w-10 h-10 rounded-full border-2 border-white/25 border-t-white animate-spin" />
      {weakConnection && (
        <div className="bg-black/70 text-white text-xs rounded-full px-3 py-1.5">Weak connection — lowering quality</div>
      )}
    </div>
  );
}
