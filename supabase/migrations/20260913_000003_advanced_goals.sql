create table if not exists public.advanced_goals (
  id uuid primary key default gen_random_uuid(),
  client_id text,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  target_minutes integer not null check (target_minutes > 0),
  deadline timestamptz not null,
  priority text not null check (priority in ('low', 'medium', 'high')),
  status text not null default 'active' check (status in ('active', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.advanced_goals enable row level security;

alter table public.advanced_goals
  drop constraint if exists advanced_goals_user_client_id_unique;

alter table public.advanced_goals
  add constraint advanced_goals_user_client_id_unique
  unique (user_id, client_id);

create index if not exists advanced_goals_user_id_idx
  on public.advanced_goals (user_id);

create policy "advanced_goals_select_own"
  on public.advanced_goals
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "advanced_goals_insert_own"
  on public.advanced_goals
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "advanced_goals_update_own"
  on public.advanced_goals
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "advanced_goals_delete_own"
  on public.advanced_goals
  for delete
  to authenticated
  using (auth.uid() = user_id);

alter publication supabase_realtime add table public.advanced_goals;
