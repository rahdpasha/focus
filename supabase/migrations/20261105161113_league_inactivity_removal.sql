alter table public.profiles
  add column if not exists league_joined_at timestamptz,
  add column if not exists league_inactive_removed_at timestamptz;

comment on column public.profiles.league_joined_at is
  'Timestamp of the current League opt-in period; reset whenever a user rejoins.';

comment on column public.profiles.league_inactive_removed_at is
  'Timestamp when the user was automatically hidden from the League after 10 days without a completed focus session.';

-- Give current members a 10-day grace period from rollout.
update public.profiles
set league_joined_at = now()
where leaderboard_opt_in = true
  and league_joined_at is null;

create index if not exists study_sessions_league_activity_idx
  on public.study_sessions (user_id, completed_at desc)
  where completed = true and deleted_at is null;

create or replace function private.set_league_joined_at()
returns trigger
language plpgsql
set search_path = pg_catalog, public, private
as $$
begin
  if tg_op = 'INSERT' then
    if new.leaderboard_opt_in then
      new.league_joined_at := now();
      new.league_inactive_removed_at := null;
    end if;
  elsif tg_op = 'UPDATE' then
    if new.leaderboard_opt_in and old.leaderboard_opt_in is distinct from true then
      new.league_joined_at := now();
      new.league_inactive_removed_at := null;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_set_league_joined_at
  on public.profiles;

create trigger profiles_set_league_joined_at
before insert or update of leaderboard_opt_in
on public.profiles
for each row
execute function private.set_league_joined_at();

create or replace function private.expire_inactive_league_members()
returns integer
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  v_removed integer := 0;
begin
  update public.profiles as p
  set
    leaderboard_opt_in = false,
    league_inactive_removed_at = now(),
    updated_at = now()
  where p.leaderboard_opt_in = true
    and greatest(
      coalesce(
        (
          select max(s.completed_at)
          from public.study_sessions as s
          where s.user_id = p.id
            and s.completed = true
            and s.deleted_at is null
            and s.completed_at is not null
        ),
        p.league_joined_at,
        p.created_at
      ),
      coalesce(p.league_joined_at, p.created_at)
    ) <= now() - interval '10 days';

  get diagnostics v_removed = row_count;
  return v_removed;
end;
$$;

revoke all on function private.set_league_joined_at()
  from public, anon, authenticated;
revoke all on function private.expire_inactive_league_members()
  from public, anon, authenticated;

-- Run hourly so removal happens shortly after the 10-day inactivity threshold.
select cron.schedule(
  'focus-league-inactivity-cleanup-v1',
  '0 * * * *',
  'select private.expire_inactive_league_members();'
);
