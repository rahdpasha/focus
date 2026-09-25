# FOCUS V3 release checklist

FOCUS V3 is developed on `feature/focus-league-v3`. Keep `main` unchanged until the preview has passed this checklist.

Checked items below were actually verified during V3 hardening. Re-run the automated gates after any later code or migration commit.

## Blocking merge gates

PR #1 stays **draft** until the real-browser sign-off is complete:

- [x] **Auth security review:** Supabase Security Advisor was re-run. Leaked-password protection is unavailable on the current Supabase plan and is recorded as an accepted limitation; the remaining two authenticated League SECURITY DEFINER warnings are intentional.
- [ ] **Real-browser sign-off:** Complete the 10-minute merge smoke test below.

The release branch currently passes GitHub Quality and has a READY Vercel preview. Re-verify both gates after any later code, CSS, migration, or runtime-affecting commit. The final release gate still requires a real authenticated browser session.

## Automated preview verification

- [x] Runtime-equivalent Vercel preview returns **HTTP 200** and serves the built application shell.
- [x] Preview warning/error/fatal runtime-log query is empty for the latest verification window.
- [ ] Authenticated browser smoke test remains required; automated preview reachability does not replace the two-account manual flow.

## 10-minute merge smoke test

Use the latest preview with two test accounts (A and B). This is the minimum real-browser sign-off before marking PR #1 ready.

- [ ] **1. Auth + isolation:** Sign in as A, sign out, sign in as B in the same browser, and confirm A's study data never appears. Return to A and confirm cloud data hydrates correctly.
- [ ] **2. Core session path:** From Dashboard start a routine/focus session, add a note + checklist item, complete it, refresh, and confirm History/Statistics + routine progress persist.
- [ ] **3. Subject safety:** Remove a subject that has history; refresh and confirm historical sessions remain readable. Confirm a linked advanced goal becomes unscoped rather than deleted.
- [ ] **4. Goal isolation:** Create a subject-scoped goal; study a different subject and confirm no progress, then study the linked subject and confirm progress.
- [ ] **5. Offline recovery:** Go offline, make one safe edit plus one delete/archive, return online, refresh, and confirm final cloud state matches the intended local state with no ghost row.
- [ ] **6. Two-account League:** Opt in A and B, confirm both appear in weekly/monthly standings, private session details are not exposed, and opt-out removes the account publicly.
- [ ] **7. Settings sync:** Change theme/language on one signed-in browser/device and confirm the second receives it. Import/export one valid custom theme pack and reject one invalid pack.
- [ ] **8. Mobile + accessibility:** On a narrow viewport, test bottom dock + full sidebar, then keyboard through a major flow and confirm the skip link works.
- [ ] **9. Final visual sweep:** Check System/Dark/Light/Black/White themes for unreadable text, overflow, broken cards, or clipped controls on Dashboard, Focus, Routine, League, and Settings.
- [ ] **10. Final refresh:** Hard refresh the preview, confirm no blank screen/error overlay, then re-check Vercel runtime errors.

## Automated gates

- [x] GitHub **Quality** passes: install, lint, V3 regression tests, client-secret guard, migration-version guard and build.
- [x] **Vercel preview:** the release branch has a READY preview. Re-check after any later runtime-affecting commit.
- [ ] **Final runtime check:** after the manual authenticated smoke test, re-check the final preview for error/fatal runtime logs before merge.
- [x] Supabase migrations through `league_legacy_day_count_compat` are applied.
- [x] Repository migration versions match live Supabase migration history exactly; baseline migrations are recorded remotely and the fresh-schema chain includes client IDs and realtime publication setup.
- [x] Supabase `study-advisor` Edge Function is ACTIVE with JWT verification enabled.
- [x] Supabase Security Advisor findings have been reviewed.
- [x] All 9 user-facing data tables, including `routine_items`, have RLS enabled.
- [x] Authenticated cross-user RLS probe confirmed all 9 user-facing tables hide rows owned by other accounts.
- [x] League helper/trigger SECURITY DEFINER functions are not client-executable; only the two intentional authenticated League RPCs remain callable.
- [x] SECURITY DEFINER search paths are pinned to `pg_catalog, public`, including the legacy auth profile trigger helper.

## 10-minute final smoke test

Use two real test accounts and one desktop browser plus one narrow/mobile viewport. This is the minimum manual sign-off path before merging.

1. **Auth isolation:** sign into account A, confirm its workspace loads, sign out, sign into account B in the same browser, and confirm no account-A study data appears.
2. **Core focus flow:** in account B, create/select a subject, start a 1-minute test session from Dashboard or Subjects, add a note + checklist item, complete it, refresh, and confirm it remains in History/Statistics.
3. **Archive safety:** remove that subject and confirm the completed session still exists after refresh.
4. **Scoped goal:** create a subject-scoped advanced goal; record time in another subject and confirm no progress, then record time in the linked subject and confirm progress.
5. **Routine:** create one fixed routine item and one rotation item; verify today's expected item appears and launching it starts the correct subject/target timer.
6. **Cloud/settings:** change theme + language in browser/device A, open the same account in browser/device B, and confirm the settings sync.
7. **Offline recovery:** go offline, make one safe change (for example a setting or new routine item), reconnect, wait for sync, refresh, and confirm the final cloud state matches.
8. **League:** opt in both test accounts, complete enough qualifying time (or use existing real test data) and confirm both appear correctly in weekly/monthly standings; opt one account out and confirm it disappears publicly.
9. **Mobile/accessibility:** on a narrow viewport, use the bottom dock, open the full sidebar, reach a secondary page, tab through the main flow, and confirm controls remain usable.
10. **Final refresh:** hard-refresh the latest Vercel preview and confirm there is no blank screen, error overlay, missing data, or obvious console/runtime failure.

If any step fails, keep PR #1 draft and record the exact step + account/browser used before changing code.

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
- [ ] Import a valid custom theme pack, confirm it applies/syncs, export it again, and confirm invalid/oversized packs are rejected.
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
- [x] Confirm League scoring rules: 0 points after a full no-study day, 1 point for 1 second through 90 minutes, and 3 points for more than 90 minutes; score refreshes after completed-session cloud sync.
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
- [ ] Check System, Dark, Light, Black and White themes.

## Security before production

- [x] Keep RLS enabled on every user-data table.
- [x] Confirm anonymous users cannot execute League RPCs.
- [x] Confirm only the two intentional League RPCs are authenticated-callable SECURITY DEFINER functions.
- [x] Keep SECURITY DEFINER search paths pinned to `pg_catalog, public`.
- [x] Supabase Auth leaked-password protection was reviewed and is unavailable on the current plan; keep this recorded as an accepted release limitation unless the plan changes.
- [x] Confirm no service-role key or Gemini key is present in Vite/client variables in the V3 diff.

## Release

- [x] Review the final draft PR diff.
- [ ] Perform one clean authenticated end-to-end preview test.
- [ ] Mark the PR ready only after all blocking checks pass.
- [ ] Merge into `main`.
- [ ] Verify the production Vercel deployment.
- [ ] Re-run Supabase Security Advisor and Vercel runtime checks after release.
