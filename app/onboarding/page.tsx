import { getAccount } from '@/lib/workspaces';
import { WorkspaceForm, AcceptInviteForm } from '@/components/team-forms';
import { signOut } from '@/lib/team-actions';
export default async function Onboarding() {
  const { user } = await getAccount();
  return <main className="onboarding-shell"><div className="page-heading"><div><p className="eyebrow">WELCOME / {user.email}</p><h1>Find your team’s focus.</h1><p className="subtitle">Create a private workspace or join your teammates.</p></div><form action={signOut}><button className="secondary">Sign out</button></form></div><div className="split-layout"><section className="panel"><h2>Start a team</h2><p className="muted">Five departments are ready for your first meeting. You’ll be the team owner.</p><WorkspaceForm/></section><section className="panel"><h2>Have an invitation?</h2><p className="muted">Sign in with the email your teammate invited, then paste your code.</p><AcceptInviteForm/></section></div></main>;
}
