import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) throw new Error('Supabase environment required.');
if (process.argv.includes('--crud')) throw new Error('Anonymous writes were retired. Use verify-live-tenancy.mjs with explicit disposable test fixtures.');
const db = createClient(url, key, {auth:{persistSession:false}});
const demo = '00000000-0000-4000-8000-000000000001';
for (const table of ['departments','meetings','action_items']) {
 const {data,error}=await db.from(table).select('workspace_id');
 if(error) throw error;
 assert.ok(data.every(row=>row.workspace_id===demo),'Anonymous reads must contain only archived demo records');
}
const {error}=await db.from('meetings').insert({workspace_id:demo,department_id:crypto.randomUUID(),date:'2026-10-02',topic:'Denied anonymous probe'});
assert.ok(error,'Anonymous writes must be denied');
console.log('Anonymous access is confined to archived demo reads; writes denied.');
