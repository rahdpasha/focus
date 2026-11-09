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


## Recurring outings (next release)

Manage opt-in routines in **Muse → My life**. Select a reusable checklist,
weekdays (Sunday = 0), departure time and return-check time. Schedules use
Asia/Baghdad regardless of the device timezone. Today shows only the current
calendar day's scheduled departures, with Start, Skip today and 15-minute snooze.
There is no missed-day notification backlog. Pausing a routine does not cancel
an existing outing or its return check.

Starting creates an immutable item snapshot and records a routine/date occurrence
linked to the outing ID in one revision-checked workspace save. Reopening cannot
start the same occurrence again. A return time at or before departure is on the
following day. Return reminders remain linked to the actual outing even after
midnight or later routine edits. No departure answer implies possession on return.
The existing one-active-outing rule still applies. Routines and occurrence responses
use the same account/offline/conflict/export path as other Muse data.

**Release prerequisite:** apply `20261109092423_muse_routine_compatibility.sql`
before enabling routine writes on a shared account. Its invoker trigger rejects
older clients that omit already-stored routine fields; no table access is expanded.
Old tabs must refresh before saving Muse again. Test using disposable local data
until this safeguard is installed. The migration was applied with user approval on November 9, 2026.
Live verification confirms the trigger is enabled, runs as invoker, and grants
no direct execution to anonymous or authenticated API roles.

**Delivery boundary:** these are in-app reminders, not remote push jobs. No new
browser permission, notification subscription, cron, paid service or background
job is created. Browser timers may be suspended; opening Muse recalculates due
state from wall time. The existing FOCUS push dispatcher is a candidate for a later
Muse integration, but needs server-authoritative recurring occurrence generation,
deduplication, cancellation/snooze reconciliation and real-device verification.
Do not describe these schedules as closed-app notifications.

Platform references checked November 9, 2026:
- https://developer.mozilla.org/en-US/docs/Web/API/Push_API
- https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Offline_and_background_operation
- https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/
