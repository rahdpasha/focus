alter table public.routine_items
  add column if not exists days_of_week smallint[] not null
    default array[0,1,2,3,4,5,6]::smallint[];

alter table public.routine_items
  add column if not exists recovery_days smallint not null
    default 1;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.routine_items'::regclass
      and conname = 'routine_items_days_of_week_valid'
  ) then
    alter table public.routine_items
      add constraint routine_items_days_of_week_valid
      check (
        cardinality(days_of_week) between 1 and 7
        and days_of_week <@ array[0,1,2,3,4,5,6]::smallint[]
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.routine_items'::regclass
      and conname = 'routine_items_recovery_days_valid'
  ) then
    alter table public.routine_items
      add constraint routine_items_recovery_days_valid
      check (recovery_days between 0 and 3);
  end if;
end
$$;

alter table public.study_sessions
  add column if not exists routine_item_client_id text;

alter table public.study_sessions
  add column if not exists routine_date date;

create index if not exists study_sessions_user_routine_date_idx
  on public.study_sessions(user_id, routine_item_client_id, routine_date)
  where deleted_at is null
    and routine_item_client_id is not null
    and routine_date is not null;
