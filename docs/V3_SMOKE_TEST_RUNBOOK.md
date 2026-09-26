# FOCUS V3 manual smoke-test runbook

Use this only after the automated release gates are green. PR #1 stays draft until every required step below passes.

## Test setup

Use:
- Test account **A**
- Test account **B**
- One desktop browser
- One narrow/mobile viewport
- The latest READY preview for the release branch

For every failed step, record:
- step number
- account used
- browser/device
- exact action
- expected result
- actual result
- screenshot or console/runtime evidence if available

Do not merge around a failed step. Fix it, re-run Quality, then repeat the failed step and any related steps.

## 1. Auth + account isolation

1. Sign in as account A.
2. Confirm A's subjects, sessions, goals, routine, and settings load.
3. Sign out.
4. Sign in as account B in the same browser.
5. Confirm no A-owned study data appears.
6. Sign out and return to A.
7. Confirm A's cloud data hydrates correctly.

Pass when:
- no cross-account data appears
- both accounts recover their own cloud state

## 2. Core session persistence

1. In A, start a routine/focus session from Dashboard.
2. Add a note.
3. Add one checklist item.
4. Complete the session.
5. Refresh the app.
6. Open History and Statistics.
7. Check routine progress.

Pass when:
- the completed session survives refresh
- note/checklist survive
- History, Statistics, and routine progress agree

## 3. Subject archive + history safety

1. Use a subject with completed history.
2. Create or use an advanced goal linked to it.
3. Remove/archive the subject.
4. Refresh.
5. Open historical sessions.
6. Inspect the linked advanced goal.

Pass when:
- historical sessions remain readable
- the goal remains but becomes unscoped
- no history is deleted

## 4. Subject-scoped goal isolation

1. Create a goal scoped to Subject A.
2. Complete focus time in Subject B.
3. Check goal progress.
4. Complete focus time in Subject A.
5. Check goal progress again.

Pass when:
- Subject B time does not advance the goal
- Subject A time does advance the goal

## 5. Offline recovery

1. Go offline.
2. Make one safe edit, such as a routine/settings change.
3. Make one destructive action, such as deleting a session or archiving a subject.
4. Go back online.
5. Allow sync to finish.
6. Refresh.

Pass when:
- final cloud state matches the intended local state
- deleted/archived data does not return
- no ghost row appears

## 6. Two-account League

1. Opt in A.
2. Opt in B.
3. Open weekly standings.
4. Open monthly standings.
5. Confirm both public profiles appear when expected.
6. Confirm private session details are not exposed.
7. Opt one account out.

Pass when:
- standings are correct
- only public League information is visible
- opt-out removes the account publicly without deleting progress/history

## 7. Settings + theme sync

1. Change theme on A in browser/device 1.
2. Change language.
3. Open A on browser/device 2.
4. Confirm both settings sync.
5. Import one valid custom theme pack.
6. Export it.
7. Attempt one invalid theme pack.

Pass when:
- theme/language sync correctly
- valid theme import/export works
- invalid pack is rejected

## 8. Mobile + accessibility

On a narrow viewport:

1. Use the bottom dock.
2. Open the full sidebar.
3. Reach a secondary page.
4. Tab through a major flow.
5. Use the skip link.
6. Check major touch targets.

Pass when:
- navigation is usable without clipping
- keyboard focus remains visible
- skip link reaches main content
- controls remain comfortably tappable

## 9. Final visual sweep

Inspect these pages:
- Dashboard
- Focus
- Routine
- League
- Settings

Check these themes:
- System
- Dark
- Light
- Black
- White

Pass when:
- no unreadable text
- no overflow
- no clipped controls
- no broken cards
- no leftover aggressive cyber glow
- Black/White remain clean and monochrome

## 10. Final refresh + runtime health

1. Hard refresh the preview.
2. Confirm there is no blank screen.
3. Confirm there is no error overlay.
4. Confirm expected data still loads.
5. Re-check Vercel warning/error/fatal runtime logs.

Pass when:
- app reloads normally
- data remains intact
- final runtime log query is clean

## Final sign-off

Record the result only after all ten pass:

- [ ] Auth/data isolation
- [ ] Core session persistence
- [ ] Subject archive/history safety
- [ ] Subject-scoped goal isolation
- [ ] Offline recovery
- [ ] Two-account League privacy/standings
- [ ] Settings/custom-theme sync
- [ ] Mobile/keyboard accessibility
- [ ] Five-theme visual sweep
- [ ] Hard refresh/runtime health

When all boxes are checked:
1. Re-run GitHub Quality.
2. Confirm the final preview is READY.
3. Re-check runtime logs.
4. Mark PR #1 ready for review.
5. Merge only after final sign-off.
