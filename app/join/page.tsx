import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { AcceptInviteForm } from '@/components/team-forms';
export default async function Join({ searchParams }: { searchParams: Promise<{token?: string}> }) {
  const { token = '' } = await searchParams;
  const validToken = /^[0-9a-f-]{72}$/i.test(token) ? token : '';
  const { data: { user } } = await (await createClient()).auth.getUser();
  return <main className="onboarding-shell"><section className="panel auth-panel"><p className="eyebrow">TEAM INVITATION</p><h1>Join your teammates</h1><p className="muted">Use the verified email this invitation was sent to. Department access is assigned by your team administrator.</p>{user ? <AcceptInviteForm token={validToken}/> : <><p>Sign in or create an account before accepting this invitation.</p><Link className="button" href={'/login?invite='+encodeURIComponent(validToken)}>Sign in to accept</Link></>}</section></main>;
}
