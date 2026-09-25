alter table public.daily_scores
  add column if not exists achieved_seconds integer not null default 0;

update public.daily_scores
set achieved_seconds = greatest(achieved_minutes, 0) * 60
where achieved_seconds = 0
  and achieved_minutes > 0;

alter table public.daily_scores
  drop constraint if exists daily_scores_achieved_seconds_check;
alter table public.daily_scores
  add constraint daily_scores_achieved_seconds_check
  check (achieved_seconds >= 0);

alter table public.daily_scores
  drop constraint if exists daily_scores_points_check;
alter table public.daily_scores
  add constraint daily_scores_points_check
  check (points = any (array[0, 1, 3]::smallint[]));

create or replace function public.recompute_league_score(
  p_user_id uuid,
  p_score_date date
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_timezone text := 'UTC';
  v_achieved_seconds integer := 0;
  v_achieved_minutes integer := 0;
  v_points smallint := 0;
  v_today date;
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

  v_today := timezone(v_timezone, now())::date;

  select coalesce(
    sum(greatest(study_sessions.actual_seconds, 0)),
    0
  )::integer
  into v_achieved_seconds
  from public.study_sessions
  where study_sessions.user_id = p_user_id
    and study_sessions.completed = true
    and study_sessions.deleted_at is null
    and timezone(v_timezone, study_sessions.completed_at)::date = p_score_date;

  v_achieved_minutes := floor(v_achieved_seconds / 60.0)::integer;

  if v_achieved_seconds > 5400 then
    v_points := 3;
  elsif v_achieved_seconds > 0 then
    v_points := 1;
  end if;

  if p_score_date >= v_today and v_achieved_seconds = 0 then
    delete from public.daily_scores
    where user_id = p_user_id
      and score_date = p_score_date;
    return;
  end if;

  insert into public.daily_scores (
    user_id,
    score_date,
    qualifying_minutes,
    achieved_minutes,
    achieved_seconds,
    points,
    created_at,
    updated_at
  )
  values (
    p_user_id,
    p_score_date,
    90,
    v_achieved_minutes,
    v_achieved_seconds,
    v_points,
    now(),
    now()
  )
  on conflict (user_id, score_date) do update
  set
    qualifying_minutes = excluded.qualifying_minutes,
    achieved_minutes = excluded.achieved_minutes,
    achieved_seconds = excluded.achieved_seconds,
    points = excluded.points,
    updated_at = now();
end;
$$;

create or replace function public.refresh_my_league_history(
  p_days integer default 90
)
returns integer
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_user_id uuid := auth.uid();
  v_days integer := greatest(1, least(coalesce(p_days, 90), 370));
  v_timezone text := 'UTC';
  v_today date;
  v_start_date date;
  v_date date;
  v_opted_in boolean := false;
  v_today_seconds integer := 0;
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

  v_today := timezone(v_timezone, now())::date;
  v_start_date := v_today - (v_days - 1);

  for v_date in
    select generate_series(
      v_start_date,
      v_today - 1,
      interval '1 day'
    )::date
  loop
    perform public.recompute_league_score(
      v_user_id,
      v_date
    );
  end loop;

  select coalesce(sum(greatest(actual_seconds, 0)), 0)::integer
  into v_today_seconds
  from public.study_sessions
  where user_id = v_user_id
    and completed = true
    and deleted_at is null
    and timezone(v_timezone, completed_at)::date = v_today;

  if v_today_seconds > 0 then
    perform public.recompute_league_score(
      v_user_id,
      v_today
    );
  else
    delete from public.daily_scores
    where user_id = v_user_id
      and score_date = v_today;
  end if;

  return v_days;
end;
$$;

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
  scored_days bigint,
  total_minutes bigint,
  total_seconds bigint,
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
          then date_trunc('month', p_reference_date::timestamp)::date
        else date_trunc('week', p_reference_date::timestamp)::date
      end as start_date,
      case
        when lower(p_period) = 'month'
          then (
            date_trunc('month', p_reference_date::timestamp)
            + interval '1 month - 1 day'
          )::date
        else (
          date_trunc('week', p_reference_date::timestamp)
          + interval '6 days'
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
        where daily_scores.points > 0
      )::bigint as scored_days,
      coalesce(sum(daily_scores.achieved_seconds), 0)::bigint as total_seconds
    from public.profiles
    cross join bounds
    left join public.daily_scores
      on daily_scores.user_id = profiles.id
      and daily_scores.score_date between bounds.start_date and bounds.end_date
    where profiles.leaderboard_opt_in = true
    group by
      profiles.id,
      profiles.public_name,
      profiles.display_name,
      profiles.avatar_seed
  )
  select
    dense_rank() over (
      order by totals.points desc, totals.total_seconds desc
    ) as rank,
    totals.public_name,
    totals.avatar_seed,
    totals.points,
    totals.scored_days,
    floor(totals.total_seconds / 60.0)::bigint as total_minutes,
    totals.total_seconds,
    totals.id = auth.uid() as is_current_user
  from totals
  order by
    points desc,
    total_seconds desc,
    lower(public_name),
    totals.id
  limit 100;
$$;

revoke all on function public.get_leaderboard(text, date)
  from public, anon, authenticated;
grant execute on function public.get_leaderboard(text, date)
  to authenticated;

revoke all on function public.refresh_my_league_history(integer)
  from public, anon, authenticated;
grant execute on function public.refresh_my_league_history(integer)
  to authenticated;

do $$
declare
  r record;
  v_today date;
  v_start date;
  v_date date;
begin
  for r in
    select
      id,
      case
        when exists (
          select 1
          from pg_timezone_names
          where name = coalesce(nullif(timezone, ''), 'UTC')
        )
        then coalesce(nullif(timezone, ''), 'UTC')
        else 'UTC'
      end as tz
    from public.profiles
    where leaderboard_opt_in = true
  loop
    v_today := timezone(r.tz, now())::date;
    v_start := v_today - 369;

    for v_date in
      select generate_series(v_start, v_today, interval '1 day')::date
    loop
      perform public.recompute_league_score(r.id, v_date);
    end loop;
  end loop;
end;
$$;
