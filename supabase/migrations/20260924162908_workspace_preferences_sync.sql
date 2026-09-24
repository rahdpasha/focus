alter table public.user_settings
  add column if not exists workspace_preferences_version integer
  not null default 0
  check (workspace_preferences_version >= 0);

comment on column public.user_settings.workspace_preferences_version is
  'Version marker for cloud-synced workspace preferences such as theme and language. Version 0 rows predate preference sync.';
