create table if not exists public.routine_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id text not null,
  title text not null check (length(btrim(title)) between 1 and 80),
  subject_client_id text not null,
  target_minutes integer not null default 25 check (target_minutes between 1 and 720),
  mode text not null default 'fixed' check (mode in ('fixed', 'rotation')),
  rotation_order integer not null default 0 check (rotation_order >= 0),
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint routine_items_user_client_id_unique unique (user_id, client_id)
);

create index if not exists routine_items_user_active_idx
  on public.routine_items(user_id, mode, rotation_order)
  where deleted_at is null and enabled = true;

alter table public.routine_items enable row level security;

drop policy if exists "Users can view own routine items"
  on public.routine_items;
create policy "Users can view own routine items"
  on public.routine_items
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create own routine items"
  on public.routine_items;
create policy "Users can create own routine items"
  on public.routine_items
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own routine items"
  on public.routine_items;
create policy "Users can update own routine items"
  on public.routine_items
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own routine items"
  on public.routine_items;
create policy "Users can delete own routine items"
  on public.routine_items
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.routine_items from anon;
grant select, insert, update, delete
  on public.routine_items
  to authenticated;

do $$
begin
  if exists (
    select 1 from pg_publication
    where pubname = 'supabase_realtime'
  ) and not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'routine_items'
  ) then
    alter publication supabase_realtime
      add table public.routine_items;
  end if;
end
$$;

create or replace function public.archive_routine_items_for_subject()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if old.archived_at is null and new.archived_at is not null then
    update public.routine_items
    set
      deleted_at = coalesce(deleted_at, now()),
      updated_at = now()
    where user_id = new.user_id
      and subject_client_id = new.client_id
      and deleted_at is null;
  end if;

  return new;
end;
$$;

revoke all on function public.archive_routine_items_for_subject()
  from public, anon, authenticated;

drop trigger if exists subjects_archive_routine_items
  on public.subjects;

create trigger subjects_archive_routine_items
after update of archived_at
on public.subjects
for each row
execute function public.archive_routine_items_for_subject();

drop function if exists public.get_leaderboard(text, date);

create function public.get_leaderboard(
  p_period text,
  p_reference_date date default current_date
)
returns table (
  rank bigint,
  public_name text,
  avatar_seed text,
  points bigint,
  completed_days bigint,
  total_minutes bigint,
  is_current_user boolean
)
language sql
security definer
set search_path = pg_catalog, public
as $$
  with bounds as (
    select
      case
        when lower(p_period) = 'month'
          then date_trunc(
            'month',
            p_reference_date::timestamp
          )::date
        else date_trunc(
          'week',
          p_reference_date::timestamp
        )::date
      end as start_date,
      case
        when lower(p_period) = 'month'
          then (
            date_trunc(
              'month',
              p_reference_date::timestamp
            ) + interval '1 month - 1 day'
          )::date
        else (
          date_trunc(
            'week',
            p_reference_date::timestamp
          ) + interval '6 days'
        )::date
      end as end_date
  ),
  totals as (
    select
      profiles.id,
      coalesce(
        nullif(trim(profiles.public_name), ''),
        nullif(trim(profiles.display_name), ''),
        'Focused learner'
      ) as public_name,
      coalesce(
        nullif(trim(profiles.avatar_seed), ''),
        nullif(trim(profiles.public_name), ''),
        nullif(trim(profiles.display_name), ''),
        'Focused learner'
      ) as avatar_seed,
      coalesce(sum(daily_scores.points), 0)::bigint as points,
      count(*) filter (
        where daily_scores.points = 3
      )::bigint as completed_days,
      coalesce(sum(daily_scores.achieved_minutes), 0)::bigint as total_minutes
    from public.profiles
    cross join bounds
    left join public.daily_scores
      on daily_scores.user_id = profiles.id
      and daily_scores.score_date
        between bounds.start_date
        and bounds.end_date
    where profiles.leaderboard_opt_in = true
    group by
      profiles.id,
      profiles.public_name,
      profiles.display_name,
      profiles.avatar_seed
  )
  select
    dense_rank() over (
      order by
        totals.points desc,
        totals.total_minutes desc
    ) as rank,
    totals.public_name,
    totals.avatar_seed,
    totals.points,
    totals.completed_days,
    totals.total_minutes,
    totals.id = auth.uid()
      as is_current_user
  from totals
  order by
    points desc,
    total_minutes desc,
    lower(public_name),
    totals.id
  limit 100;
$$;

revoke all on function public.get_leaderboard(text, date)
  from public, anon, authenticated;
grant execute on function public.get_leaderboard(text, date)
  to authenticated;
