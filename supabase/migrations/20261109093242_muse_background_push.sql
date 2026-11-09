-- Opt-in encrypted Muse alerts reuse FOCUS subscriptions, Vault keys and dispatcher.
-- Deployment switch stays OFF until the updated dispatcher and SW are deployed.
alter table public.focus_push_subscriptions
  add column muse_enabled boolean not null default false,
  add column p256dh text check (p256dh is null or length(p256dh) between 80 and 100),
  add column auth_key text check (auth_key is null or length(auth_key) between 20 and 30);
alter table public.focus_push_subscriptions add constraint muse_requires_keys
  check (not muse_enabled or (p256dh is not null and auth_key is not null));
create table private.muse_push_config (id boolean primary key default true check(id), enabled boolean not null default false);
insert into private.muse_push_config values(true,false);
create table private.muse_push_outbox (
 id uuid primary key default gen_random_uuid(),
 subscription_id uuid not null references public.focus_push_subscriptions(id) on delete cascade,
 reminder_key text not null,
 kind text not null check(kind in ('departure','return','task','test')),
 target_id text not null,
 due_at timestamptz not null,
 expires_at timestamptz not null,
 status text not null default 'pending' check(status in ('pending','sending','accepted','failed','cancelled')),
 attempts int not null default 0,
 lease uuid,
 last_attempt_at timestamptz,
 created_at timestamptz not null default now(),
 unique(subscription_id,reminder_key)
);
create index muse_push_pending on private.muse_push_outbox(due_at) where status in ('pending','sending');
create index muse_push_daily on private.muse_push_outbox(subscription_id,created_at);
alter table private.muse_push_config enable row level security;
alter table private.muse_push_outbox enable row level security;
revoke all on private.muse_push_config, private.muse_push_outbox from public,anon,authenticated;

-- Defensive parsing: malformed user JSON must not stop the scheduler for others.
create function private.muse_stamp(value text) returns timestamptz
language plpgsql immutable set search_path='' as $$
begin
 if value !~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:' then return null; end if;
 return value::timestamptz;
exception when others then return null;
end $$;
create function private.muse_array(value jsonb) returns jsonb
language sql immutable set search_path='' as $$
 select case when jsonb_typeof(value)='array' then value else '[]'::jsonb end
$$;
create function private.muse_due(s jsonb, at_time timestamptz)
returns table(reminder_key text,kind text,target_id text,due_at timestamptz)
language plpgsql stable set search_path='' as $$
declare item jsonb; occurrence jsonb; stamp timestamptz;
declare local_day date := (at_time at time zone 'Asia/Baghdad')::date;
declare occurrence_id text;
begin
 for item in select value from jsonb_array_elements(private.muse_array(s->'outings')) loop
  if item->>'state' = 'out' then
   stamp := private.muse_stamp(item->>'returnReminderAt');
   if stamp between at_time-interval '30 minutes' and at_time and length(item->>'id') between 1 and 100 then
    return query select 'return:'||(item->>'id')||':'||extract(epoch from stamp)::bigint, 'return', item->>'id', stamp;
   end if;
  end if;
 end loop;
 for item in select value from jsonb_array_elements(private.muse_array(s->'tasks')) loop
  if item->>'done'='false' and item->>'reminderStatus'='pending' then
   stamp := private.muse_stamp(item->>'reminderAt');
   if stamp between at_time-interval '30 minutes' and at_time and length(item->>'id') between 1 and 100 then
    return query select 'task:'||(item->>'id')||':'||extract(epoch from stamp)::bigint, 'task', item->>'id', stamp;
   end if;
  end if;
 end loop;
 -- No departure alert while another outing is already in progress.
 if exists(select 1 from jsonb_array_elements(private.muse_array(s->'outings')) o where o->>'state' in ('preparing','out','returning')) then return; end if;
 for item in select value from jsonb_array_elements(private.muse_array(s->'routines')) loop
  if item->>'enabled'='true' and private.muse_array(item->'days') @> jsonb_build_array(extract(dow from local_day)::int)
     and item->>'departureTime' ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
     and length(item->>'id') between 1 and 100 then
   occurrence_id := (item->>'id')||':'||local_day;
   select value into occurrence from jsonb_array_elements(private.muse_array(s->'routineOccurrences')) where value->>'key'=occurrence_id limit 1;
   if occurrence->>'status' in ('started','skipped') then continue; end if;
   stamp := ((local_day::text||' '||(item->>'departureTime'))::timestamp at time zone 'Asia/Baghdad');
   if occurrence->>'status'='snoozed' then stamp := private.muse_stamp(occurrence->>'snoozedUntil'); end if;
   if stamp between at_time-interval '30 minutes' and at_time then
    return query select 'departure:'||occurrence_id||':'||extract(epoch from stamp)::bigint, 'departure', item->>'id', stamp;
   end if;
  end if;
 end loop;
end $$;
revoke all on function private.muse_stamp(text),private.muse_array(jsonb),private.muse_due(jsonb,timestamptz) from public,anon,authenticated;

create function public.muse_push_ready() returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and coalesce((select enabled from private.muse_push_config where id),false)
$$;
revoke all on function public.muse_push_ready() from public,anon;
grant execute on function public.muse_push_ready() to authenticated;

-- Owner-scoped test with rate limit. Provider acceptance is NOT device receipt.
create function public.muse_test_push(p_endpoint text) returns uuid
language plpgsql security definer set search_path='' as $$
declare sub public.focus_push_subscriptions%rowtype; result uuid;
begin
 if auth.uid() is null or not public.muse_push_ready() then raise exception 'Muse push is not ready' using errcode='28000'; end if;
 select * into sub from public.focus_push_subscriptions where user_id=auth.uid() and endpoint=p_endpoint and muse_enabled for update;
 if sub.id is null then raise exception 'Enable Muse alerts on this device first' using errcode='22023'; end if;
 if (select count(*) from private.muse_push_outbox where subscription_id=sub.id and kind='test' and created_at>now()-interval '1 hour') >= 3 then
  raise exception 'Wait before sending another test' using errcode='22023';
 end if;
 insert into private.muse_push_outbox(subscription_id,reminder_key,kind,target_id,due_at,expires_at)
 values(sub.id,'test:'||gen_random_uuid(),'test','',now()+interval '30 seconds',now()+interval '10 minutes') returning id into result;
 return result;
end $$;
revoke all on function public.muse_test_push(text) from public,anon;
grant execute on function public.muse_test_push(text) to authenticated;

create function private.muse_queue_due_push(at_time timestamptz default now()) returns void language plpgsql security definer set search_path='' as $$
declare sub record; candidate record; token text; used int;
begin
 if not exists(select 1 from private.muse_push_config where enabled) then return; end if;
 -- Defaults protect attention. Never replay reminders from quiet hours in the morning.
 if extract(hour from at_time at time zone 'Asia/Baghdad') between 7 and 21 then
  for sub in select p.id,w.state from public.focus_push_subscriptions p join public.muse_workspaces w on w.user_id=p.user_id where p.muse_enabled loop
   select count(*) into used from private.muse_push_outbox where subscription_id=sub.id and kind<>'test' and (created_at at time zone 'Asia/Baghdad')::date=(at_time at time zone 'Asia/Baghdad')::date;
   for candidate in select * from private.muse_due(sub.state,at_time) order by due_at,reminder_key loop
    exit when used>=4;
    if extract(hour from candidate.due_at at time zone 'Asia/Baghdad') not between 7 and 21 then continue; end if;
    insert into private.muse_push_outbox(subscription_id,reminder_key,kind,target_id,due_at,expires_at,created_at)
    values(sub.id,candidate.reminder_key,candidate.kind,candidate.target_id,candidate.due_at,candidate.due_at+interval '30 minutes',at_time) on conflict do nothing;
    if found then used:=used+1; end if;
   end loop;
  end loop;
 end if;
 -- Expire bounded history; no endpoint or personal text is copied into the outbox.
 delete from private.muse_push_outbox where created_at<at_time-interval '14 days';
 update private.muse_push_outbox set status='cancelled',lease=null where status in ('pending','sending') and expires_at<=at_time;
 if exists(select 1 from private.muse_push_outbox where due_at<=at_time and expires_at>at_time and attempts<3 and (status='pending' or (status='sending' and last_attempt_at<at_time-interval '2 minutes'))) then
  select decrypted_secret into token from vault.decrypted_secrets where name='focus_push_dispatch_token';
  if token is not null then perform net.http_post(
   url:='https://rvzzieqynxybjccbutvs.supabase.co/functions/v1/focus-push-dispatch',
   body:='{}'::jsonb,headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||token),timeout_milliseconds:=10000);
  end if;
 end if;
end $$;
revoke all on function private.muse_queue_due_push(timestamptz) from public,anon,authenticated;

create function public.muse_claim_push_jobs(p_token text)
returns table(outbox_id uuid,lease_id uuid,endpoint text,p256dh text,auth_key text,signing_jwk text,public_key text,kind text,target_id text,tag text,expires_at timestamptz)
language plpgsql security definer set search_path='' as $$
declare expected text; job record; new_lease uuid;
begin
 select decrypted_secret into expected from vault.decrypted_secrets where name='focus_push_dispatch_token';
 if expected is null or p_token is distinct from expected then raise exception 'unauthorized' using errcode='28000'; end if;
 if not exists(select 1 from private.muse_push_config where enabled) then return; end if;
 for job in select o.*,p.endpoint,p.p256dh,p.auth_key,p.muse_enabled,w.state from private.muse_push_outbox o
 join public.focus_push_subscriptions p on p.id=o.subscription_id left join public.muse_workspaces w on w.user_id=p.user_id
 where o.due_at<=now() and o.expires_at>now() and o.attempts<3 and (o.status='pending' or (o.status='sending' and o.last_attempt_at<now()-interval '2 minutes'))
 order by o.due_at limit 10 for update of o skip locked loop
  if not job.muse_enabled or (job.kind<>'test' and (extract(hour from now() at time zone 'Asia/Baghdad') not between 7 and 21 or
    not exists(select 1 from private.muse_due(job.state,now()) d where d.reminder_key=job.reminder_key))) then
   update private.muse_push_outbox set status='cancelled',lease=null where id=job.id; continue;
  end if;
  new_lease:=gen_random_uuid();
  update private.muse_push_outbox set status='sending',attempts=attempts+1,last_attempt_at=now(),lease=new_lease where id=job.id;
  return query select job.id,new_lease,job.endpoint,job.p256dh,job.auth_key,
   (select decrypted_secret from vault.decrypted_secrets where name='focus_push_signing_jwk'),public.focus_vapid_public_key(),
   job.kind,job.target_id,'muse-'||job.id::text,job.expires_at;
 end loop;
end $$;
create function public.muse_ack_push_job(p_token text,p_outbox_id uuid,p_lease uuid,p_accepted boolean,p_permanent_failure boolean default false)
returns void language plpgsql security definer set search_path='' as $$
declare expected text; sub_id uuid;
begin
 select decrypted_secret into expected from vault.decrypted_secrets where name='focus_push_dispatch_token';
 if expected is null or p_token is distinct from expected then raise exception 'unauthorized' using errcode='28000'; end if;
 update private.muse_push_outbox set status=case when p_accepted then 'accepted' when p_permanent_failure or attempts>=3 then 'failed' else 'pending' end,lease=null
 where id=p_outbox_id and lease=p_lease and status='sending' returning subscription_id into sub_id;
 if p_permanent_failure and sub_id is not null then update public.focus_push_subscriptions set muse_enabled=false where id=sub_id; end if;
end $$;
revoke all on function public.muse_claim_push_jobs(text),public.muse_ack_push_job(text,uuid,uuid,boolean,boolean) from public,anon,authenticated;
grant execute on function public.muse_claim_push_jobs(text),public.muse_ack_push_job(text,uuid,uuid,boolean,boolean) to service_role;
select cron.schedule('muse-background-reminders-v1','* * * * *','select private.muse_queue_due_push()');
