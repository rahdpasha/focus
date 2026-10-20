-- FOCUS: independently complete timers and queue real Web Push alerts.
create schema if not exists private;
revoke all on schema private from public;

create table if not exists public.focus_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique check (length(endpoint) between 20 and 2048 and endpoint like 'https://%'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists focus_push_subscriptions_user_id_idx on public.focus_push_subscriptions(user_id);
alter table public.focus_push_subscriptions enable row level security;
create policy "Own push subscriptions" on public.focus_push_subscriptions for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
grant select, insert, update, delete on public.focus_push_subscriptions to authenticated;

create table if not exists public.focus_timer_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_client_id text not null,
  subject_client_id text not null,
  subject_name text not null,
  duration_seconds integer not null check (duration_seconds between 1 and 21600),
  started_at timestamptz not null,
  due_at timestamptz not null,
  total_paused_seconds integer not null default 0 check (total_paused_seconds between 0 and 86400),
  interruptions integer not null default 0 check (interruptions between 0 and 1000),
  status text not null default 'active' check (status in ('active', 'paused', 'completed', 'cancelled')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, session_client_id)
);
create index if not exists focus_timer_due_idx on public.focus_timer_jobs(due_at) where status = 'active';
alter table public.focus_timer_jobs enable row level security;
create policy "Own timer jobs" on public.focus_timer_jobs for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
grant select, insert, update, delete on public.focus_timer_jobs to authenticated;

create table if not exists private.focus_push_outbox (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.focus_timer_jobs(id) on delete cascade,
  endpoint text not null,
  status text not null default 'pending' check (status in ('pending','sending','delivered','failed')),
  attempts integer not null default 0,
  last_attempt_at timestamptz,
  created_at timestamptz not null default now(),
  unique(job_id, endpoint)
);

-- Return only the public signing key, which is safe to include in the browser.
create or replace function public.focus_vapid_public_key()
returns text language sql stable set search_path = ''
as $$select 'BPDIOUyrqErY3Bz4RaqGyAVOh2ihZdj7kLeKw1I5da08KIBZpS3cUK6Nr2aCUjqYSyt2qy2pZRWSZZBfkgUivP4'::text$$;
revoke all on function public.focus_vapid_public_key() from public;
grant execute on function public.focus_vapid_public_key() to authenticated;

-- Private cron worker: finish sessions even if the iPhone suspended the PWA.
create or replace function private.focus_complete_due_timers()
returns void language plpgsql security definer set search_path = ''
as $$
declare job record;
declare cloud_subject_id uuid;
declare push_token text;
begin
  for job in
    update public.focus_timer_jobs
       set status = 'completed', completed_at = due_at
     where id in (
       select id from public.focus_timer_jobs
       where status = 'active' and due_at <= now()
       order by due_at
       limit 100
       for update skip locked
     )
     returning *
  loop
    select id into cloud_subject_id
    from public.subjects s
    where s.user_id = job.user_id
      and s.archived_at is null
      and (s.client_id = job.subject_client_id or s.id::text = job.subject_client_id)
    limit 1;

    if cloud_subject_id is not null then
      insert into public.study_sessions (
        user_id, client_id, subject_id,
        planned_seconds, actual_seconds, started_at, completed_at,
        completed, interruptions, total_paused_seconds
      ) values (
        job.user_id, job.session_client_id, cloud_subject_id,
        job.duration_seconds, job.duration_seconds,
        job.started_at, job.due_at,
        true, job.interruptions, job.total_paused_seconds
      ) on conflict (user_id, client_id) do nothing;
    end if;

    insert into private.focus_push_outbox(job_id, endpoint)
    select job.id, p.endpoint from public.focus_push_subscriptions p
    where p.user_id = job.user_id
    on conflict (job_id, endpoint) do nothing;
  end loop;

  -- Retry notifications safely, without polling with serverless workers
  -- when no outgoing push notifications exist.
  if exists (
     select 1 from private.focus_push_outbox
     where (status='pending' and attempts < 3)
        or (status='sending' and last_attempt_at < now() - interval '2 minutes' and attempts < 3)
  ) then
    select decrypted_secret into push_token
      from vault.decrypted_secrets where name = 'focus_push_dispatch_token';
    if push_token is not null then
      perform net.http_post(
        url := 'https://rvzzieqynxybjccbutvs.supabase.co/functions/v1/focus-push-dispatch',
        body := '{}'::jsonb,
        headers := jsonb_build_object('Content-Type','application/json', 'Authorization','Bearer ' || push_token),
        timeout_milliseconds := 10000
      );
    end if;
  end if;
end;
$$;
revoke all on function private.focus_complete_due_timers() from public, anon, authenticated;

-- Each remote dispatch must prove knowledge of the Vault-held secret.
-- This public RPC does not expose anything unless it receives that secret.
create or replace function public.focus_claim_push_jobs(p_token text)
returns table(job_id uuid, outbox_id uuid, endpoint text, signing_jwk text, public_key text)
language plpgsql security definer set search_path = ''
as $$
declare expected text;
begin
  select decrypted_secret into expected
    from vault.decrypted_secrets where name = 'focus_push_dispatch_token';
  if expected is null or p_token is distinct from expected then
    raise exception 'unauthorized' using errcode = '28000';
  end if;
  return query
  with candidates as (
    select o.id from private.focus_push_outbox o
    where (o.status='pending' and o.attempts < 3)
       or (o.status='sending' and o.last_attempt_at < now() - interval '2 minutes' and o.attempts < 3)
    order by o.created_at limit 50 for update skip locked
  ), claimed as (
    update private.focus_push_outbox o
    set status='sending', attempts=o.attempts+1, last_attempt_at=now()
    from candidates c where o.id=c.id
    returning o.id, o.job_id, o.endpoint
  )
  select c.job_id, c.id, c.endpoint,
     (select decrypted_secret from vault.decrypted_secrets where name='focus_push_signing_jwk'),
     public.focus_vapid_public_key()
  from claimed c;
end;
$$;
revoke all on function public.focus_claim_push_jobs(text) from public, authenticated;
grant execute on function public.focus_claim_push_jobs(text) to anon;

create or replace function public.focus_ack_push_job(
  p_token text, p_outbox_id uuid, p_delivered boolean, p_permanent_failure boolean default false
) returns void language plpgsql security definer set search_path = ''
as $$
declare expected text;
begin
  select decrypted_secret into expected
    from vault.decrypted_secrets where name = 'focus_push_dispatch_token';
  if expected is null or p_token is distinct from expected then
    raise exception 'unauthorized' using errcode = '28000';
  end if;
  update private.focus_push_outbox
  set status = case when p_delivered then 'delivered'
    when p_permanent_failure or attempts >= 3 then 'failed'
    else 'pending' end
  where id = p_outbox_id and status = 'sending';
end;
$$;
revoke all on function public.focus_ack_push_job(text,uuid,boolean,boolean) from public, authenticated;
grant execute on function public.focus_ack_push_job(text,uuid,boolean,boolean) to anon;

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;
select cron.schedule(
  'focus-background-completion-v1',
  '15 seconds',
  'select private.focus_complete_due_timers()'
);
