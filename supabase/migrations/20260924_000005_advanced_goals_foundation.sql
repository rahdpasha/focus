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

create unique index if not exists advanced_goals_user_client_id_unique_idx
  on public.advanced_goals(user_id, client_id);

create index if not exists advanced_goals_user_id_idx
  on public.advanced_goals(user_id);

alter table public.advanced_goals enable row level security;

drop policy if exists "advanced_goals_select_own"
  on public.advanced_goals;
drop policy if exists "advanced_goals_insert_own"
  on public.advanced_goals;
drop policy if exists "advanced_goals_update_own"
  on public.advanced_goals;
drop policy if exists "advanced_goals_delete_own"
  on public.advanced_goals;

create policy "advanced_goals_select_own"
  on public.advanced_goals
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "advanced_goals_insert_own"
  on public.advanced_goals
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "advanced_goals_update_own"
  on public.advanced_goals
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "advanced_goals_delete_own"
  on public.advanced_goals
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert, update, delete
  on public.advanced_goals
  to authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'advanced_goals'
  ) then
    alter publication supabase_realtime
      add table public.advanced_goals;
  end if;
end
$$;
