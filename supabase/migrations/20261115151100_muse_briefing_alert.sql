-- Reuse the existing outbox, device opt-in, quiet hours and daily alert cap.
alter table private.muse_push_outbox
 drop constraint muse_push_outbox_kind_check,
 add constraint muse_push_outbox_kind_check
  check (kind in ('departure','return','task','test','briefing'));

create or replace function private.muse_due(s jsonb, at_time timestamptz)
returns table(reminder_key text,kind text,target_id text,due_at timestamptz)
language plpgsql stable set search_path='' as $$
declare item jsonb; occurrence jsonb; stamp timestamptz;
declare local_day date := (at_time at time zone 'Asia/Baghdad')::date;
declare occurrence_id text;
begin
 -- A short delivery window prevents late or next-day briefing alerts.
 if s->'profile'->'briefingAlerts' = 'true'::jsonb then
  stamp := (local_day + time '07:30') at time zone 'Asia/Baghdad';
  if at_time >= stamp and at_time < stamp + interval '10 minutes'
    and exists (
      select 1 from jsonb_array_elements(private.muse_array(s->'tasks')) as task(value)
      where value->'done' = 'false'::jsonb and value->>'kind' in ('task','deadline','event')
       and ((value->>'due' ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' and value->>'due' <= (local_day + 1)::text)
        or (value->'due' = 'null'::jsonb and value->'important' = 'true'::jsonb))
    ) then
   return query select 'briefing:' || local_day, 'briefing', '', stamp;
  end if;
 end if;

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
