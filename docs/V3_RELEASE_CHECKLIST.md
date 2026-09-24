# FOCUS V3 release checklist

FOCUS V3 is developed on `feature/focus-league-v3`. Keep `main` unchanged until the preview has passed this checklist.

Checked items below were actually verified during V3 hardening. Re-run the automated gates after any later code or migration commit.

## Automated gates

- [x] GitHub **Quality / Lint and build** check passes.
- [x] Latest Vercel preview deployment is **READY**.
- [x] Vercel runtime error check shows no new application errors.
- [x] Supabase migrations through `harden_legacy_new_user_trigger` are applied.
- [x] Supabase `study-advisor` Edge Function is ACTIVE with JWT verification enabled.
- [x] Supabase Security Advisor findings have been reviewed.
- [x] All user-facing data tables have RLS enabled.
- [x] League helper/trigger SECURITY DEFINER functions are not client-executable; only the two intentional authenticated League RPCs remain callable.
- [x] SECURITY DEFINER search paths are pinned to `pg_catalog, public`, including the legacy auth profile trigger helper.

## Core product smoke test

- [ ] Sign in and sign out.
- [ ] Sign out of account A, sign in to account B in the same browser, and confirm no account-A study data appears.
- [ ] Sign back into the original account and confirm its cloud data hydrates correctly.
- [ ] Add, select and remove a subject.
- [ ] Remove a subject with completed sessions and confirm its historical sessions remain in History/Statistics after refresh.
- [ ] Start a session from Dashboard, Subjects and Study Plan.
- [ ] Complete a focus session and confirm it appears in History and Statistics.
- [ ] Add session notes and checklist items, complete the session, refresh, and confirm they persist.
- [ ] Delete a session and confirm it disappears from the app/cloud view.
- [ ] Change daily/weekly targets and confirm they survive refresh.
- [ ] Change theme, language, timer, sound and notification settings.
- [ ] Export a backup and import it into a safe test account/browser profile.
- [ ] Restore a backup containing history for an archived/removed subject and confirm that history remains readable.

## Cloud sync and data safety

- [x] Rollback-only database test confirmed a deleted session tombstone cannot be resurrected by a stale upsert.
- [x] Rollback-only database test confirmed a deleted advanced goal tombstone cannot be resurrected by a stale upsert.
- [x] Rollback-only database test confirmed soft-deleting a 60-minute session recomputes its League day from 3 points to 0.
- [x] Rollback-only database test confirmed archiving a linked subject automatically unscopes its active advanced goal.
- [x] Rollback-only database test confirmed a stale client cannot re-scope an advanced goal to an archived subject.
- [x] Rollback-only archived-name test confirmed one archived + one active normalized subject name can coexist and a second active duplicate is rejected.
- [ ] Test offline → online recovery in a real browser.
- [ ] Make rapid edits while sync is saving and confirm the final cloud state matches the final local state.
- [ ] Complete/create an entity and immediately delete/archive it while sync is active; confirm the destructive action wins and no ghost row returns after refresh.
- [x] Cloud destructive actions are serialized behind pending snapshot saves so same-device delete/archive cannot race an unfinished create/update write.
- [x] Realtime refresh stops polling after a failed queued cloud save instead of spinning indefinitely.
- [x] Archived-only cloud subject history is treated as meaningful cloud state, so an intentionally empty subject workspace is not repopulated from local defaults.
- [x] Pending local mutations are persisted per account until the cloud confirms the matching snapshot.
- [x] Offline session/goal deletions and subject archives are tracked explicitly and replay their server tombstone/archive operations on reconnect.
- [x] Local recovery considers advanced goals, targets and settings as meaningful data, not only subjects/sessions/history.
- [x] Reconnect recovery merges only locally changed subjects, sessions, goals, targets and settings into freshly loaded cloud state instead of pushing an entire stale snapshot.
- [x] Account-scoped local recovery snapshots preserve unsynced data across same-browser account switching without exposing one account's workspace to another.
- [x] Online sign-out flushes pending cloud changes first and now refuses to sign out if that flush fails; offline pending mutation metadata remains account-scoped for recovery on the next same-account connection.
- [x] Signed-in backup restore uses an explicit cloud-replacement path; ordinary background sync remains non-destructive.
- [x] Session deletion, advanced-goal deletion and backup import require an explicit second confirmation action.
- [ ] With two signed-in browsers/devices, delete a session on one and confirm the stale second device cannot resurrect it.
- [ ] With two signed-in browsers/devices, delete an advanced goal on one and confirm the stale second device cannot resurrect it.
- [ ] With two signed-in browsers/devices, archive a subject on one and confirm the other device sees the subject removed and the linked goal unscoped.
- [ ] Verify theme/language sync between two signed-in browsers/devices.
- [ ] Simulate an initial cloud-read failure and confirm local data is not pushed until hydration succeeds.

## Advanced goals

- [ ] Create an all-subject deadline goal.
- [ ] Create a goal scoped to one subject.
- [ ] Complete time in a different subject and confirm it does **not** advance the scoped goal.
- [ ] Complete time in the linked subject and confirm it advances the goal.
- [ ] Confirm overdue, complete, reopen and delete behaviors.
- [ ] Delete a linked subject and confirm the goal is preserved as unscoped rather than deleted.

## Advisor

- [ ] Ask each quick prompt and confirm the deterministic fallback returns a usable action.
- [ ] Confirm Advisor facts match Dashboard/Statistics data.
- [ ] Confirm a subject-scoped urgent goal can drive the recommended subject.
- [x] Confirm raw session notes are not included in the advisor payload.
- [ ] If Gemini is enabled, configure `GEMINI_API_KEY` only as a Supabase server secret and verify an AI-sourced response.

## League

- [ ] Test with at least two opted-in accounts.
- [x] Confirm 60 completed focus minutes in one local day produces 3 points (rollback-only timezone-boundary database test).
- [x] Confirm private session data is not exposed through leaderboard responses; RPC output is limited to public name/avatar seed, points, completed days, rank and current-user marker.
- [ ] Check weekly and monthly standings.
- [ ] Check previous-period champion display.
- [ ] Check current rank and next-rank progress.
- [ ] Confirm an opted-out account does not appear publicly.

## Mobile and accessibility

- [ ] Test the mobile bottom dock on a narrow phone viewport.
- [ ] Open the full mobile sidebar and reach every secondary page.
- [ ] Confirm primary touch targets are comfortable to tap.
- [ ] Navigate major flows with keyboard only.
- [ ] Confirm the skip link reaches main content.
- [ ] Test with reduced-motion enabled.
- [ ] Check dark, light and system themes.

## Security before production

- [x] Keep RLS enabled on every user-data table.
- [x] Confirm anonymous users cannot execute League RPCs.
- [x] Confirm only the two intentional League RPCs are authenticated-callable SECURITY DEFINER functions.
- [x] Keep SECURITY DEFINER search paths pinned to `pg_catalog, public`.
- [ ] Enable Supabase Auth leaked-password protection in the dashboard.
- [x] Confirm no service-role key or Gemini key is present in Vite/client variables in the V3 diff.

## Release

- [ ] Review the final draft PR diff.
- [ ] Perform one clean authenticated end-to-end preview test.
- [ ] Mark the PR ready only after all blocking checks pass.
- [ ] Merge into `main`.
- [ ] Verify the production Vercel deployment.
- [ ] Re-run Supabase Security Advisor and Vercel runtime checks after release.
