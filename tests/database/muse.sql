-- Run only in a disposable PostgreSQL database. Never against a FOCUS project.
\set ON_ERROR_STOP on
create role anon nologin;
create role authenticated nologin;
create schema auth;
create table auth.users (id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;
grant usage on schema auth, public to anon, authenticated;
grant execute on function auth.uid() to anon, authenticated;
insert into auth.users values
 ('00000000-0000-0000-0000-000000000001'),
 ('00000000-0000-0000-0000-000000000002');
\ir ../../supabase/migrations/20261108224112_muse_foundation.sql
\ir ../../supabase/migrations/20261109091650_muse_routine_compatibility.sql

set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', false);
do $$
declare
  payload jsonb := '{"profile":{"name":"Alice","timezone":"Asia/Baghdad","priorities":[]},"tasks":[],"templates":[],"outings":[],"memories":[]}';
  result integer;
begin
  result := public.muse_save_workspace(payload, 0, '10000000-0000-0000-0000-000000000001');
  if result <> 1 then raise exception 'Initial save must return revision 1'; end if;
  result := public.muse_save_workspace(payload, 0, '10000000-0000-0000-0000-000000000001');
  if result <> 1 then raise exception 'Lost-response retry must not increment revision'; end if;
  begin
    perform public.muse_save_workspace(payload, 0, '10000000-0000-0000-0000-000000000002');
    raise exception 'Stale save unexpectedly succeeded';
  exception when serialization_failure then null;
  end;
  if (select revision from public.muse_workspaces) <> 1 then raise exception 'Conflict modified saved data'; end if;
  begin
    update public.muse_workspaces set revision = 99;
    raise exception 'Direct write unexpectedly succeeded';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.muse_save_workspace('{}', 1, '10000000-0000-0000-0000-000000000003');
    raise exception 'Invalid data accepted';
  exception when invalid_parameter_value then null;
  end;
  begin
    perform public.muse_save_workspace(jsonb_set(payload, '{profile,name}', to_jsonb(repeat('x', 500001))), 1, '10000000-0000-0000-0000-000000000004');
    raise exception 'Oversized data accepted';
  exception when invalid_parameter_value then null;
  end;
end $$;

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000002', false);
do $$
begin
  if exists(select 1 from public.muse_workspaces) then raise exception 'Another user can read Alice data'; end if;
  perform public.muse_save_workspace('{"profile":{},"tasks":[],"templates":[],"outings":[],"memories":[]}', 0, '20000000-0000-0000-0000-000000000001');
  if (select count(*) from public.muse_workspaces) <> 1 then raise exception 'User must see only own row'; end if;
  if (select user_id from public.muse_workspaces) <> auth.uid() then raise exception 'Write used wrong owner'; end if;
end $$;

select set_config('request.jwt.claim.sub', '', false);
do $$
begin
  if exists(select 1 from public.muse_workspaces) then raise exception 'Missing identity can read private data'; end if;
  begin
    perform public.muse_save_workspace('{}', 0, '30000000-0000-0000-0000-000000000001');
    raise exception 'Missing identity can save';
  exception when invalid_authorization_specification then null;
  end;
end $$;

set role anon;
do $$
begin
  begin
    perform public.muse_save_workspace('{}', 0, '30000000-0000-0000-0000-000000000001');
    raise exception 'Anonymous RPC allowed';
  exception when insufficient_privilege then null;
  end;
  begin
    perform 1 from public.muse_workspaces;
    raise exception 'Anonymous table read allowed';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;
do $$
begin
  if (select count(*) from public.muse_workspaces) <> 2 then raise exception 'Unexpected row count'; end if;
  if (select state->'profile'->>'name' from public.muse_workspaces where user_id='00000000-0000-0000-0000-000000000001') <> 'Alice' then raise exception 'Alice data changed'; end if;
end $$;
\echo 'PASS: ownership, anonymous denial, missing identity, direct-write denial, retries, stale writes and payload limits'

set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', false);
do $$
declare payload jsonb;
begin
  select state into payload from public.muse_workspaces;
  payload := payload || '{"routines":[{"id":"weekly"}],"routineOccurrences":[]}'::jsonb;
  perform public.muse_save_workspace(payload, 1, '10000000-0000-0000-0000-000000000005');
  begin
    perform public.muse_save_workspace(payload - 'routines' - 'routineOccurrences', 2, '10000000-0000-0000-0000-000000000006');
    raise exception 'Old client erased new fields';
  exception when serialization_failure then null;
  end;
  if (select revision from public.muse_workspaces) <> 2 then raise exception 'Rejected downgrade changed revision'; end if;
  if (select state->'routines' from public.muse_workspaces) <> '[{"id":"weekly"}]'::jsonb then raise exception 'Routine was lost'; end if;
  begin
    perform public.muse_save_workspace(jsonb_set(payload, '{routines}', 'null'), 2, '10000000-0000-0000-0000-000000000007');
    raise exception 'Invalid routines accepted';
  exception when invalid_parameter_value then null;
  end;
  perform public.muse_save_workspace(payload, 2, '10000000-0000-0000-0000-000000000008');
end $$;
reset role;
\echo 'PASS: legacy client downgrade blocked; upgraded client can save'
