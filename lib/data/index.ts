import { createClient } from '@supabase/supabase-js';
export type Department = { id: string; name: string };
export type Meeting = { id: string; department_id: string; date: string; topic: string; attendees: string[] };
export type Item = { id: string; meeting_id: string; department_id: string; description: string; assignee: string; priority: 'High' | 'Medium' | 'Low'; deadline: string; status: 'Open' | 'In Progress' | 'Done'; notes: string | null };
// Use anonymous demo policies, never the service role key.
export function database() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase environment is not configured.');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
export async function readWorkspace() {
  const db = database();
  const [departments, meetings, items] = await Promise.all([
    db.from('departments').select('id,name').order('name'),
    db.from('meetings').select('*').order('date', { ascending: false }),
    db.from('action_items').select('*'),
  ]);
  for (const result of [departments, meetings, items]) if (result.error) throw new Error(result.error.message);
  return { departments: departments.data as Department[], meetings: meetings.data as Meeting[], items: items.data as Item[] };
}
