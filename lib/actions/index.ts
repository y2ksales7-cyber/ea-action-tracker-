'use server';
import { database } from '@/lib/data';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
export type FormState = { error?: string; success?: string };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function field(form: FormData, key: string, max = 500) {
  const value = String(form.get(key) ?? '').trim();
  if (!value || value.length > max) throw new Error(`${key.replaceAll('_', ' ')} is required (maximum ${max} characters).`);
  return value;
}
function id(form: FormData, key: string) {
  const value = field(form, key);
  if (!uuid.test(value)) throw new Error('Select a valid meeting or department.');
  return value;
}
function date(form: FormData, key: string) {
  const value = field(form, key);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value) throw new Error('Enter a valid date.');
  return value;
}
function choice(form: FormData, key: string, values: string[]) {
  const value = field(form, key);
  if (!values.includes(value)) throw new Error(`Select a valid ${key}.`);
  return value;
}
function refresh() { revalidatePath('/', 'layout'); }
function message(error: unknown): FormState {
  return { error: error instanceof Error ? error.message : 'Could not save. Please retry.' };
}
export async function saveMeeting(_: FormState, form: FormData): Promise<FormState> {
  let meetingId = '';
  try {
    const db = database();
    const department_id = id(form, 'department_id');
    const payload = { department_id, date: date(form, 'date'), topic: field(form, 'topic', 200), attendees: String(form.get('attendees') ?? '').split(',').map(v => v.trim()).filter(Boolean) };
    if (form.get('id')) {
      meetingId = id(form, 'id');
      const { data: current, error: lookup } = await db.from('meetings').select('department_id').eq('id', meetingId).single();
      if (lookup) throw new Error('Meeting no longer exists. Refresh and retry.');
      if (current.department_id !== department_id) throw new Error('The department of an existing meeting cannot be changed.');
      const { error, data } = await db.from('meetings').update(payload).eq('id', meetingId).select('id').single();
      if (error || !data) throw new Error(error?.message ?? 'Meeting no longer exists.');
    } else {
      const { data, error } = await db.from('meetings').insert(payload).select('id').single();
      if (error) throw new Error(error.message);
      meetingId = data.id;
    }
    refresh();
  } catch (error) { return message(error); }
  redirect('/meetings/' + meetingId);
}
export async function deleteMeeting(_: FormState, form: FormData): Promise<FormState> {
  try {
    if (form.get('confirm') !== 'yes') throw new Error('Confirm deletion of this meeting and its action items.');
    const { error, data } = await database().from('meetings').delete().eq('id', id(form, 'id')).select('id').single();
    if (error || !data) throw new Error(error?.message ?? 'Meeting no longer exists.');
    refresh();
  } catch (error) { return message(error); }
  redirect('/meetings');
}
export async function saveItem(_: FormState, form: FormData): Promise<FormState> {
  try {
    const db = database();
    const meeting_id = id(form, 'meeting_id');
    const { data: meeting, error: lookup } = await db.from('meetings').select('department_id').eq('id', meeting_id).single();
    if (lookup || !meeting) throw new Error('Meeting no longer exists. Refresh and retry.');
    const notes = String(form.get('notes') ?? '').trim();
    if (notes.length > 5000) throw new Error('Notes must be under 5,000 characters.');
    const payload = { meeting_id, department_id: meeting.department_id, description: field(form, 'description', 1000), assignee: field(form, 'assignee', 200), priority: choice(form, 'priority', ['High', 'Medium', 'Low']), deadline: date(form, 'deadline'), status: choice(form, 'status', ['Open', 'In Progress', 'Done']), notes };
    const query = form.get('id') ? db.from('action_items').update(payload).eq('id', id(form, 'id')).eq('meeting_id', meeting_id) : db.from('action_items').insert(payload);
    const { error, data } = await query.select('id').single();
    if (error || !data) throw new Error(error?.message ?? 'Action item no longer exists.');
    refresh();
    return { success: form.get('id') ? 'Action item updated.' : 'Action item added.' };
  } catch (error) { return message(error); }
}
export async function updateStatus(_: FormState, form: FormData): Promise<FormState> {
  try {
    const notes = String(form.get('notes') ?? '').trim();
    if (notes.length > 5000) throw new Error('Notes must be under 5,000 characters.');
    const { error, data } = await database().from('action_items').update({ status: choice(form, 'status', ['Open', 'In Progress', 'Done']), notes }).eq('id', id(form, 'id')).select('id').single();
    if (error || !data) throw new Error(error?.message ?? 'Action item no longer exists.');
    refresh();
    return { success: 'Status and notes saved.' };
  } catch (error) { return message(error); }
}
export async function deleteItem(_: FormState, form: FormData): Promise<FormState> {
  try {
    if (form.get('confirm') !== 'yes') throw new Error('Confirm deletion of this action item.');
    const { error, data } = await database().from('action_items').delete().eq('id', id(form, 'id')).select('id').single();
    if (error || !data) throw new Error(error?.message ?? 'Action item no longer exists.');
    refresh();
    return { success: 'Action item deleted.' };
  } catch (error) { return message(error); }
}
