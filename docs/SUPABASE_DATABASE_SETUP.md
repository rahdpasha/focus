# Supabase database setup

This migration creates the initial FOCUS V2 PostgreSQL schema and Row Level Security policies.

## Tables

- `profiles`
- `subjects`
- `study_sessions`
- `goals`
- `weekly_goal_history`
- `user_settings`

Every user-owned table has a `user_id` relationship to `auth.users`, except `profiles` and `user_settings`, which use the auth user id as their primary key.

## Apply

Run the migration in the Supabase SQL Editor or through the Supabase CLI migration workflow.

Before the web client reads or writes these tables, keep RLS enabled and use the browser-safe publishable key with Supabase Auth. Never put a secret/service-role key in the frontend.
