begin;
alter table public.action_items add column ai_source text, add column ai_review_status text check (ai_review_status in ('reviewed'));
create table public.mcp_connections (
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null,
  client_name text not null,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(user_id,client_id)
);
alter table public.mcp_connections enable row level security;
grant select,insert,update,delete on public.mcp_connections to authenticated;
create policy connections_read on public.mcp_connections for select to authenticated using(user_id=auth.uid());
create policy connections_insert on public.mcp_connections for insert to authenticated with check(user_id=auth.uid() and (auth.jwt()->>'client_id') is null and exists(select 1 from public.workspace_members where workspace_id=mcp_connections.workspace_id and user_id=auth.uid()));
create policy connections_update on public.mcp_connections for update to authenticated using(user_id=auth.uid() and (auth.jwt()->>'client_id') is null) with check(user_id=auth.uid() and (auth.jwt()->>'client_id') is null and exists(select 1 from public.workspace_members where workspace_id=mcp_connections.workspace_id and user_id=auth.uid()));
create policy connections_delete on public.mcp_connections for delete to authenticated using(user_id=auth.uid() and (auth.jwt()->>'client_id') is null);

-- OAuth tokens may only read their explicitly approved workspace. They cannot
-- reuse normal-user CRUD grants by calling Supabase REST directly.
do $$ declare t text; begin
  foreach t in array array['departments','meetings','action_items'] loop
    execute format('create policy oauth_read_scope on public.%I as restrictive for select to authenticated using ((auth.jwt()->>''client_id'') is null or exists(select 1 from public.mcp_connections c where c.user_id=auth.uid() and c.client_id::text=auth.jwt()->>''client_id'' and c.workspace_id=%I.workspace_id))',t,t);
    execute format('create policy oauth_no_insert on public.%I as restrictive for insert to authenticated with check ((auth.jwt()->>''client_id'') is null)',t);
    execute format('create policy oauth_no_update on public.%I as restrictive for update to authenticated using ((auth.jwt()->>''client_id'') is null) with check ((auth.jwt()->>''client_id'') is null)',t);
    execute format('create policy oauth_no_delete on public.%I as restrictive for delete to authenticated using ((auth.jwt()->>''client_id'') is null)',t);
  end loop;
end $$;
-- Existing management RPCs run as definer, so add an explicit OAuth guard too.
do $$ declare f record; ddl text; begin
  for f in select p.oid from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('create_workspace','create_workspace_invite','accept_workspace_invite','list_workspace_members','list_workspace_invites','revoke_workspace_invite','remove_workspace_member','set_workspace_member_role') loop
    ddl := pg_get_functiondef(f.oid);
    ddl := regexp_replace(ddl,'\mbegin\M','begin if (auth.jwt()->>''client_id'') is not null then raise exception ''Team management is not available to OAuth clients''; end if;', 'i');
    execute ddl;
  end loop;
end $$;
-- Configure this function as the Supabase Custom Access Token hook. Its extra
-- audience binds approved OAuth tokens to this MCP resource; normal auth stays intact.
create function public.tracker_oauth_access_token_hook(event jsonb) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare claims jsonb := event->'claims'; cid text := coalesce(event->>'client_id',event->'claims'->>'client_id');
begin
  if cid is not null and exists(select 1 from public.mcp_connections c where c.user_id=(event->>'user_id')::uuid and c.client_id::text=cid) then
    claims := jsonb_set(claims,'{aud}','["authenticated","https://ea-action-tracker.vercel.app/mcp"]'::jsonb);
  end if;
  return jsonb_build_object('claims',claims);
end $$;
revoke all on function public.tracker_oauth_access_token_hook(jsonb) from public,anon,authenticated;
grant execute on function public.tracker_oauth_access_token_hook(jsonb) to supabase_auth_admin;

create table public.audit_logs (
 id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id),
 department_id uuid not null, item_id uuid not null, actor uuid, action text not null,
 changes jsonb not null, created_at timestamptz not null default now()
);
alter table public.audit_logs enable row level security;
grant select on public.audit_logs to authenticated;
create policy audit_read on public.audit_logs for select to authenticated using (
 (auth.jwt()->>'client_id') is null and exists(select 1 from public.workspace_members m where m.workspace_id=audit_logs.workspace_id and m.user_id=auth.uid() and (m.role in ('owner','admin') or m.department_id=audit_logs.department_id))
);
create function tracker_private.record_action_change() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if tg_op='DELETE' then
   insert into public.audit_logs(workspace_id,department_id,item_id,actor,action,changes) values(old.workspace_id,old.department_id,old.id,auth.uid(),'deleted',jsonb_build_object('description',old.description));
   return old;
 end if;
 if old.status is distinct from new.status or old.deadline is distinct from new.deadline then
   insert into public.audit_logs(workspace_id,department_id,item_id,actor,action,changes) values(new.workspace_id,new.department_id,new.id,auth.uid(),'updated',jsonb_build_object('previous_status',old.status,'status',new.status,'previous_deadline',old.deadline,'deadline',new.deadline));
 end if;
 return new;
end $$;
create trigger action_change_audit after update or delete on public.action_items for each row execute function tracker_private.record_action_change();
notify pgrst,'reload schema';
commit;
