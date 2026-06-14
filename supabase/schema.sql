-- ============================================================
-- SimpleTeam — Supabase schema (paste into the SQL Editor & run)
-- CA-firm workspace: profiles, clients, tasks, comments, chat,
-- WhatsApp log — with RLS + Realtime + auto profile/workspace on signup.
-- ============================================================

create extension if not exists pgcrypto;

-- ---- invite-code generator --------------------------------
create or replace function public.gen_invite_code()
returns text language sql volatile as $$
  select 'stm_' || replace(replace(encode(gen_random_bytes(24), 'base64'), '+', '-'), '/', '_');
$$;

-- ============================================================
-- TABLES
-- ============================================================
create table public.workspaces (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  invite_code text not null unique default public.gen_invite_code(),
  owner_id    uuid not null,
  wa_enabled  boolean not null default true,
  wa_template text not null default 'Hello {client}, this is an update from {company}. The task "{task}" has been completed on {date}. Thank you.',
  created_at  timestamptz not null default now()
);

create table public.profiles (
  id           uuid primary key references auth.users on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete cascade,
  full_name    text not null default '',
  username     text,
  email        text,
  role         text not null default 'standard' check (role in ('admin','leader','standard')),
  avatar_color text not null default '#6366f1',
  created_at   timestamptz not null default now()
);

create table public.join_requests (
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

create table public.clients (
  id             uuid primary key default gen_random_uuid(),
  workspace_id   uuid not null references public.workspaces(id) on delete cascade,
  name           text not null,
  type           text not null default 'private_limited',
  gstin          text,
  pan            text,
  contact_person text,
  phone          text,
  email          text,
  notes          text,
  assigned_to    uuid references public.profiles(id) on delete set null,
  active         boolean not null default true,
  created_at     timestamptz not null default now()
);

create table public.tasks (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title        text not null,
  description  text,
  status       text not null default 'pending' check (status in ('pending','in_progress','completed')),
  priority     text not null default 'medium' check (priority in ('low','medium','high')),
  category     text not null default 'other' check (category in ('gst','income_tax','tds','roc','audit','advisory','other')),
  deadline     timestamptz,
  assigned_to  uuid references public.profiles(id) on delete set null,
  created_by   uuid references public.profiles(id) on delete set null,
  client_id    uuid references public.clients(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table public.comments (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  task_id      uuid not null references public.tasks(id) on delete cascade,
  author_id    uuid references public.profiles(id) on delete set null,
  body         text not null,
  created_at   timestamptz not null default now()
);

create table public.messages (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  channel      text not null,
  author_id    uuid references public.profiles(id) on delete set null,
  body         text not null,
  created_at   timestamptz not null default now()
);

create table public.notifications (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  task_id      text,
  task_title   text,
  to_name      text,
  to_phone     text,
  body         text,
  status       text not null default 'pending' check (status in ('pending','sent')),
  created_at   timestamptz not null default now(),
  sent_at      timestamptz
);

create index on public.profiles (workspace_id);
create index on public.clients (workspace_id);
create index on public.tasks (workspace_id);
create index on public.comments (task_id);
create index on public.messages (workspace_id, channel);
create index on public.notifications (workspace_id);
create index on public.join_requests (workspace_id);

-- ============================================================
-- HELPERS (security definer to avoid RLS recursion on profiles)
-- ============================================================
create or replace function public.my_workspace_id()
returns uuid language sql stable security definer set search_path = public as $$
  select workspace_id from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    join public.workspaces w on w.id = p.workspace_id
    where p.id = auth.uid() and (p.role = 'admin' or w.owner_id = p.id)
  );
$$;

-- ============================================================
-- AUTO PROFILE + WORKSPACE ON SIGNUP (reads signUp metadata)
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  -- Create a profile only. The user creates or joins a team after signing in.
  insert into public.profiles (id, workspace_id, full_name, email, role, avatar_color)
  values (
    new.id, null,
    coalesce(nullif(meta->>'full_name', ''), new.email),
    new.email, 'standard',
    coalesce(meta->>'avatar_color', '#6366f1')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---- create a team (creator becomes owner + admin) --------
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

-- ---- request to join (creates a pending request; NO membership) --
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

-- ---- owner/admin approves or rejects a request ------------
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

-- ---- assignee (or admin) may change ONLY a task's status ---
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

grant execute on function public.create_workspace(text, text, text) to authenticated;
grant execute on function public.request_join(text, text, text) to authenticated;
grant execute on function public.approve_join(uuid, text) to authenticated;
grant execute on function public.reject_join(uuid) to authenticated;
grant execute on function public.set_task_status(uuid, text) to authenticated;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.workspaces    enable row level security;
alter table public.profiles      enable row level security;
alter table public.clients       enable row level security;
alter table public.tasks         enable row level security;
alter table public.comments      enable row level security;
alter table public.messages      enable row level security;
alter table public.notifications enable row level security;
alter table public.join_requests enable row level security;

-- workspaces
create policy ws_select on public.workspaces for select to authenticated using (id = public.my_workspace_id());
create policy ws_update on public.workspaces for update to authenticated using (id = public.my_workspace_id() and public.is_admin());
create policy ws_delete on public.workspaces for delete to authenticated using (owner_id = auth.uid());

-- profiles
create policy pr_select on public.profiles for select to authenticated using (workspace_id = public.my_workspace_id());
create policy pr_insert on public.profiles for insert to authenticated with check (id = auth.uid());
create policy pr_update on public.profiles for update to authenticated using (id = auth.uid() or public.is_admin());
create policy pr_delete on public.profiles for delete to authenticated using (id = auth.uid() or public.is_admin());

-- clients (admin writes)
create policy cl_select on public.clients for select to authenticated using (workspace_id = public.my_workspace_id());
create policy cl_write  on public.clients for all to authenticated
  using (workspace_id = public.my_workspace_id() and public.is_admin())
  with check (workspace_id = public.my_workspace_id() and public.is_admin());

-- tasks (admin create/delete; admin or assignee update; everyone in ws reads)
create policy tk_select on public.tasks for select to authenticated using (workspace_id = public.my_workspace_id());
create policy tk_insert on public.tasks for insert to authenticated with check (workspace_id = public.my_workspace_id() and public.is_admin());
create policy tk_update on public.tasks for update to authenticated using (workspace_id = public.my_workspace_id() and public.is_admin());
create policy tk_delete on public.tasks for delete to authenticated using (workspace_id = public.my_workspace_id() and public.is_admin());

-- comments
create policy cm_select on public.comments for select to authenticated using (workspace_id = public.my_workspace_id());
create policy cm_insert on public.comments for insert to authenticated with check (workspace_id = public.my_workspace_id() and author_id = auth.uid());

-- messages
create policy ms_select on public.messages for select to authenticated using (workspace_id = public.my_workspace_id());
create policy ms_insert on public.messages for insert to authenticated with check (workspace_id = public.my_workspace_id() and author_id = auth.uid());

-- notifications (admin writes)
create policy nt_select on public.notifications for select to authenticated using (workspace_id = public.my_workspace_id());
create policy nt_write  on public.notifications for all to authenticated
  using (workspace_id = public.my_workspace_id() and public.is_admin())
  with check (workspace_id = public.my_workspace_id() and public.is_admin());

-- join requests (inserts/updates happen via SECURITY DEFINER RPCs only)
create policy jr_select on public.join_requests for select to authenticated
  using (user_id = auth.uid() or (workspace_id = public.my_workspace_id() and public.is_admin()));
create policy jr_delete on public.join_requests for delete to authenticated using (user_id = auth.uid());

-- ============================================================
-- REALTIME (RLS still enforced for subscribers)
-- ============================================================
alter publication supabase_realtime add table
  public.workspaces, public.profiles, public.clients, public.tasks,
  public.comments, public.messages, public.notifications, public.join_requests;
