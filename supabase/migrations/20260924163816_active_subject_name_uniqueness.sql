alter table public.subjects
  drop constraint if exists subjects_user_name_unique;

drop index if exists public.subjects_user_name_unique;

create unique index if not exists subjects_user_active_name_unique
  on public.subjects (
    user_id,
    lower(btrim(name))
  )
  where archived_at is null;

comment on index public.subjects_user_active_name_unique is
  'Prevents case-insensitive duplicate active subject names per user while allowing archived subjects to preserve historical session links.';
