import { getWorkspace } from '@/lib/workspaces';
import type { Department } from '@/lib/data';
import { createClient } from '@/lib/supabase/server';
import { InviteForm, MemberForm, WorkspaceForm, AcceptInviteForm, RevokeInviteForm } from '@/components/team-forms';
type Member = { user_id: string; role: string; display_name: string; email: string; joined_at: string; department_id: string | null };
type Invite = { id: string; email: string; role: string; expires_at: string; accepted_at: string|null; revoked_at: string|null };
export default async function Team() {
  const { workspace, user, canManage } = await getWorkspace();
  const db = await createClient();
  const membersResult = await db.rpc('list_workspace_members', { p_workspace_id: workspace.id });
  if (membersResult.error) throw new Error(membersResult.error.message);
  const invitesResult = canManage ? await db.rpc('list_workspace_invites', { p_workspace_id: workspace.id }) : { data: [], error: null };
  if (invitesResult.error) throw new Error(invitesResult.error.message);
  const { data: departmentRows, error: departmentError } = await db.from('departments').select('id,name').eq('workspace_id', workspace.id).order('name');
  if (departmentError) throw new Error(departmentError.message);
  const departments = departmentRows as Department[];
  const members = membersResult.data as Member[];
  const invites = (invitesResult.data as Invite[]).filter(invite => !invite.accepted_at && !invite.revoked_at && Date.parse(invite.expires_at) > Date.now());
  return <><div className="page-heading"><div><p className="eyebrow">PRIVATE TEAM WORKSPACE</p><h1>{workspace.name}</h1><p className="subtitle">Your role: {workspace.role === 'member' ? 'editor' : workspace.role} · {members.length} teammates</p></div></div><div className="split-layout"><section className="panel"><h2>Team members</h2>{members.map(member => <article className="team-member" key={member.user_id}><h3>{member.display_name || member.email}</h3><p className="muted">{member.email} · {member.role === 'member' ? 'editor' : member.role}{member.department_id ? ' · ' + (departments.find(department => department.id === member.department_id)?.name ?? 'Department access') : ' · All departments'}{member.user_id === user.id ? ' · You' : ''}</p>{canManage && member.role !== 'owner' && member.user_id !== user.id && <MemberForm userId={member.user_id} role={member.role} departmentId={member.department_id} departments={departments} workspaceId={workspace.id}/>}</article>)}</section><div className="side-stack">{canManage && <section className="panel"><h2>Invite a teammate</h2><p className="muted">Create a code and share it yourself. Only the named email can accept it.</p><InviteForm departments={departments} workspaceId={workspace.id}/></section>}<section className="panel"><h2>Workspace roles</h2><p>Owners and admins manage teammates. Editors manage meetings and actions. Department editors and viewers see only their assigned department. Owners and admins see all departments.</p></section></div></div>{canManage && invites.length > 0 && <section className="panel"><h2>Pending invites</h2>{invites.map(invite => <article className="team-member" key={invite.id}><h3>{invite.email}</h3><p className="muted">{invite.role} · Expires {new Date(invite.expires_at).toLocaleDateString('en-GB')}</p><RevokeInviteForm id={invite.id}/></article>)}</section>}<div className="split-layout team-more"><section className="panel"><h2>Create another workspace</h2><WorkspaceForm/></section><section className="panel"><h2>Join another team</h2><AcceptInviteForm/></section></div></>;
}
