# FOCUS V4 final smoke-test runbook

Use this only on the latest READY preview for `feature/focus-v4`.

PR #3 stays **draft and unmerged** until this runbook passes and explicit merge approval is given.

## Setup

Prepare:
- test account A
- test account B
- one desktop browser
- one narrow/mobile viewport
- latest exact-head Vercel preview

For any failure, record:
- step
- account
- browser/viewport
- expected result
- actual result
- screenshot or console/runtime evidence if useful

Do not merge around a failed step.

## Pass 1 — Auth and isolation

1. Open the latest V4 preview.
2. Confirm the sign-in screen renders normally.
3. Switch to Create account and confirm:
   - display name appears
   - password requires 10+ characters
   - show/hide password works
4. Sign in with account A.
5. Confirm A's workspace loads.
6. Sign out.
7. Sign in with account B in the same browser.
8. Confirm no subjects, sessions, goals, routine items, settings or League state belonging to A appears.
9. Sign out and return to A.
10. Confirm A's cloud state hydrates again.

Pass when:
- auth works
- no cross-account data appears
- returning account data restores correctly

## Pass 2 — First-use V4 flow

Use a fresh/empty test account.

1. Open Today.
2. Confirm only one clear Add Subject setup action is presented.
3. Open Focus.
4. Confirm the timer is not usable before a subject exists.
5. Confirm Add your first subject is shown.
6. Add the first subject from Today.
7. Repeat with a fresh empty account/path from Focus.
8. Confirm subject creation opens correctly and returns to a usable flow.
9. Open Plan and confirm subject setup is reachable.
10. Open Progress and confirm it directs the user toward a first Focus session.

Pass when:
- no dead-end empty state exists
- subject setup is obvious
- Focus never presents a broken/unusable timer

## Pass 3 — Focus session

1. Select a subject.
2. Confirm the approved timer geometry is unchanged.
3. Confirm default Focus surface is mainly subject → timer → start.
4. Confirm Smart cue is collapsed.
5. Confirm Ambient audio is collapsed.
6. Confirm Session notes & steps is collapsed.
7. Start the timer.
8. Pause.
9. Resume.
10. Add one note and one checklist step.
11. Complete the session.
12. Refresh the app.

Pass when:
- timer behavior is correct
- optional controls remain secondary
- completed session survives refresh
- note/checklist persist

## Pass 4 — Cloud persistence

1. Confirm the completed session appears in Progress → History.
2. Confirm Progress → Overview reflects the same study time.
3. Confirm cloud sync reaches a healthy/synced state.
4. Go offline.
5. Make one safe edit such as a routine or settings change.
6. Reconnect.
7. Wait for sync.
8. Refresh.
9. Confirm the intended state remains.
10. Archive/delete one safe test entity and confirm it does not return after refresh.

Pass when:
- no ghost data returns
- final local/cloud state agrees

## Pass 5 — Plan workspace

Open Plan and verify:

1. Plan & Goals
2. Subjects
3. Routine
4. Advisor

Then:
5. Create one simple goal using only name, target and deadline.
6. Open advanced goal options and set subject scope + priority.
7. Create one simple routine using name/subject/minutes.
8. Open advanced routine options and verify:
   - fixed / rotation
   - recovery
   - schedule preset
   - exact weekdays
9. Confirm Add Subject is available beside goal subject.
10. Confirm Add Subject is available beside routine subject.

Pass when:
- advanced options stay hidden until requested
- all four Plan areas work from the single workspace

## Pass 6 — Progress workspace

1. Open Overview.
2. Open Records.
3. Open History.
4. Verify English labels and time units.
5. Switch to Sorani.
6. Repeat Overview / Records / History.
7. Confirm RTL layout remains readable.

Pass when:
- all three tabs work
- no English-only leakage appears in the checked surfaces
- Sorani labels fit without clipping

## Pass 7 — League

Before joining:
1. Confirm only public name, join/save controls and privacy explanation are shown.

Join League:
2. Confirm rank appears.
3. Confirm score appears.
4. Confirm focused time appears.
5. Confirm scored days appear.
6. Confirm next step/status/milestones appear.

Then:
7. Leave League.
8. Confirm the public profile disappears.
9. Rejoin.
10. Confirm saved League history/progress returns.

Privacy:
11. Confirm subjects, notes, email and session details are not exposed publicly.

Pass when:
- progressive League disclosure works
- leaving only hides the public profile
- saved progress returns on rejoin

## Pass 8 — Settings

Verify these tabs:
1. General
2. Focus
3. Alerts
4. Account

Then verify:
5. System theme
6. Light theme
7. Dark theme
8. Black theme
9. White theme
10. English / Sorani
11. timer settings
12. sound
13. notifications
14. sync state
15. backup import/export
16. sign out

Pass when:
- no duplicated category hierarchy is confusing
- every setting still exists
- theme/language changes render correctly

## Pass 9 — Mobile and accessibility

On a narrow viewport:

1. Use the bottom dock.
2. Open the full sidebar.
3. Confirm the desktop Collapse control is absent.
4. Confirm Today / Focus / Plan / Progress / League are tappable.
5. Confirm Settings remains reachable from the full sidebar.
6. Check Plan tabs.
7. Check Progress tabs.
8. Check Settings tabs.
9. Repeat in Sorani/RTL.
10. Tab through one major flow with keyboard.
11. Confirm visible focus states.
12. Confirm the skip link reaches main content.

Pass when:
- nothing clips
- labels remain readable
- touch targets remain comfortable
- RTL navigation remains usable

## Pass 10 — Final release check

1. Check Today, Focus, Plan, Progress, League and Settings in all five themes.
2. Hard refresh the preview.
3. Confirm there is no blank screen.
4. Confirm there is no Vite/framework error overlay.
5. Confirm data still loads.
6. Re-check exact-head Vercel warning/error/fatal logs.
7. Re-run GitHub Quality on the final head.

Final pass requires:
- all ten passes complete
- Quality green on exact SHA
- exact SHA Vercel deployment READY
- runtime logs clean

## Release rule

After every pass succeeds, V4 is **release-ready**.

Do not mark PR #3 ready or merge it unless explicit permission is given.
