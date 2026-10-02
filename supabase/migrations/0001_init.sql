create table if not exists departments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists meetings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  department_id uuid not null references departments(id) on delete cascade,
  date date not null,
  topic text not null,
  attendees text[] default '{}',
  created_at timestamptz not null default now()
);

create table if not exists action_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  meeting_id uuid not null references meetings(id) on delete cascade,
  department_id uuid not null references departments(id) on delete cascade,
  description text not null,
  assignee text not null,
  priority text not null default 'Medium',
  deadline date not null,
  status text not null default 'Open',
  notes text,
  created_at timestamptz not null default now()
);

alter table departments enable row level security;
alter table meetings enable row level security;
alter table action_items enable row level security;

drop policy if exists "departments_v1_read" on departments;
create policy "departments_v1_read" on departments for select using (true);
drop policy if exists "departments_v1_write" on departments;
create policy "departments_v1_write" on departments for all using (true) with check (true);

drop policy if exists "meetings_v1_read" on meetings;
create policy "meetings_v1_read" on meetings for select using (true);
drop policy if exists "meetings_v1_write" on meetings;
create policy "meetings_v1_write" on meetings for all using (true) with check (true);

drop policy if exists "action_items_v1_read" on action_items;
create policy "action_items_v1_read" on action_items for select using (true);
drop policy if exists "action_items_v1_write" on action_items;
create policy "action_items_v1_write" on action_items for all using (true) with check (true);

insert into departments (name) values
  ('Assets'),
  ('Project'),
  ('Leasing'),
  ('Finance'),
  ('Philanthropy')
on conflict do nothing;

insert into meetings (department_id, date, topic, attendees)
select d.id, '2025-01-10', 'Q1 Budget Review', '{"CEO","Finance HOD"}' from departments d where d.name = 'Finance'
on conflict do nothing;

insert into meetings (department_id, date, topic, attendees)
select d.id, '2025-01-14', 'Portfolio Strategy', '{"CEO","Assets HOD"}' from departments d where d.name = 'Assets'
on conflict do nothing;

insert into meetings (department_id, date, topic, attendees)
select d.id, '2025-01-16', 'Leasing Pipeline Update', '{"CEO","Leasing HOD"}' from departments d where d.name = 'Leasing'
on conflict do nothing;

insert into action_items (meeting_id, department_id, description, assignee, priority, deadline, status, notes)
select m.id, m.department_id, 'Submit revised Q1 budget forecast', 'Finance HOD', 'High', CURRENT_DATE - 2, 'Open', 'Pending revised numbers from team'
from meetings m join departments d on m.department_id = d.id where d.name = 'Finance' and m.topic = 'Q1 Budget Review'
on conflict do nothing;

insert into action_items (meeting_id, department_id, description, assignee, priority, deadline, status, notes)
select m.id, m.department_id, 'Confirm vendor payment schedule', 'Finance HOD', 'Medium', CURRENT_DATE + 3, 'In Progress', 'Awaiting vendor confirmation'
from meetings m join departments d on m.department_id = d.id where d.name = 'Finance' and m.topic = 'Q1 Budget Review'
on conflict do nothing;

insert into action_items (meeting_id, department_id, description, assignee, priority, deadline, status, notes)
select m.id, m.department_id, 'Review asset valuation report', 'Assets HOD', 'High', CURRENT_DATE + 1, 'Open', 'Need updated appraisals'
from meetings m join departments d on m.department_id = d.id where d.name = 'Assets' and m.topic = 'Portfolio Strategy'
on conflict do nothing;

insert into action_items (meeting_id, department_id, description, assignee, priority, deadline, status, notes)
select m.id, m.department_id, 'Approve new lease terms for Tower B', 'Leasing HOD', 'Medium', CURRENT_DATE + 10, 'Open', 'Tenant negotiation in progress'
from meetings m join departments d on m.department_id = d.id where d.name = 'Leasing' and m.topic = 'Leasing Pipeline Update'
on conflict do nothing;

insert into action_items (meeting_id, department_id, description, assignee, priority, deadline, status, notes)
select m.id, m.department_id, 'Archive expired lease documents', 'Leasing HOD', 'Low', CURRENT_DATE + 30, 'Open', ''
from meetings m join departments d on m.department_id = d.id where d.name = 'Leasing' and m.topic = 'Leasing Pipeline Update'
on conflict do nothing;

insert into action_items (meeting_id, department_id, description, assignee, priority, deadline, status, notes)
select m.id, m.department_id, 'Finalize philanthropy Q1 disbursement list', 'Finance HOD', 'High', CURRENT_DATE - 5, 'Done', 'Approved by CEO'
from meetings m join departments d on m.department_id = d.id where d.name = 'Finance' and m.topic = 'Q1 Budget Review'
on conflict do nothing;