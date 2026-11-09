-- Preserve newer Muse fields when an older cached client attempts to save.
-- No new grants, tables, policies, or changes to FOCUS study/push data.
create function public.muse_guard_routine_fields()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if (old.state ? 'routines' and not (new.state ? 'routines'))
     or (old.state ? 'routineOccurrences' and not (new.state ? 'routineOccurrences')) then
    raise exception 'Muse was upgraded. Refresh FOCUS before saving to preserve your routines.'
      using errcode = '40001';
  end if;
  if (new.state ? 'routines' and jsonb_typeof(new.state->'routines') is distinct from 'array')
     or (new.state ? 'routineOccurrences' and jsonb_typeof(new.state->'routineOccurrences') is distinct from 'array') then
    raise exception 'Invalid Muse routines' using errcode = '22023';
  end if;
  return new;
end;
$$;
revoke all on function public.muse_guard_routine_fields() from public, anon, authenticated;
create trigger muse_preserve_routine_fields
before update of state on public.muse_workspaces
for each row execute function public.muse_guard_routine_fields();
