# FOCUS + MUSE foundation

Muse is part of the existing FOCUS React/Vite app. It shares login, language, themes and study data. Original Focus, Progress, League and Settings remain. The timer stays mounted. The existing study advisor is available from Muse.

Implemented: responsibilities, in-app reminders, priorities, editable memory, outing templates, linked departure/return snapshots, missing-item tracking, export, account-scoped local persistence, optional Supabase sync with revision checks.

Not yet enabled: recurring background alerts, general assistant AI, briefings, discoveries, opportunities, weekly reviews. Existing timer pushes are unchanged. Notification diagnostics do not establish background reliability.

Production build and all 83 tests pass. Browser verified integrated Muse Today and original Focus screen in local mode. Live cloud sync and mobile notification tests remain outstanding.

The additive migration was applied with user approval to the existing FOCUS Supabase project on 2026-11-09 (Asia/Baghdad), recorded as 20261108224112_muse_foundation. Live database was inspected read-only. Integrated into https://github.com/rahdpasha/focus at upstream commit 4813261f28ba87e9a594fe7c2500531c30c4d303 on branch feat/muse-foundation. Newer League inactivity changes and the November 5 migration are preserved. All changed integration files matched the October baseline before applying the changes; no newer source was overwritten. Deploy to the existing Vercel project only after staging validation.

New module: src/muse/. Integration: App.tsx, app/navigation.ts, components/layout/AppShell.tsx, calm.css. zod added. Service worker cache bumped; push handlers preserved. No existing database migration modified.

Run npm ci, npm test, npm run build. Preview-only environment files and dependencies are excluded. The Muse table and save RPC are installed. Signed-in end-to-end sync still needs a user-session smoke test against the PR preview.


Live verification: owner-only SELECT policy and RLS enabled; anon cannot read or execute the RPC; authenticated users cannot write the table directly; calls without a user identity are rejected. No test workspace data was retained. Isolated PostgreSQL contract tests passed before applying.

The security advisor flags authenticated execution of the SECURITY DEFINER save RPC. This is intentional for atomic revision-checked writes: the function derives the owner from auth.uid(), rejects missing identity, uses an empty search path, and has no caller-supplied user ID. Anonymous and PUBLIC execution are revoked. See https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable. Existing unrelated advisories were not changed.
