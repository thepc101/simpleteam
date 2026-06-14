-- ============================================================
-- SimpleTeam migration: usernames + owner-approved joins
-- Safe to run on a live database (additive & idempotent).
-- Paste into Supabase → SQL Editor → Run.
-- ============================================================

-- 1) profiles.username
alter table public.profiles add column if not exists username text;

-- 2) join_requests table
create table if not exists public.join_requests (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id      uuid not null references auth.users on delete cascade,
  email        text,
  full_name    text,
  username     text,
  status       text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at   timestamptz not null default now(),
  unique (workspace_id, user_id)
);
create index if not exists join_requests_ws_idx on public.join_requests (workspace_id);
alter table public.join_requests enable row level security;

drop policy if exists jr_select on public.join_requests;
create policy jr_select on public.join_requests for select to authenticated
  using (user_id = auth.uid() or (workspace_id = public.my_workspace_id() and public.is_admin()));
drop policy if exists jr_delete on public.join_requests;
create policy jr_delete on public.join_requests for delete to authenticated using (user_id = auth.uid());

-- 3) replace the old immediate-join functions with the approval flow
drop function if exists public.join_workspace(text);
drop function if exists public.create_workspace(text);

create or replace function public.create_workspace(p_name text, p_full_name text default '', p_username text default '')
returns uuid language plpgsql security definer set search_path = public as $$
declare v_ws uuid;
begin
  insert into public.workspaces (name, owner_id)
  values (coalesce(nullif(p_name, ''), 'My Firm'), auth.uid())
  returning id into v_ws;
  update public.profiles
    set workspace_id = v_ws, role = 'admin',
        full_name = coalesce(nullif(p_full_name, ''), full_name),
        username = nullif(p_username, '')
    where id = auth.uid();
  return v_ws;
end;
$$;

create or replace function public.request_join(p_code text, p_full_name text, p_username text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_ws uuid; v_id uuid; v_email text;
begin
  select id into v_ws from public.workspaces where invite_code = p_code;
  if v_ws is null then raise exception 'Invalid invite code'; end if;
  select email into v_email from auth.users where id = auth.uid();
  update public.profiles
    set full_name = coalesce(nullif(p_full_name, ''), full_name), username = nullif(p_username, '')
    where id = auth.uid();
  insert into public.join_requests (workspace_id, user_id, email, full_name, username, status)
  values (v_ws, auth.uid(), v_email, p_full_name, nullif(p_username, ''), 'pending')
  on conflict (workspace_id, user_id)
    do update set status = 'pending', full_name = excluded.full_name,
                  username = excluded.username, created_at = now()
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.approve_join(p_request uuid, p_role text default 'standard')
returns void language plpgsql security definer set search_path = public as $$
declare v_ws uuid; v_user uuid;
begin
  select workspace_id, user_id into v_ws, v_user from public.join_requests where id = p_request;
  if v_ws is null then raise exception 'Request not found'; end if;
  if v_ws <> public.my_workspace_id() or not public.is_admin() then raise exception 'Not allowed'; end if;
  update public.profiles set workspace_id = v_ws,
      role = coalesce(nullif(p_role, ''), 'standard') where id = v_user;
  update public.join_requests set status = 'approved' where id = p_request;
end;
$$;

create or replace function public.reject_join(p_request uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_ws uuid;
begin
  select workspace_id into v_ws from public.join_requests where id = p_request;
  if v_ws is null then raise exception 'Request not found'; end if;
  if v_ws <> public.my_workspace_id() or not public.is_admin() then raise exception 'Not allowed'; end if;
  update public.join_requests set status = 'rejected' where id = p_request;
end;
$$;

grant execute on function public.create_workspace(text, text, text) to authenticated;
grant execute on function public.request_join(text, text, text) to authenticated;
grant execute on function public.approve_join(uuid, text) to authenticated;
grant execute on function public.reject_join(uuid) to authenticated;

-- 4) tighten task edits: only admins update rows; assignees change status via RPC
drop policy if exists tk_update on public.tasks;
create policy tk_update on public.tasks for update to authenticated
  using (workspace_id = public.my_workspace_id() and public.is_admin());

create or replace function public.set_task_status(p_task uuid, p_status text)
returns void language plpgsql security definer set search_path = public as $$
declare v_ws uuid; v_assignee uuid;
begin
  select workspace_id, assigned_to into v_ws, v_assignee from public.tasks where id = p_task;
  if v_ws is null or v_ws <> public.my_workspace_id() then raise exception 'Not allowed'; end if;
  if not (public.is_admin() or v_assignee = auth.uid()) then raise exception 'Not allowed'; end if;
  if p_status not in ('pending','in_progress','completed') then raise exception 'Invalid status'; end if;
  update public.tasks set status = p_status, updated_at = now() where id = p_task;
end;
$$;
grant execute on function public.set_task_status(uuid, text) to authenticated;

-- 5) realtime for join_requests (idempotent)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'join_requests'
  ) then
    alter publication supabase_realtime add table public.join_requests;
  end if;
end $$;
