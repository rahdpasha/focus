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
    totals.scored_days as completed_days,
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
