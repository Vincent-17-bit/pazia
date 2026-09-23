export default function ErrorOverlay({ message, onRetry, onBack }) {
  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-4 bg-black text-center px-6">
      <p className="text-white text-sm max-w-xs">{message}</p>
      <div className="flex gap-3">
        <button onClick={onRetry} className="bg-red rounded-md px-4 py-2 text-sm font-semibold">Retry</button>
        <button onClick={onBack} className="border border-line rounded-md px-4 py-2 text-sm">Back to Details</button>
      </div>
    </div>
  );
}
