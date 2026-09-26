alter table public.subjects
  drop constraint if exists subjects_user_client_id_unique;

alter table public.study_sessions
  drop constraint if exists study_sessions_user_client_id_unique;

alter table public.subjects
  add constraint subjects_user_client_id_unique
  unique (user_id, client_id);

alter table public.study_sessions
  add constraint study_sessions_user_client_id_unique
  unique (user_id, client_id);
