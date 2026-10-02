'use server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getAccount, getWorkspace } from '@/lib/workspaces';
import type { FormState } from '@/lib/actions';
export type TeamState = FormState & { token?: string };
const failure = (error: unknown): TeamState => ({ error: error instanceof Error ? error.message : error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' ? error.message : 'Please retry.' });
function expectedTeam(form: FormData, id: string) { if (form.get('workspace_id') !== id) throw new Error('Your active team changed. Refresh this page before saving.'); }
async function selectTeam(id: string) { (await cookies()).set('active_workspace', id, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60*60*24*365 }); revalidatePath('/', 'layout'); }
export async function switchWorkspace(form: FormData) {
  const { workspaces } = await getAccount();
  const id = String(form.get('workspace_id'));
  if (!workspaces.some(team => team.id === id)) throw new Error('You are not a member of this workspace.');
  await selectTeam(id); redirect('/');
}
export async function signOut() {
  await (await createClient()).auth.signOut();
  (await cookies()).delete('active_workspace'); redirect('/login');
}
export async function authenticate(_: TeamState, form: FormData): Promise<TeamState> {
  const db = await createClient();
  const email = String(form.get('email') ?? '').trim();
  const password = String(form.get('password') ?? '');
  if (!email || password.length < 8 || password.length > 128) return { error: 'Enter your email and a password of 8–128 characters.' };
  const signup = form.get('mode') === 'signup';
  if (signup) {
    const origin = process.env.NODE_ENV === 'production' ? 'https://ea-action-tracker.vercel.app' : 'http://localhost:3000';
    const { data, error } = await db.auth.signUp({ email, password, options: { emailRedirectTo: origin + '/auth/callback' } });
    if (error) return failure(error);
    if (!data.session) return { success: 'Check your email to confirm your account, then sign in here.' };
  } else {
    const { error } = await db.auth.signInWithPassword({ email, password });
    if (error) return { error: 'Sign-in failed. Check your email and password, and confirm your email first.' };
  }
  const invite = String(form.get('invite') ?? '');
  const next = String(form.get('next') ?? '');
  if (/^\/oauth\/consent\?authorization_id=[a-zA-Z0-9%_-]{1,300}$/.test(next)) redirect(next);
  redirect(/^[0-9a-f-]{72}$/i.test(invite) ? '/join?token='+encodeURIComponent(invite) : '/');
}
export async function createWorkspace(_: TeamState, form: FormData): Promise<TeamState> {
  let id: string;
  try {
    await getAccount();
    const name = String(form.get('name') ?? '').trim();
    if (!name || name.length > 100) throw new Error('Team name is required, up to 100 characters.');
    const { data, error } = await (await createClient()).rpc('create_workspace', { p_name: name });
    if (error) throw error; id = data; await selectTeam(id);
  } catch (error) { return failure(error); }
  redirect('/');
}
export async function acceptInvite(_: TeamState, form: FormData): Promise<TeamState> {
  try {
    await getAccount();
    const token = String(form.get('token') ?? '').trim();
    if (!token || token.length > 200) throw new Error('Paste a valid invite code.');
    const { data, error } = await (await createClient()).rpc('accept_workspace_invite', { p_token: token });
    if (error) throw error; await selectTeam(data);
  } catch (error) { return failure(error); }
  redirect('/');
}
export async function inviteMember(_: TeamState, form: FormData): Promise<TeamState> {
  try {
    const { workspace, canManage } = await getWorkspace();
    if (!canManage) throw new Error('Only owners and admins can invite teammates.');
    expectedTeam(form, workspace.id);
    const email = String(form.get('email') ?? '').trim();
    const role = String(form.get('role'));
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) throw new Error('Enter the teammate’s email address.');
    if (!['admin','member','viewer'].includes(role)) throw new Error('Choose a valid team role.');
    const departmentId = role === 'admin' ? null : String(form.get('department_id') ?? '');
    if (role !== 'admin' && !departmentId) throw new Error('Choose the department this teammate can access.');
    const { data, error } = await (await createClient()).rpc('create_workspace_invite', { p_workspace_id: workspace.id, p_email: email, p_role: role, p_department_id: departmentId });
    if (error) throw error;
    revalidatePath('/team'); return { success: 'Invite created. Share this code with the named teammate. It expires in 7 days.', token: data };
  } catch (error) { return failure(error); }
}
export async function manageMember(_: TeamState, form: FormData): Promise<TeamState> {
  try {
    const { workspace, canManage } = await getWorkspace();
    if (!canManage) throw new Error('Only owners and admins can manage teammates.');
    expectedTeam(form, workspace.id);
    const db = await createClient();
    const operation = String(form.get('operation'));
    const userId = String(form.get('user_id'));
    const result = operation === 'remove'
      ? await db.rpc('remove_workspace_member', { p_workspace_id: workspace.id, p_user_id: userId })
      : await db.rpc('set_workspace_member_role', { p_workspace_id: workspace.id, p_user_id: userId, p_role: String(form.get('role')), p_department_id: form.get('role') === 'admin' ? null : String(form.get('department_id') ?? '') });
    if (result.error) throw result.error;
    revalidatePath('/', 'layout'); return { success: 'Team membership updated.' };
  } catch (error) { return failure(error); }
}
export async function revokeInvite(_: TeamState, form: FormData): Promise<TeamState> {
  try {
    const { canManage } = await getWorkspace();
    if (!canManage) throw new Error('Only owners and admins can revoke invites.');
    const { error } = await (await createClient()).rpc('revoke_workspace_invite', { p_invite_id: String(form.get('invite_id')) });
    if (error) throw error; revalidatePath('/team'); return { success: 'Invite revoked.' };
  } catch (error) { return failure(error); }
}
