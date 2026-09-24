alter table public.study_sessions
  add column if not exists notes text;

alter table public.study_sessions
  add column if not exists subtasks jsonb not null default '[]'::jsonb;

alter table public.profiles
  add column if not exists public_name text;

alter table public.profiles
  add column if not exists leaderboard_opt_in boolean not null default false;

alter table public.profiles
  add column if not exists timezone text not null default 'UTC';

alter table public.profiles
  add column if not exists avatar_seed text;

insert into public.profiles (
  id,
  email,
  display_name,
  public_name,
  created_at,
  updated_at
)
select
  users.id,
  users.email,
  nullif(users.raw_user_meta_data ->> 'display_name', ''),
  nullif(users.raw_user_meta_data ->> 'display_name', ''),
  now(),
  now()
from auth.users as users
on conflict (id) do update
set
  email = excluded.email,
  display_name = coalesce(public.profiles.display_name, excluded.display_name),
  updated_at = now();

create or replace function public.handle_focus_user_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    email,
    display_name,
    public_name,
    created_at,
    updated_at
  )
  values (
    new.id,
    new.email,
    nullif(new.raw_user_meta_data ->> 'display_name', ''),
    nullif(new.raw_user_meta_data ->> 'display_name', ''),
    now(),
    now()
  )
  on conflict (id) do update
  set
    email = excluded.email,
    display_name = coalesce(public.profiles.display_name, excluded.display_name),
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_focus_profile on auth.users;

create trigger on_auth_user_created_focus_profile
after insert on auth.users
for each row execute function public.handle_focus_user_created();

create table if not exists public.daily_scores (
  user_id uuid not null references public.profiles(id) on delete cascade,
  score_date date not null,
  qualifying_minutes integer not null default 60 check (qualifying_minutes >= 1),
  achieved_minutes integer not null default 0 check (achieved_minutes >= 0),
  points smallint not null default 0 check (points in (0, 3)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, score_date)
);

create index if not exists daily_scores_date_points_idx
  on public.daily_scores(score_date, points desc);

alter table public.daily_scores enable row level security;

drop policy if exists "Users can view own daily scores" on public.daily_scores;

create policy "Users can view own daily scores"
  on public.daily_scores
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.daily_scores from anon;
revoke insert, update, delete on public.daily_scores from authenticated;
grant select on public.daily_scores to authenticated;

create or replace function public.recompute_league_score(
  p_user_id uuid,
  p_score_date date
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_timezone text := 'UTC';
  v_achieved_minutes integer := 0;
  v_points smallint := 0;
begin
  select
    case
      when exists (
        select 1
        from pg_timezone_names
        where name = coalesce(nullif(profiles.timezone, ''), 'UTC')
      )
      then coalesce(nullif(profiles.timezone, ''), 'UTC')
      else 'UTC'
    end
  into v_timezone
  from public.profiles
  where id = p_user_id;

  if v_timezone is null then
    v_timezone := 'UTC';
  end if;

  select coalesce(
    floor(sum(greatest(study_sessions.actual_seconds, 0)) / 60.0),
    0
  )::integer
  into v_achieved_minutes
  from public.study_sessions
  where study_sessions.user_id = p_user_id
    and study_sessions.completed = true
    and timezone(v_timezone, study_sessions.completed_at)::date = p_score_date;

  if v_achieved_minutes >= 60 then
    v_points := 3;
  end if;

  insert into public.daily_scores (
    user_id,
    score_date,
    qualifying_minutes,
    achieved_minutes,
    points,
    created_at,
    updated_at
  )
  values (
    p_user_id,
    p_score_date,
    60,
    v_achieved_minutes,
    v_points,
    now(),
    now()
  )
  on conflict (user_id, score_date) do update
  set
    qualifying_minutes = excluded.qualifying_minutes,
    achieved_minutes = excluded.achieved_minutes,
    points = excluded.points,
    updated_at = now();
end;
$$;

revoke all on function public.recompute_league_score(uuid, date)
  from public, anon, authenticated;

create or replace function public.refresh_my_league_history(
  p_days integer default 90
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_days integer := greatest(1, least(coalesce(p_days, 90), 370));
  v_timezone text := 'UTC';
  v_end_date date;
  v_start_date date;
  v_date date;
  v_opted_in boolean := false;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select
    profiles.leaderboard_opt_in,
    case
      when exists (
        select 1
        from pg_timezone_names
        where name = coalesce(nullif(profiles.timezone, ''), 'UTC')
      )
      then coalesce(nullif(profiles.timezone, ''), 'UTC')
      else 'UTC'
    end
  into
    v_opted_in,
    v_timezone
  from public.profiles
  where id = v_user_id;

  if not coalesce(v_opted_in, false) then
    return 0;
  end if;

  if v_timezone is null then
    v_timezone := 'UTC';
  end if;

  v_end_date := timezone(v_timezone, now())::date;
  v_start_date := v_end_date - (v_days - 1);

  for v_date in
    select generate_series(
      v_start_date,
      v_end_date,
      interval '1 day'
    )::date
  loop
    perform public.recompute_league_score(
      v_user_id,
      v_date
    );
  end loop;

  return v_days;
end;
$$;

revoke all on function public.refresh_my_league_history(integer) from public;
grant execute on function public.refresh_my_league_history(integer) to authenticated;

create or replace function public.get_leaderboard(
  p_period text,
  p_reference_date date default current_date
)
returns table (
  rank bigint,
  public_name text,
  avatar_seed text,
  points bigint,
  completed_days bigint,
  is_current_user boolean
)
language sql
security definer
set search_path = public
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
      )::bigint as completed_days
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
        totals.completed_days desc
    ) as rank,
    totals.public_name,
    totals.avatar_seed,
    totals.points,
    totals.completed_days,
    totals.id = auth.uid()
      as is_current_user
  from totals
  order by
    points desc,
    completed_days desc,
    lower(public_name),
    totals.id
  limit 100;
$$;

revoke all on function public.get_leaderboard(text, date) from public;
grant execute on function public.get_leaderboard(text, date) to authenticated;

create or replace function public.refresh_league_score_from_session()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_timezone text := 'UTC';
  v_new_date date;
  v_old_date date;
begin
  if tg_op = 'DELETE' then
    v_user_id := old.user_id;
  else
    v_user_id := new.user_id;
  end if;

  select
    case
      when exists (
        select 1
        from pg_timezone_names
        where name = coalesce(nullif(profiles.timezone, ''), 'UTC')
      )
      then coalesce(nullif(profiles.timezone, ''), 'UTC')
      else 'UTC'
    end
  into v_timezone
  from public.profiles
  where id = v_user_id;

  if v_timezone is null then
    v_timezone := 'UTC';
  end if;

  if tg_op <> 'DELETE' then
    v_new_date :=
      timezone(
        v_timezone,
        new.completed_at
      )::date;

    perform public.recompute_league_score(
      new.user_id,
      v_new_date
    );
  end if;

  if tg_op <> 'INSERT' then
    v_old_date :=
      timezone(
        v_timezone,
        old.completed_at
      )::date;

    if
      tg_op = 'DELETE'
      or old.user_id <> new.user_id
      or v_old_date <> v_new_date
    then
      perform public.recompute_league_score(
        old.user_id,
        v_old_date
      );
    end if;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

drop trigger if exists study_sessions_refresh_league_score
  on public.study_sessions;

create trigger study_sessions_refresh_league_score
after insert or update or delete
on public.study_sessions
for each row execute function public.refresh_league_score_from_session();

revoke all on function public.refresh_league_score_from_session()
  from public, anon, authenticated;
