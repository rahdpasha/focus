create or replace function public.get_league_season_leaderboard(
  p_reference_date date default current_date
)
returns table (
  rank bigint,
  public_name text,
  avatar_seed text,
  points bigint,
  scored_days bigint,
  total_seconds bigint,
  is_current_user boolean
)
language sql
security definer
set search_path = pg_catalog, public
as $$
  with bounds as (
    select
      (
        date_trunc('quarter', p_reference_date::timestamp)
      )::date as start_date,
      (
        date_trunc('quarter', p_reference_date::timestamp)
        + interval '3 months - 1 day'
      )::date as end_date
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
      and daily_scores.score_date
        between bounds.start_date
        and least(bounds.end_date, p_reference_date)
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

revoke all on function public.get_league_season_leaderboard(date)
  from public, anon, authenticated;
grant execute on function public.get_league_season_leaderboard(date)
  to authenticated;
