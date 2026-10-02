export default function Loading() {
  return <div role="status" aria-label="Loading workspace"><div className="skeleton title" />{[1,2,3].map(n => <div key={n} className="skeleton" />)}<span className="sr-only">Loading workspace…</span></div>;
}
