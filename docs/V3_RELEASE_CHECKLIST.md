# FOCUS V3 release checklist

FOCUS V3 is developed on `feature/focus-league-v3`. Keep `main` unchanged until the preview has passed this checklist.

## Automated gates

- [ ] GitHub **Quality / Lint and build** check passes.
- [ ] Latest Vercel preview deployment is **READY**.
- [ ] Vercel runtime error check shows no new application errors.
- [ ] Supabase migrations through `subject_scoped_advanced_goals` are applied.
- [ ] Supabase `study-advisor` Edge Function is ACTIVE with JWT verification enabled.
- [ ] Supabase Security Advisor findings have been reviewed.

## Core product smoke test

- [ ] Sign in and sign out.
- [ ] Add, select and delete a subject.
- [ ] Start a session from Dashboard, Subjects and Study Plan.
- [ ] Complete a focus session and confirm it appears in History and Statistics.
- [ ] Add session notes and checklist items, complete the session, refresh, and confirm they persist.
- [ ] Delete a session and confirm the cloud copy is removed.
- [ ] Change daily/weekly targets and confirm they survive refresh.
- [ ] Change theme, language, timer, sound and notification settings.
- [ ] Export a backup and import it into a safe test account/browser profile.

## Advanced goals

- [ ] Create an all-subject deadline goal.
- [ ] Create a goal scoped to one subject.
- [ ] Complete time in a different subject and confirm it does **not** advance the scoped goal.
- [ ] Complete time in the linked subject and confirm it advances the goal.
- [ ] Confirm overdue, complete, reopen and delete behaviors.
- [ ] Delete a linked subject and confirm the goal is preserved as unscoped rather than deleted.

## Advisor

- [ ] Ask each quick prompt and confirm the fallback returns a usable action.
- [ ] Confirm Advisor facts match Dashboard/Statistics data.
- [ ] Confirm a subject-scoped urgent goal can drive the recommended subject.
- [ ] Confirm raw session notes are not included in the advisor payload.
- [ ] If Gemini is enabled, configure `GEMINI_API_KEY` only as a Supabase server secret and verify an AI-sourced response.

## League

- [ ] Test with at least two opted-in accounts.
- [ ] Confirm 60 completed focus minutes in one local day produces 3 points.
- [ ] Confirm private session data is not exposed through leaderboard responses.
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

- [ ] Keep RLS enabled on every user-data table.
- [ ] Confirm anonymous users cannot execute League RPCs.
- [ ] Confirm only the two intentional League RPCs are authenticated-callable SECURITY DEFINER functions.
- [ ] Keep SECURITY DEFINER search paths pinned to `pg_catalog, public`.
- [ ] Enable Supabase Auth leaked-password protection in the dashboard.
- [ ] Never expose a service-role key or Gemini API key in Vite/client environment variables.

## Release

- [ ] Review the draft PR diff.
- [ ] Perform one clean end-to-end preview test.
- [ ] Mark the PR ready only after all blocking checks pass.
- [ ] Merge into `main`.
- [ ] Verify the production Vercel deployment.
- [ ] Re-run Supabase Security Advisor and Vercel runtime checks after release.
