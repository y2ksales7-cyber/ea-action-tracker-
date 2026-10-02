import { AuthForm } from '@/components/team-forms';
export default async function Login({ searchParams }: { searchParams: Promise<{invite?: string}> }) {
  const { invite = '' } = await searchParams;
  return <main className="auth-shell"><section className="auth-intro"><p className="eyebrow">EA / EXECUTIVE OFFICE</p><h1>Every commitment.<br/>A clear next step.</h1><p>Bring your team’s meetings, priorities and follow-ups into one private workspace.</p><div className="auth-benefits"><p>01 · Capture the commitments</p><p>02 · Chase what matters first</p><p>03 · Keep your team accountable</p></div></section><section className="panel auth-panel"><p className="eyebrow">YOUR TEAM’S WORKSPACE</p><h2>Welcome to Action Tracker</h2><p className="muted">Sign in or create an account. New accounts require email confirmation.</p><AuthForm invite={invite}/><p className="muted">Your team’s data is private. Invite codes work only for the intended email address.</p></section></main>;
}
