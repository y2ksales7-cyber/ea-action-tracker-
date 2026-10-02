import { createClient } from '@/lib/supabase/server';
import { getWorkspace } from '@/lib/workspaces';
export type Department = { id: string; name: string };
export type Meeting = { id: string; department_id: string; date: string; topic: string; attendees: string[] };
export type Item = { id: string; meeting_id: string; department_id: string; description: string; assignee: string; priority: 'High' | 'Medium' | 'Low'; deadline: string; status: 'Open' | 'In Progress' | 'Done'; notes: string | null };
// Cookie-backed user sessions enforce RLS; never use an administration key here.
export async function database() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase environment is not configured.');
  return createClient();
}
export async function readWorkspace() {
  const context = await getWorkspace();
  const db = await database();
  const [departments, meetings, items] = await Promise.all([
    db.from('departments').select('id,name').eq('workspace_id', context.workspace.id).order('name'),
    db.from('meetings').select('*').eq('workspace_id', context.workspace.id).order('date', { ascending: false }),
    db.from('action_items').select('*').eq('workspace_id', context.workspace.id),
  ]);
  for (const result of [departments, meetings, items]) if (result.error) throw new Error(result.error.message);
  return { departments: departments.data as Department[], meetings: meetings.data as Meeting[], items: items.data as Item[], ...context };
}