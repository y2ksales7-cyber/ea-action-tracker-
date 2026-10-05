'use client';
import { useActionState } from 'react';
import type { Department } from '@/lib/data';
import { authenticate, createWorkspace, acceptInvite, inviteMember, manageMember, revokeInvite, type TeamState } from '@/lib/team-actions';
function Feedback({ state }: { state: TeamState }) { return <>{state.error && <p className="form-error" role="alert">{state.error}</p>}{state.success && <p className="form-success" role="status">{state.success}</p>}</>; }
export function AuthForm({ invite = '',next='' }: { invite?: string;next?:string }) {
  const [state, action, pending] = useActionState(authenticate, {});
  return <form action={action} className="editor-form" aria-busy={pending}><input type="hidden" name="invite" value={invite}/><input type="hidden" name="next" value={next}/><label className="full">Email<input type="email" name="email" required autoComplete="email" maxLength={254} /></label><label className="full">Password<input type="password" name="password" required minLength={8} maxLength={128} autoComplete="current-password" /></label><div className="full"><Feedback state={state}/><div className="form-actions"><button name="mode" value="login" disabled={pending}>{pending ? 'Please wait…' : 'Sign in'}</button><button name="mode" value="signup" className="secondary" disabled={pending}>Create account</button></div></div></form>;
}
export function WorkspaceForm() {
  const [state, action, pending] = useActionState(createWorkspace, {});
  return <form action={action} className="editor-form"><label className="full">Team name<input name="name" required maxLength={100} placeholder="Executive Office" /></label><div className="full"><Feedback state={state}/><button disabled={pending}>{pending ? 'Creating…' : 'Create workspace'}</button></div></form>;
}
export function AcceptInviteForm({ token = '' }: { token?: string }) {
  const [state, action, pending] = useActionState(acceptInvite, {});
  return <form action={action} className="editor-form"><label className="full">Invite code<input name="token" required maxLength={200} defaultValue={token} autoComplete="off" /></label><div className="full"><Feedback state={state}/><button disabled={pending}>{pending ? 'Joining…' : 'Join team'}</button></div></form>;
}
export function InviteForm({ departments, workspaceId }: { departments: Department[]; workspaceId: string }) {
  const [state, action, pending] = useActionState(inviteMember, {});
  return <form action={action} className="editor-form"><input type="hidden" name="workspace_id" value={workspaceId}/><label className="full">Teammate email<input type="email" name="email" required maxLength={254}/></label><label className="full">Role<select name="role" defaultValue="member"><option value="member">Editor — manage meetings and actions</option><option value="viewer">Viewer — read only</option><option value="admin">Admin — manage work and teammates</option></select></label><label className="full">Department<select name="department_id" defaultValue=""><option value="">All departments (admins only)</option>{departments.map(department => <option key={department.id} value={department.id}>{department.name}</option>)}</select></label><div className="full"><Feedback state={state}/>{state.token && <label>Share this invite code<textarea readOnly value={state.token} rows={3} onFocus={event => event.target.select()} /><a className="text-link" href={"/join?token="+encodeURIComponent(state.token)}>Open invite link →</a><small className="muted">Share this code or copy the invite link for your teammate.</small></label>}<button disabled={pending}>{pending ? 'Creating…' : 'Create invite code'}</button></div></form>;
}
export function MemberForm({ userId, role, departmentId, departments, workspaceId }: { workspaceId: string; userId: string; role: string; departmentId: string | null; departments: Department[] }) {
  const [state, action, pending] = useActionState(manageMember, {});
  return <form action={action} className="member-controls"><input type="hidden" name="workspace_id" value={workspaceId}/><input type="hidden" name="user_id" value={userId}/><label>Role<select name="role" defaultValue={role}><option value="admin">Admin</option><option value="member">Editor</option><option value="viewer">Viewer</option></select></label><label>Department<select name="department_id" defaultValue={departmentId ?? ""}><option value="">All departments (admins only)</option>{departments.map(department => <option key={department.id} value={department.id}>{department.name}</option>)}</select></label><div className="form-actions"><button name="operation" value="role" disabled={pending}>Save role</button><button className="secondary" name="operation" value="remove" disabled={pending}>Remove from team</button></div><Feedback state={state}/></form>;
}
export function RevokeInviteForm({ id }: { id: string }) {
  const [state, action, pending] = useActionState(revokeInvite, {});
  return <form action={action}><input type="hidden" name="invite_id" value={id}/><button className="secondary" disabled={pending}>Revoke invite</button><Feedback state={state}/></form>;
}
