'use client';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return <section className="panel error-panel"><p className="eyebrow">CONNECTION ISSUE</p><h1>Couldn’t load items.</h1><p>Check connection and retry. Your saved work remains in the database.</p><button onClick={reset}>Retry</button></section>;
}
