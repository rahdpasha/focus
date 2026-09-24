create or replace function public.normalize_advanced_goal_subject_scope()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if
    new.subject_client_id is not null
    and not exists (
      select 1
      from public.subjects
      where subjects.user_id = new.user_id
        and subjects.client_id = new.subject_client_id
        and subjects.archived_at is null
    )
  then
    new.subject_client_id := null;
  end if;

  return new;
end;
$$;

revoke all on function public.normalize_advanced_goal_subject_scope()
  from public, anon, authenticated;

drop trigger if exists advanced_goals_normalize_subject_scope
  on public.advanced_goals;

create trigger advanced_goals_normalize_subject_scope
before insert or update of user_id, subject_client_id
on public.advanced_goals
for each row
execute function public.normalize_advanced_goal_subject_scope();
