-- Team workspaces replace v1 public writes. Run atomically as the migration owner.
begin;

create schema if not exists tracker_private;
revoke all on schema tracker_private from public, anon, authenticated;

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 120),
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);
create table public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'member', 'viewer')),
  department_id uuid,
  constraint member_department_required check ((role in ('owner','admin') and department_id is null) or (role in ('member','viewer') and department_id is not null)),
  display_name text not null,
  joined_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);
create unique index workspace_one_owner on public.workspace_members(workspace_id) where role = 'owner';
create index workspace_members_user on public.workspace_members(user_id, workspace_id);
create table tracker_private.workspace_invites (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  email text not null check (char_length(email) between 3 and 320),
  role text not null check (role in ('admin', 'member', 'viewer')),
  department_id uuid,
  constraint invite_department_required check ((role='admin' and department_id is null) or (role in ('member','viewer') and department_id is not null)),
  token_hash text not null unique,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '7 days',
  accepted_at timestamptz,
  revoked_at timestamptz
);
create index workspace_invites_workspace on tracker_private.workspace_invites(workspace_id);
alter table tracker_private.workspace_invites enable row level security;

insert into public.workspaces(id, name, is_demo)
values ('00000000-0000-4000-8000-000000000001', 'EA Action Tracker demo', true);
alter table public.departments add column workspace_id uuid;
alter table public.meetings add column workspace_id uuid;
alter table public.action_items add column workspace_id uuid;
update public.departments set workspace_id = '00000000-0000-4000-8000-000000000001';
update public.meetings set workspace_id = '00000000-0000-4000-8000-000000000001';
update public.action_items set workspace_id = '00000000-0000-4000-8000-000000000001';
alter table public.departments alter column workspace_id set not null;
alter table public.meetings alter column workspace_id set not null;
alter table public.action_items alter column workspace_id set not null;
alter table public.departments add constraint departments_workspace_fk foreign key(workspace_id) references public.workspaces(id) on delete cascade;
alter table public.departments add constraint departments_workspace_id_unique unique(workspace_id, id);
alter table public.workspace_members add constraint member_workspace_department_fk foreign key(workspace_id,department_id) references public.departments(workspace_id,id);
alter table tracker_private.workspace_invites add constraint invite_workspace_department_fk foreign key(workspace_id,department_id) references public.departments(workspace_id,id);
alter table public.meetings add constraint meetings_workspace_department_fk foreign key(workspace_id, department_id) references public.departments(workspace_id, id) on delete cascade;
alter table public.meetings add constraint meetings_workspace_id_department_unique unique(workspace_id, id, department_id);
alter table public.action_items add constraint action_items_workspace_meeting_department_fk foreign key(workspace_id, meeting_id, department_id) references public.meetings(workspace_id, id, department_id) on delete cascade;
create index departments_workspace on public.departments(workspace_id);
create index meetings_workspace on public.meetings(workspace_id, date desc);
create index action_items_workspace on public.action_items(workspace_id, deadline);

-- SECURITY DEFINER helpers bypass membership RLS only for the current caller.
-- No caller-supplied user id and no dynamic SQL; search_path is pinned.
create function tracker_private.workspace_role(p_workspace_id uuid)
returns text language sql stable security definer set search_path = '' as $$
  select m.role from public.workspace_members m
  where m.workspace_id = p_workspace_id and m.user_id = (select auth.uid());
$$;
create function tracker_private.can_read_workspace(p_workspace_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.workspaces w where w.id = p_workspace_id and w.is_demo)
    or tracker_private.workspace_role(p_workspace_id) is not null;
$$;
create function tracker_private.can_write_workspace(p_workspace_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(tracker_private.workspace_role(p_workspace_id) in ('owner','admin','member'), false)
    and exists(select 1 from public.workspaces w where w.id = p_workspace_id and not w.is_demo);
$$;
create function tracker_private.is_workspace_manager(p_workspace_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(tracker_private.workspace_role(p_workspace_id) in ('owner','admin'), false);
$$;
create function tracker_private.can_read_department(p_workspace_id uuid, p_department_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.workspaces w where w.id=p_workspace_id and w.is_demo)
    or exists(select 1 from public.workspace_members m where m.workspace_id=p_workspace_id and m.user_id=auth.uid()
      and (m.role in ('owner','admin') or m.department_id=p_department_id));
$$;
create function tracker_private.can_write_department(p_workspace_id uuid, p_department_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.workspace_members m join public.workspaces w on w.id=m.workspace_id
    where m.workspace_id=p_workspace_id and m.user_id=auth.uid() and not w.is_demo
      and (m.role in ('owner','admin') or (m.role='member' and m.department_id=p_department_id)));
$$;
-- Required to evaluate RLS expressions, but schema is excluded from the API's exposed schemas.
grant usage on schema tracker_private to anon, authenticated;
revoke all on all functions in schema tracker_private from public;
grant execute on function tracker_private.workspace_role(uuid), tracker_private.can_read_workspace(uuid), tracker_private.can_write_workspace(uuid), tracker_private.is_workspace_manager(uuid), tracker_private.can_read_department(uuid,uuid), tracker_private.can_write_department(uuid,uuid) to anon, authenticated;

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
create policy workspaces_read on public.workspaces for select to anon, authenticated using (tracker_private.can_read_workspace(id));
create policy workspace_members_read on public.workspace_members for select to authenticated using (tracker_private.workspace_role(workspace_id) is not null);
revoke all on public.workspaces, public.workspace_members from anon, authenticated;
grant select on public.workspaces to anon, authenticated;
grant select on public.workspace_members to authenticated;

-- Retire ALL old policies (including the permissive FOR ALL policy).
drop policy if exists departments_v1_read on public.departments;
drop policy if exists departments_v1_write on public.departments;
drop policy if exists meetings_v1_read on public.meetings;
drop policy if exists meetings_v1_write on public.meetings;
drop policy if exists action_items_v1_read on public.action_items;
drop policy if exists action_items_v1_write on public.action_items;
create policy departments_read on public.departments for select to anon, authenticated using (tracker_private.can_read_department(workspace_id, id));
create policy departments_insert on public.departments for insert to authenticated with check (tracker_private.can_write_department(workspace_id, id));
create policy departments_update on public.departments for update to authenticated using (tracker_private.can_write_department(workspace_id, id)) with check (tracker_private.can_write_department(workspace_id, id));
create policy departments_delete on public.departments for delete to authenticated using (tracker_private.can_write_department(workspace_id, id));
create policy meetings_read on public.meetings for select to anon, authenticated using (tracker_private.can_read_department(workspace_id, department_id));
create policy meetings_insert on public.meetings for insert to authenticated with check (tracker_private.can_write_department(workspace_id, department_id));
create policy meetings_update on public.meetings for update to authenticated using (tracker_private.can_write_department(workspace_id, department_id)) with check (tracker_private.can_write_department(workspace_id, department_id));
create policy meetings_delete on public.meetings for delete to authenticated using (tracker_private.can_write_department(workspace_id, department_id));
create policy action_items_read on public.action_items for select to anon, authenticated using (tracker_private.can_read_department(workspace_id, department_id));
create policy action_items_insert on public.action_items for insert to authenticated with check (tracker_private.can_write_department(workspace_id, department_id));
create policy action_items_update on public.action_items for update to authenticated using (tracker_private.can_write_department(workspace_id, department_id)) with check (tracker_private.can_write_department(workspace_id, department_id));
create policy action_items_delete on public.action_items for delete to authenticated using (tracker_private.can_write_department(workspace_id, department_id));
revoke all on public.departments, public.meetings, public.action_items from anon, authenticated;
grant select on public.departments, public.meetings, public.action_items to anon, authenticated;
grant insert, update, delete on public.departments, public.meetings, public.action_items to authenticated;

create function tracker_private.keep_workspace_id()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.workspace_id is distinct from old.workspace_id then
    raise exception 'Records cannot move between workspaces';
  end if;
  return new;
end;
$$;
create trigger departments_keep_workspace before update on public.departments for each row execute function tracker_private.keep_workspace_id();
create trigger meetings_keep_workspace before update on public.meetings for each row execute function tracker_private.keep_workspace_id();
create trigger action_items_keep_workspace before update on public.action_items for each row execute function tracker_private.keep_workspace_id();
revoke all on function tracker_private.keep_workspace_id() from public, anon, authenticated;

create function public.create_workspace(p_name text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid; v_email text;
begin
  select u.email into v_email from auth.users u where u.id = auth.uid() and u.email_confirmed_at is not null;
  if v_email is null then raise exception 'Sign in with a verified email to create a workspace'; end if;
  if p_name is null or char_length(btrim(p_name)) not between 1 and 120 then raise exception 'Workspace name must be 1–120 characters'; end if;
  insert into public.workspaces(name) values (btrim(p_name)) returning id into v_id;
  insert into public.workspace_members(workspace_id, user_id, role, display_name)
  values(v_id, auth.uid(), 'owner', split_part(v_email, '@', 1));
  insert into public.departments(workspace_id, name) values
    (v_id,'Assets'),(v_id,'Project'),(v_id,'Leasing'),(v_id,'Finance'),(v_id,'Philanthropy');
  return v_id;
end;
$$;
create function public.create_workspace_invite(p_workspace_id uuid, p_email text, p_role text default 'member', p_department_id uuid default null)
returns text language plpgsql security definer set search_path = '' as $$
declare v_token text; v_email text;
begin
  if not tracker_private.is_workspace_manager(p_workspace_id) then raise exception 'Only workspace owners and admins can invite members'; end if;
  v_email := lower(btrim(p_email));
  if v_email is null or char_length(v_email) > 320 or v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'Enter a valid invite email'; end if;
  if p_role is null or p_role not in ('admin','member','viewer') then raise exception 'Invalid invitation role'; end if;
  if (p_role='admin' and p_department_id is not null) or (p_role in ('member','viewer') and (p_department_id is null or not exists(select 1 from public.departments d where d.id=p_department_id and d.workspace_id=p_workspace_id))) then
    raise exception 'Members and viewers need a valid department; admins cover all departments';
  end if;
  if exists(select 1 from public.workspace_members m join auth.users u on u.id=m.user_id where m.workspace_id=p_workspace_id and lower(u.email)=v_email) then raise exception 'This person already belongs to the workspace'; end if;
  -- Serialize invite creation within a workspace, including concurrent reissues.
  perform 1 from public.workspaces where id=p_workspace_id for update;
  -- Reissuing replaces prior links for this address; only one usable invitation remains.
  update tracker_private.workspace_invites set revoked_at=now() where workspace_id=p_workspace_id and email=v_email and accepted_at is null and revoked_at is null;
  v_token := gen_random_uuid()::text || gen_random_uuid()::text;
  insert into tracker_private.workspace_invites(workspace_id,email,role,department_id,token_hash,created_by)
  values(p_workspace_id,v_email,p_role,p_department_id,encode(sha256(convert_to(v_token,'UTF8')),'hex'),auth.uid());
  return v_token;
end;
$$;
create function public.accept_workspace_invite(p_token text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_inv tracker_private.workspace_invites%rowtype; v_email text;
begin
  select lower(u.email) into v_email from auth.users u where u.id=auth.uid() and u.email_confirmed_at is not null;
  if v_email is null then raise exception 'Sign in with your verified invited email'; end if;
  if p_token is null or char_length(p_token) <> 72 then raise exception 'Invitation is invalid or expired'; end if;
  select * into v_inv from tracker_private.workspace_invites
  where token_hash=encode(sha256(convert_to(p_token,'UTF8')),'hex') for update;
  if not found or v_inv.accepted_at is not null or v_inv.revoked_at is not null or v_inv.expires_at <= now() or v_inv.email <> v_email then
    raise exception 'Invitation is invalid, expired, or belongs to another email';
  end if;
  insert into public.workspace_members(workspace_id,user_id,role,department_id,display_name)
  values(v_inv.workspace_id,auth.uid(),v_inv.role,v_inv.department_id,split_part(v_email,'@',1)) on conflict (workspace_id,user_id) do nothing;
  update tracker_private.workspace_invites set accepted_at=now() where id=v_inv.id;
  return v_inv.workspace_id;
end;
$$;
create function public.list_workspace_members(p_workspace_id uuid)
returns table(user_id uuid, role text, department_id uuid, display_name text, email text, joined_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  if tracker_private.workspace_role(p_workspace_id) is null then raise exception 'Workspace membership required'; end if;
  return query select m.user_id,m.role,m.department_id,m.display_name,u.email::text,m.joined_at
  from public.workspace_members m join auth.users u on u.id=m.user_id
  where m.workspace_id=p_workspace_id order by m.joined_at;
end;
$$;
create function public.list_workspace_invites(p_workspace_id uuid)
returns table(id uuid, workspace_id uuid, email text, role text, department_id uuid, created_at timestamptz, expires_at timestamptz, accepted_at timestamptz, revoked_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not tracker_private.is_workspace_manager(p_workspace_id) then raise exception 'Workspace administrator required'; end if;
  return query select i.id,i.workspace_id,i.email,i.role,i.department_id,i.created_at,i.expires_at,i.accepted_at,i.revoked_at
  from tracker_private.workspace_invites i where i.workspace_id=p_workspace_id order by i.created_at desc;
end;
$$;
create function public.revoke_workspace_invite(p_invite_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_workspace uuid;
begin
  select workspace_id into v_workspace from tracker_private.workspace_invites where id=p_invite_id for update;
  if not tracker_private.is_workspace_manager(v_workspace) then raise exception 'Workspace administrator required'; end if;
  update tracker_private.workspace_invites set revoked_at=now() where id=p_invite_id and accepted_at is null;
end;
$$;
create function public.remove_workspace_member(p_workspace_id uuid, p_user_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_role text;
begin
  -- Lock the caller's membership so a concurrent removal cannot leave stale authority.
  select role into v_role from public.workspace_members where workspace_id=p_workspace_id and user_id=auth.uid() for update;
  if v_role is null or v_role not in ('owner','admin') then raise exception 'Workspace administrator required'; end if;
  select role into v_role from public.workspace_members where workspace_id=p_workspace_id and user_id=p_user_id for update;
  if v_role is null then raise exception 'Member not found'; end if;
  if v_role='owner' then raise exception 'The workspace owner cannot be removed'; end if;
  delete from public.workspace_members where workspace_id=p_workspace_id and user_id=p_user_id;
end;
$$;
create function public.set_workspace_member_role(p_workspace_id uuid, p_user_id uuid, p_role text, p_department_id uuid default null)
returns void language plpgsql security definer set search_path = '' as $$
declare v_role text;
begin
  select role into v_role from public.workspace_members where workspace_id=p_workspace_id and user_id=auth.uid() for update;
  if v_role is null or v_role not in ('owner','admin') then raise exception 'Workspace administrator required'; end if;
  if p_role is null or p_role not in ('admin','member','viewer') then raise exception 'Invalid member role'; end if;
  if (p_role='admin' and p_department_id is not null) or (p_role in ('member','viewer') and (p_department_id is null or not exists(select 1 from public.departments d where d.id=p_department_id and d.workspace_id=p_workspace_id))) then
    raise exception 'Members and viewers need a valid department; admins cover all departments';
  end if;
  select role into v_role from public.workspace_members where workspace_id=p_workspace_id and user_id=p_user_id for update;
  if v_role is null then raise exception 'Member not found'; end if;
  if v_role='owner' then raise exception 'The workspace owner role cannot be changed'; end if;
  update public.workspace_members set role=p_role,department_id=p_department_id where workspace_id=p_workspace_id and user_id=p_user_id;
end;
$$;

-- PostgreSQL grants function execution to PUBLIC by default; explicitly close every RPC.
revoke all on function public.create_workspace(text), public.create_workspace_invite(uuid,text,text,uuid), public.accept_workspace_invite(text), public.list_workspace_members(uuid), public.list_workspace_invites(uuid), public.revoke_workspace_invite(uuid), public.remove_workspace_member(uuid,uuid), public.set_workspace_member_role(uuid,uuid,text,uuid) from public, anon;
grant execute on function public.create_workspace(text), public.create_workspace_invite(uuid,text,text,uuid), public.accept_workspace_invite(text), public.list_workspace_members(uuid), public.list_workspace_invites(uuid), public.revoke_workspace_invite(uuid), public.remove_workspace_member(uuid,uuid), public.set_workspace_member_role(uuid,uuid,text,uuid) to authenticated;

notify pgrst, 'reload schema';
commit;
