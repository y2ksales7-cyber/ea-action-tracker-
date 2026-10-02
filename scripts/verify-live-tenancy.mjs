// Explicit opt-in production verification: disposable users/workspaces only.
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';
import { readFile, writeFile } from 'node:fs/promises';
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const adminKey = process.env.SUPABASE_TEST_ADMIN_KEY;
const fixturePath = process.env.TEST_FIXTURE_PATH;
if (!url || !anon || !adminKey || !fixturePath) throw new Error('Explicit test admin environment and local fixture path required.');
const admin = createClient(url, adminKey, { auth: { persistSession: false } });
function unwrap({data,error}) { if (error) throw new Error(error.message); return data; }
if (process.argv.includes('--cleanup')) {
  const fixture = JSON.parse(await readFile(fixturePath,'utf8'));
  for (const id of fixture.workspaces) unwrap(await admin.from('workspaces').delete().eq('id',id));
  for (const user of fixture.users) unwrap(await admin.auth.admin.deleteUser(user.id));
  console.log('Only disposable verification users/workspaces removed.');
  process.exit(0);
}
const fixture = {users: [],workspaces: []};
await writeFile(fixturePath,JSON.stringify(fixture));
const suffix = crypto.randomUUID().slice(0,8);
async function account(name) {
  const email = `tracker-test-${name}-${suffix}@example.com`;
  const password = crypto.randomUUID()+'aA9!';
  const {user} = unwrap(await admin.auth.admin.createUser({email,password,email_confirm:true}));
  const client = createClient(url,anon,{auth:{persistSession:false}});
  unwrap(await client.auth.signInWithPassword({email,password}));
  fixture.users.push({id:user.id,name,email,password});
  await writeFile(fixturePath,JSON.stringify(fixture));
  return client;
}
const owner = await account('owner');
const finance = await account('finance');
const viewer = await account('viewer');
const outsider = await account('outsider');
const workspace = unwrap(await owner.rpc('create_workspace',{p_name:`Verification team ${suffix}`}));
fixture.workspaces.push(workspace);
const other = unwrap(await outsider.rpc('create_workspace',{p_name:`Verification other ${suffix}`}));
fixture.workspaces.push(other);
await writeFile(fixturePath,JSON.stringify(fixture));
const departments = unwrap(await owner.from('departments').select().eq('workspace_id',workspace));
const d = departments.find(row=>row.name==='Finance');
const a = departments.find(row=>row.name==='Assets');
const date = new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kuala_Lumpur',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const offset = n=>{const value = new Date(date+'T00:00:00Z');value.setUTCDate(value.getUTCDate()+n);return value.toISOString().slice(0,10)};
const meeting = unwrap(await owner.from('meetings').insert({workspace_id:workspace,department_id:d.id,date,topic:'Finance verification review',attendees:['CEO','Finance HOD']}).select().single());
const assetsMeeting = unwrap(await owner.from('meetings').insert({workspace_id:workspace,department_id:a.id,date,topic:'Assets confidential verification'}).select().single());
const items = unwrap(await owner.from('action_items').insert([
  {workspace_id:workspace,department_id:d.id,meeting_id:meeting.id,description:'Revise Q1 forecast',assignee:'Finance HOD',priority:'High',deadline:offset(-1)},
  {workspace_id:workspace,department_id:d.id,meeting_id:meeting.id,description:'Confirm vendor list',assignee:'Finance HOD',priority:'Medium',deadline:offset(2)},
  {workspace_id:workspace,department_id:d.id,meeting_id:meeting.id,description:'Archive old files',assignee:'Finance HOD',priority:'Low',deadline:offset(30)},
  {workspace_id:workspace,department_id:a.id,meeting_id:assetsMeeting.id,description:'Assets private action',assignee:'Assets HOD',priority:'High',deadline:offset(2)},
]).select());
for (const [client,name,role] of [[finance,'finance','member'],[viewer,'viewer','viewer']]) {
  const user = fixture.users.find(user=>user.name===name);
  const token = unwrap(await owner.rpc('create_workspace_invite',{p_workspace_id:workspace,p_email:user.email,p_role:role,p_department_id:d.id}));
  assert.ok((await outsider.rpc('accept_workspace_invite',{p_token:token})).error);
  assert.equal(unwrap(await client.rpc('accept_workspace_invite',{p_token:token})),workspace);
  assert.ok((await client.rpc('accept_workspace_invite',{p_token:token})).error);
  assert.equal(unwrap(await client.from('departments').select().eq('workspace_id',workspace)).length,1);
  assert.equal(unwrap(await client.from('action_items').select().eq('workspace_id',workspace)).length,3);
  assert.equal(unwrap(await client.from('meetings').select().eq('id',assetsMeeting.id)).length,0);
  assert.equal(unwrap(await client.from('action_items').update({notes:'must fail'}).eq('id',items[3].id).select()).length,0);
  assert.ok((await client.from('meetings').insert({workspace_id:workspace,department_id:a.id,date,topic:'Denied'})).error);
}
assert.equal(unwrap(await outsider.from('action_items').select().eq('workspace_id',workspace)).length,0);
assert.equal(unwrap(await viewer.from('action_items').update({status:'Done'}).eq('id',items[0].id).select()).length,0);
unwrap(await finance.from('action_items').update({status:'In Progress',notes:'Department scope verified'}).eq('id',items[0].id).select().single());
assert.equal(unwrap(await owner.from('action_items').select('notes').eq('id',items[0].id).single()).notes,'Department scope verified');
const publicClient = createClient(url,anon,{auth:{persistSession:false}});
assert.equal(unwrap(await publicClient.from('action_items').select().eq('workspace_id',workspace)).length,0);
assert.ok((await publicClient.from('meetings').insert({workspace_id:workspace,department_id:d.id,date,topic:'Denied'})).error);
fixture.workspace=workspace;fixture.meeting=meeting.id;fixture.assetsMeeting=assetsMeeting.id;fixture.financeDepartment=d.id;
await writeFile(fixturePath,JSON.stringify(fixture));
console.log('Live authenticated tenant and department isolation, invite acceptance, viewer denial, and core persistence passed. Disposable fixtures ready for browser verification.');
