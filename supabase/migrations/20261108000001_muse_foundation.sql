-- Additive only: does not modify FOCUS study tables, auth, timers, or push jobs.
create table public.muse_workspaces (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null check (jsonb_typeof(state) = 'object' and octet_length(state::text) <= 500000),
  revision integer not null default 0 check (revision >= 0),
  last_mutation_id uuid,
  updated_at timestamptz not null default now()
);
alter table public.muse_workspaces enable row level security;
create policy "Read own Muse workspace" on public.muse_workspaces for select to authenticated
  using ((select auth.uid()) = user_id);
revoke all on public.muse_workspaces from anon, authenticated;
grant select on public.muse_workspaces to authenticated;

-- Auth identity is derived on the server. All writes pass through a revision check.
-- Mutation IDs make retrying a lost successful response idempotent.
create or replace function public.muse_save_workspace(p_state jsonb, p_expected_revision integer, p_mutation_id uuid)
returns integer language plpgsql security definer set search_path = '' as $$
declare caller uuid := auth.uid();
declare existing public.muse_workspaces%rowtype;
begin
  if caller is null then raise exception 'Authentication required' using errcode='28000'; end if;
  if p_mutation_id is null or p_expected_revision is null or p_expected_revision < 0
     or p_state is null or jsonb_typeof(p_state) <> 'object' or octet_length(p_state::text) > 500000
     or jsonb_typeof(p_state->'profile') is distinct from 'object'
     or jsonb_typeof(p_state->'tasks') is distinct from 'array'
     or jsonb_typeof(p_state->'templates') is distinct from 'array'
     or jsonb_typeof(p_state->'outings') is distinct from 'array'
     or jsonb_typeof(p_state->'memories') is distinct from 'array'
     then raise exception 'Invalid Muse state' using errcode='22023'; end if;
  insert into public.muse_workspaces(user_id,state,revision) values(caller,p_state,0) on conflict (user_id) do nothing;
  select * into existing from public.muse_workspaces where user_id=caller for update;
  if existing.last_mutation_id = p_mutation_id then return existing.revision; end if;
  if existing.revision <> p_expected_revision then raise exception 'Muse revision conflict' using errcode='40001'; end if;
  update public.muse_workspaces set state=p_state,revision=existing.revision+1,last_mutation_id=p_mutation_id,updated_at=now() where user_id=caller;
  return existing.revision+1;
end;
$$;
revoke all on function public.muse_save_workspace(jsonb,integer,uuid) from public,anon;
grant execute on function public.muse_save_workspace(jsonb,integer,uuid) to authenticated;
