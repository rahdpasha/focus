do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'advanced_goals_user_client_id_unique'
      and conrelid = 'public.advanced_goals'::regclass
  ) then
    alter table public.advanced_goals
      add constraint advanced_goals_user_client_id_unique
      unique (user_id, client_id);
  end if;
end
$$;

drop index if exists public.advanced_goals_user_client_id_unique_idx;
