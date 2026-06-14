-- ============================================================
-- SimpleTeam — Supabase schema (run in SQL Editor)
-- ============================================================

-- 1. PROFILES (1:1 with auth.users) --------------------------
create table public.profiles (
  id         uuid primary key references auth.users on delete cascade,
  full_name  text,
  role       text not null default 'standard'
             check (role in ('admin', 'leader', 'standard')),
  created_at timestamptz not null default now()
);

-- 2. TASKS ---------------------------------------------------
create table public.tasks (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  title       text not null,
  description text,
  status      text not null default 'pending'
              check (status in ('pending', 'in_progress', 'completed')),
  priority    text not null default 'medium'
              check (priority in ('low', 'medium', 'high')),
  deadline    timestamptz,                                   -- null = "Pending Works" backlog
  assigned_to uuid references public.profiles(id) on delete set null,
  created_by  uuid not null references public.profiles(id) on delete cascade
);

create index tasks_assigned_to_idx on public.tasks (assigned_to);
create index tasks_created_by_idx  on public.tasks (created_by);
create index tasks_status_idx      on public.tasks (status);

-- 3. AUTO-CREATE PROFILE ON SIGNUP ---------------------------
create function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email), 'standard');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4. ROW LEVEL SECURITY --------------------------------------
alter table public.profiles enable row level security;
alter table public.tasks    enable row level security;

-- profiles: everyone signed-in can read (for assignee names); edit only your own
create policy "profiles_select" on public.profiles
  for select to authenticated using (true);
create policy "profiles_insert_self" on public.profiles
  for insert to authenticated with check (auth.uid() = id);
create policy "profiles_update_self" on public.profiles
  for update to authenticated using (auth.uid() = id);

-- tasks: read/write only tasks you created OR are assigned to
create policy "tasks_select_own" on public.tasks
  for select to authenticated
  using (auth.uid() = created_by or auth.uid() = assigned_to);
create policy "tasks_insert_own" on public.tasks
  for insert to authenticated
  with check (auth.uid() = created_by);
create policy "tasks_update_own" on public.tasks
  for update to authenticated
  using (auth.uid() = created_by or auth.uid() = assigned_to);
create policy "tasks_delete_own" on public.tasks
  for delete to authenticated
  using (auth.uid() = created_by);

-- 5. REALTIME ------------------------------------------------
-- Required for the dashboard's live updates (RLS is still enforced).
alter publication supabase_realtime add table public.tasks;
