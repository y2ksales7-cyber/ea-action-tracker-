import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export type Role = 'owner' | 'admin' | 'member' | 'viewer';
export type Workspace = { id: string; name: string; role: Role };
export const getAccount = cache(async () => {
  const db = await createClient();
  const { data: { user }, error } = await db.auth.getUser();
  if (error || !user) redirect('/login');
  const { data, error: membershipError } = await db.from('workspace_members').select('workspace_id,role,workspaces(id,name)').eq('user_id', user.id);
  if (membershipError) throw new Error('Team workspace setup is unavailable. Please retry or contact the administrator.');
  const workspaces = (data ?? []).flatMap(row => {
    const team = row.workspaces as unknown as {id: string; name: string} | null;
    return team ? [{ ...team, role: row.role as Role }] : [];
  });
  const selected = (await cookies()).get('active_workspace')?.value;
  const workspace = workspaces.find(team => team.id === selected) ?? workspaces[0];
  return { user, workspaces, workspace };
});
export const getWorkspace = cache(async () => {
  const account = await getAccount();
  if (!account.workspace) redirect('/onboarding');
  return { ...account, workspace: account.workspace, canWrite: account.workspace.role !== 'viewer', canManage: ['owner','admin'].includes(account.workspace.role) };
});
export async function writeContext() {
  const context = await getWorkspace();
  if (!context.canWrite) throw new Error('Your viewer role can read commitments. Ask a team owner for editing access.');
  return context;
}
