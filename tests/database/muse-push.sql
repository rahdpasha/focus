-- Loaded after muse.sql in the disposable CI database. Never use on production.
create role service_role nologin;
create schema private;
create schema vault;
create table vault.decrypted_secrets(name text,decrypted_secret text);
insert into vault.decrypted_secrets values('focus_push_dispatch_token','disposable-token-for-contract-tests-only'),('focus_push_signing_jwk','{}');
create schema net;
create function net.http_post(url text,body jsonb,headers jsonb,timeout_milliseconds int) returns bigint language sql as $$select 1::bigint$$;
create schema cron;
create function cron.schedule(text,text,text) returns bigint language sql as $$select 1::bigint$$;
create table public.focus_push_subscriptions(id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id),endpoint text unique);
alter table public.focus_push_subscriptions enable row level security;
create policy own_subs on public.focus_push_subscriptions for all to authenticated using(auth.uid()=user_id) with check(auth.uid()=user_id);
grant select,insert,update,delete on public.focus_push_subscriptions to authenticated;
create function public.focus_vapid_public_key() returns text language sql as $$select 'public-test-key'::text$$;
\ir ../../supabase/migrations/20261109093242_muse_background_push.sql

do $$
declare state jsonb := '{"routines":[{"id":"uni","enabled":true,"days":[0,1,2,3,4],"departureTime":"08:00"}],"outings":[],"tasks":[],"routineOccurrences":[]}';
 rows int; due timestamptz;
begin
 select count(*),min(due_at) into rows,due from private.muse_due(state,'2026-11-09T05:01:00Z');
 if rows<>1 or due<>'2026-11-09T05:00:00Z'::timestamptz then raise exception 'Timezone scheduling wrong'; end if;
 if exists(select 1 from private.muse_due(state,'2026-11-09T05:31:00Z')) then raise exception 'Expired departure replays'; end if;
 if exists(select 1 from private.muse_due(state,'2026-11-13T05:01:00Z')) then raise exception 'Wrong weekday sends'; end if;
 state:=jsonb_set(state,'{routineOccurrences}','[{"key":"uni:2026-11-09","status":"skipped"}]');
 if exists(select 1 from private.muse_due(state,'2026-11-09T05:01:00Z')) then raise exception 'Skipped departure sends'; end if;
 state:=jsonb_set(state,'{routineOccurrences}','[{"key":"uni:2026-11-09","status":"snoozed","snoozedUntil":"2026-11-09T05:20:00Z"}]');
 if exists(select 1 from private.muse_due(state,'2026-11-09T05:01:00Z')) then raise exception 'Snooze ignored'; end if;
 if not exists(select 1 from private.muse_due(state,'2026-11-09T05:21:00Z')) then raise exception 'Snooze never due'; end if;
 state:='{"outings":[{"id":"out1","state":"out","returnReminderAt":"2026-11-09T22:00:00Z"}],"tasks":[],"routines":[]}';
 if not exists(select 1 from private.muse_due(state,'2026-11-09T22:01:00Z') where kind='return') then raise exception 'Overnight return lost'; end if;
 state:=jsonb_set(state,'{outings,0,state}','"finished"');
 if exists(select 1 from private.muse_due(state,'2026-11-09T22:01:00Z')) then raise exception 'Finished outing sends'; end if;
 perform * from private.muse_due('{"routines":null,"tasks":{},"outings":[{"state":"out","returnReminderAt":"bad"}]}',now());
end $$;

insert into public.focus_push_subscriptions(id,user_id,endpoint,muse_enabled,p256dh,auth_key) values
('40000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','https://web.push.apple.com/test-one',true,repeat('a',87),repeat('b',22)),
('40000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000002','https://web.push.apple.com/test-two',false,null,null);
update private.muse_push_config set enabled=true;
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);
do $$
begin
 if not public.muse_push_ready() then raise exception 'Ready flag missing'; end if;
 begin perform public.muse_test_push('https://web.push.apple.com/test-two'); raise exception 'Other owner test allowed'; exception when invalid_parameter_value then null; end;
 perform public.muse_test_push('https://web.push.apple.com/test-one');
 perform public.muse_test_push('https://web.push.apple.com/test-one');
 perform public.muse_test_push('https://web.push.apple.com/test-one');
 begin perform public.muse_test_push('https://web.push.apple.com/test-one'); raise exception 'Rate limit failed'; exception when invalid_parameter_value then null; end;
 begin perform * from public.muse_claim_push_jobs('disposable-token-for-contract-tests-only'); raise exception 'Client could claim private keys'; exception when insufficient_privilege then null; end;
end $$;
set role anon;
do $$begin
 begin perform public.muse_test_push('https://web.push.apple.com/test-one'); raise exception 'Anonymous test allowed'; exception when insufficient_privilege then null; end;
end $$;
reset role;
update private.muse_push_outbox set due_at=now()-interval '1 second';
-- Worker token and leases: no stale acknowledgements, no duplicate accepted claims.
do $$
declare job record; previous uuid; rows int;
begin
 begin perform * from public.muse_claim_push_jobs('wrong'); raise exception 'Bad token accepted'; exception when invalid_authorization_specification then null; end;
 for job in select * from public.muse_claim_push_jobs('disposable-token-for-contract-tests-only') loop
  perform public.muse_ack_push_job('disposable-token-for-contract-tests-only',job.outbox_id,gen_random_uuid(),true,false);
  if (select status from private.muse_push_outbox where id=job.outbox_id)<>'sending' then raise exception 'Stale lease accepted'; end if;
  perform public.muse_ack_push_job('disposable-token-for-contract-tests-only',job.outbox_id,job.lease_id,true,false);
 end loop;
 select count(*) into rows from public.muse_claim_push_jobs('disposable-token-for-contract-tests-only');
 if rows<>0 then raise exception 'Duplicate accepted delivery'; end if;
 insert into private.muse_push_outbox(subscription_id,reminder_key,kind,target_id,due_at,expires_at) values
 ('40000000-0000-0000-0000-000000000001','test-disable','test','',now()-interval '1 second',now()+interval '1 hour') returning id into previous;
 update public.focus_push_subscriptions set muse_enabled=false;
 perform * from public.muse_claim_push_jobs('disposable-token-for-contract-tests-only');
 if (select status from private.muse_push_outbox where id=previous)<>'cancelled' then raise exception 'Opt-out ignored'; end if;
end $$;
\echo 'PASS Muse push: scheduling, expiry, snooze, owner isolation, rate limits, worker auth, leases, deduplication, opt-out'
