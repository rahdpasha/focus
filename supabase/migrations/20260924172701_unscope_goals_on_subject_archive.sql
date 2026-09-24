create or replace function public.unscope_goals_on_subject_archive()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if
    old.archived_at is null
    and new.archived_at is not null
    and new.client_id is not null
  then
    update public.advanced_goals
    set
      subject_client_id = null,
      updated_at = now()
    where user_id = new.user_id
      and subject_client_id = new.client_id
      and deleted_at is null;
  end if;

  return new;
end;
$$;

revoke all on function public.unscope_goals_on_subject_archive()
  from public, anon, authenticated;

drop trigger if exists subjects_unscope_goals_on_archive
  on public.subjects;

create trigger subjects_unscope_goals_on_archive
after update of archived_at
on public.subjects
for each row
execute function public.unscope_goals_on_subject_archive();
