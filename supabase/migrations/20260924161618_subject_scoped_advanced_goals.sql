alter table public.advanced_goals
  add column if not exists subject_client_id text;

create index if not exists advanced_goals_user_subject_client_idx
  on public.advanced_goals(user_id, subject_client_id)
  where subject_client_id is not null;

comment on column public.advanced_goals.subject_client_id is
  'Optional client-side subject identifier. When set, goal progress counts only sessions for that subject.';
