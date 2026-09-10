create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text not null,
  icon text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint subjects_user_name_unique unique (user_id, name)
);

create table if not exists public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete restrict,
  planned_seconds integer not null default 0 check (planned_seconds >= 0),
  actual_seconds integer not null default 0 check (actual_seconds >= 0),
  started_at timestamptz not null,
  completed_at timestamptz not null,
  completed boolean not null default false,
  interruptions integer not null default 0 check (interruptions >= 0),
  total_paused_seconds integer not null default 0 check (total_paused_seconds >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  daily_minutes integer not null default 60 check (daily_minutes >= 0),
  weekly_minutes integer not null default 300 check (weekly_minutes >= 0),
  effective_from date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.weekly_goal_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  goal_minutes integer not null default 0 check (goal_minutes >= 0),
  achieved_minutes integer not null default 0 check (achieved_minutes >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint weekly_goal_history_user_week_unique unique (user_id, week_start)
);

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  theme text not null default 'system' check (theme in ('dark', 'light', 'system')),
  language text not null default 'en' check (language in ('en', 'ku')),
  focus_minutes integer not null default 25 check (focus_minutes between 1 and 180),
  short_break_minutes integer not null default 5 check (short_break_minutes between 1 and 60),
  long_break_minutes integer not null default 15 check (long_break_minutes between 1 and 120),
  sessions_before_long_break integer not null default 4 check (sessions_before_long_break between 1 and 10),
  sound_enabled boolean not null default true,
  volume integer not null default 70 check (volume between 0 and 100),
  notifications_enabled boolean not null default true,
  auto_start_break boolean not null default false,
  updated_at timestamptz not null default now()
);

create index if not exists subjects_user_id_idx on public.subjects(user_id);
create index if not exists study_sessions_user_id_idx on public.study_sessions(user_id);
create index if not exists study_sessions_subject_id_idx on public.study_sessions(subject_id);
create index if not exists study_sessions_started_at_idx on public.study_sessions(started_at);
create index if not exists goals_user_id_idx on public.goals(user_id);
create index if not exists weekly_goal_history_user_id_idx on public.weekly_goal_history(user_id);

alter table public.profiles enable row level security;
alter table public.subjects enable row level security;
alter table public.study_sessions enable row level security;
alter table public.goals enable row level security;
alter table public.weekly_goal_history enable row level security;
alter table public.user_settings enable row level security;

create policy "Users can view own profile"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

create policy "Users can insert own profile"
  on public.profiles for insert to authenticated
  with check ((select auth.uid()) = id);

create policy "Users can update own profile"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "Users can view own subjects"
  on public.subjects for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create own subjects"
  on public.subjects for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update own subjects"
  on public.subjects for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete own subjects"
  on public.subjects for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can view own study sessions"
  on public.study_sessions for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create own study sessions"
  on public.study_sessions for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update own study sessions"
  on public.study_sessions for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete own study sessions"
  on public.study_sessions for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can view own goals"
  on public.goals for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create own goals"
  on public.goals for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update own goals"
  on public.goals for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete own goals"
  on public.goals for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can view own weekly goal history"
  on public.weekly_goal_history for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create own weekly goal history"
  on public.weekly_goal_history for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update own weekly goal history"
  on public.weekly_goal_history for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete own weekly goal history"
  on public.weekly_goal_history for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can view own settings"
  on public.user_settings for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create own settings"
  on public.user_settings for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update own settings"
  on public.user_settings for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete own settings"
  on public.user_settings for delete to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.subjects to authenticated;
grant select, insert, update, delete on public.study_sessions to authenticated;
grant select, insert, update, delete on public.goals to authenticated;
grant select, insert, update, delete on public.weekly_goal_history to authenticated;
grant select, insert, update, delete on public.user_settings to authenticated;
