const COPY = {
  terms: { title: 'Terms of Service', body: 'These are placeholder terms for the Netstreamz demo. Replace with your own legal copy before launch.' },
  privacy: { title: 'Privacy Policy', body: 'This is placeholder privacy copy for the Netstreamz demo. Replace with your own legal copy before launch.' },
  dmca: { title: 'DMCA Policy', body: 'This is a placeholder DMCA policy for the Netstreamz demo. Replace with your own legal copy before launch.' },
};

export default function Legal({ page }) {
  const c = COPY[page];
  return (
    <div className="px-5 pt-[calc(120px+env(safe-area-inset-top,0px))] pb-16 max-w-xl">
      <h1 className="text-xl font-bold mb-4">{c.title}</h1>
      <p className="text-sm text-inkdim leading-relaxed">{c.body}</p>
    </div>
  );
}
