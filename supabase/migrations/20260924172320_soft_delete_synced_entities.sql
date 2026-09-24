alter table public.study_sessions
  add column if not exists deleted_at timestamptz;

alter table public.advanced_goals
  add column if not exists deleted_at timestamptz;

comment on column public.study_sessions.deleted_at is
  'Sync tombstone. Deleted sessions remain server-side so stale devices cannot recreate them; normal client reads exclude tombstoned rows.';

comment on column public.advanced_goals.deleted_at is
  'Sync tombstone. Deleted goals remain server-side so stale devices cannot recreate them; normal client reads exclude tombstoned rows.';

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
    and study_sessions.deleted_at is null
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
