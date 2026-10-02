import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) throw new Error('Pull the provisioned environment with vercel env pull .env.local first.');
const db = createClient(url, key, { auth: { persistSession: false } });
const unwrap = ({ data, error }) => { if (error) throw new Error(error.message); return data; };
const departments = unwrap(await db.from('departments').select('id,name'));
for (const name of ['Assets', 'Project', 'Leasing', 'Finance', 'Philanthropy']) assert.ok(departments.some(d => d.name === name), `Missing seeded department: ${name}`);
unwrap(await db.from('meetings').select('id,department_id,date,topic,attendees').limit(1));
unwrap(await db.from('action_items').select('id,meeting_id,department_id,description,assignee,priority,deadline,status,notes').limit(1));
console.log('All three provisioned tables and five departments are readable anonymously.');

if (process.argv.includes('--crud')) {
  const finance = departments.find(d => d.name === 'Finance');
  let meeting;
  try {
    const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kuala_Lumpur', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    const offset = n => { const value = new Date(date + 'T00:00:00Z'); value.setUTCDate(value.getUTCDate() + n); return value.toISOString().slice(0,10); };
    meeting = unwrap(await db.from('meetings').insert({ department_id: finance.id, date, topic: `Verification ${crypto.randomUUID()}`, attendees: ['CEO', 'Finance HOD'] }).select().single());
    const items = unwrap(await db.from('action_items').insert([
      { meeting_id: meeting.id, department_id: finance.id, description: 'Revise Q1 forecast', assignee: 'Finance HOD', priority: 'High', deadline: offset(-1), status: 'Open' },
      { meeting_id: meeting.id, department_id: finance.id, description: 'Confirm vendor list', assignee: 'Finance HOD', priority: 'Medium', deadline: offset(2), status: 'Open' },
      { meeting_id: meeting.id, department_id: finance.id, description: 'Archive old files', assignee: 'Finance HOD', priority: 'Low', deadline: offset(30), status: 'Open' },
    ]).select());
    assert.equal(items.length, 3);
    unwrap(await db.from('action_items').update({ status: 'In Progress', notes: 'Waiting for revised figures' }).eq('id', items.find(i => i.priority === 'High').id).select().single());
    const medium = items.find(i => i.priority === 'Medium');
    unwrap(await db.from('action_items').update({ status: 'Done', notes: 'Confirmed' }).eq('id', medium.id).select().single());
    const persisted = unwrap(await db.from('action_items').select().eq('id', medium.id).single());
    assert.equal(persisted.status, 'Done');
    assert.equal(persisted.notes, 'Confirmed');
    unwrap(await db.from('meetings').update({ topic: 'Verification updated' }).eq('id', meeting.id).select().single());
    unwrap(await db.from('action_items').delete().eq('id', items.find(i => i.priority === 'Low').id).select().single());
    console.log('Real anonymous meeting/item creation, editing, status/notes persistence and deletion passed.');
  } finally {
    if (meeting) {
      unwrap(await db.from('meetings').delete().eq('id', meeting.id).select().single());
      const remaining = unwrap(await db.from('action_items').select('id').eq('meeting_id', meeting.id));
      assert.equal(remaining.length, 0, 'Meeting deletion must cascade to its items');
      console.log('Only verification records were removed; cascading delete passed.');
    }
  }
}
