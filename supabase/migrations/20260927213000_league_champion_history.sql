create or replace function public.get_league_champion_history(
  p_reference_date date default current_date
)
returns table (
  week_start date,
  public_name text,
  avatar_seed text,
  points bigint,
  total_seconds bigint,
  is_current_user boolean
)
language sql
security definer
set search_path = pg_catalog, public
as $$
  with completed_week_cutoff as (
    select date_trunc(
      'week',
      p_reference_date::timestamp
    )::date as current_week_start
  ),
  weekly_totals as (
    select
      date_trunc(
        'week',
        daily_scores.score_date::timestamp
      )::date as week_start,
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
      coalesce(sum(daily_scores.achieved_seconds), 0)::bigint as total_seconds
    from public.daily_scores
    join public.profiles
      on profiles.id = daily_scores.user_id
    cross join completed_week_cutoff
    where profiles.leaderboard_opt_in = true
      and daily_scores.score_date < completed_week_cutoff.current_week_start
    group by
      week_start,
      profiles.id,
      profiles.public_name,
      profiles.display_name,
      profiles.avatar_seed
  ),
  ranked as (
    select
      weekly_totals.*,
      dense_rank() over (
        partition by weekly_totals.week_start
        order by
          weekly_totals.points desc,
          weekly_totals.total_seconds desc
      ) as weekly_rank
    from weekly_totals
  )
  select
    ranked.week_start,
    ranked.public_name,
    ranked.avatar_seed,
    ranked.points,
    ranked.total_seconds,
    ranked.id = auth.uid() as is_current_user
  from ranked
  where ranked.weekly_rank = 1
    and ranked.points > 0
  order by
    ranked.week_start desc,
    lower(ranked.public_name),
    ranked.id;
$$;

revoke all on function public.get_league_champion_history(date)
  from public, anon, authenticated;
grant execute on function public.get_league_champion_history(date)
  to authenticated;
