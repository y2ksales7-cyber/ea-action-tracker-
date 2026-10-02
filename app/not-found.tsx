import Link from 'next/link';
export default function NotFound() {
  return <section className="panel"><h1>This record isn’t here.</h1><p>It may have been deleted. Return to the workspace to continue.</p><Link href="/" className="button">Back to board</Link></section>;
}
