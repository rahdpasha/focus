# FOCUS V4 release checklist

FOCUS V4 is developed on `feature/focus-v4` in PR #3.

Keep PR #3 **draft and unmerged** until the manual release smoke test passes and explicit merge approval is given.

## Current release state

- [x] V4 navigation reduced to Today / Focus / Plan / Progress / League / Settings.
- [x] Plan contains Plan & Goals / Subjects / Routine / Advisor.
- [x] Progress contains Overview / Records / History.
- [x] First-use states exist for Today, Focus, Plan and Progress.
- [x] Subject creation remains reachable from all required V4 entry points.
- [x] Focus optional panels use progressive disclosure.
- [x] Approved Focus timer geometry preserved.
- [x] Production auth rate-limit / duplicate-submit behavior preserved.
- [x] GitHub Quality passes on the current V4 head.
- [x] Exact-head Vercel preview is READY.
- [x] Exact-head Vercel warning/error/fatal runtime query is clean.

## Blocking manual smoke test

Use the latest READY V4 preview, two test accounts where needed, one desktop browser and one narrow/mobile viewport.

### 1. Auth and account isolation
- [ ] Create/sign in with a test account and confirm email flow.
- [ ] Sign in with an existing account.
- [ ] Sign out of account A and sign in to account B in the same browser.
- [ ] Confirm no account-A study data appears for B.
- [ ] Return to A and confirm A's cloud data hydrates correctly.
- [ ] Trigger the email rate-limit path safely and confirm the production-friendly message remains intact.

### 2. First-use flow
- [ ] With no subjects, Today shows one clear Add Subject setup action.
- [ ] With no subjects, Focus shows Add your first subject instead of an unusable timer.
- [ ] Add the first subject from Today and confirm the subject creator opens correctly.
- [ ] Add the first subject from Focus and confirm the user returns to a usable Focus state.
- [ ] Empty Plan exposes subject setup clearly.
- [ ] Empty Progress routes the user toward completing a first Focus session.

### 3. Focus session path
- [ ] Select a subject.
- [ ] Confirm the approved timer geometry is unchanged.
- [ ] Start, pause and resume a Focus session.
- [ ] Complete a Focus session.
- [ ] Add optional session notes and checklist steps.
- [ ] Confirm optional Smart cue, Ambient audio and Session notes & steps remain collapsed by default.
- [ ] Refresh and confirm the completed session remains saved.

### 4. Cloud sync and persistence
- [ ] Confirm the completed session reaches cloud sync.
- [ ] Confirm history and progress reflect the same session.
- [ ] Go offline, make one safe edit, reconnect and confirm intended state wins.
- [ ] Delete/archive one safe test entity and confirm it does not reappear after sync/refresh.

### 5. Plan workspace
- [ ] Verify Plan & Goals tab.
- [ ] Verify Subjects tab.
- [ ] Verify Routine tab.
- [ ] Verify Advisor tab.
- [ ] Create a simple goal using only the default fields.
- [ ] Open advanced goal options and save subject scope + priority.
- [ ] Create a simple routine using only the default fields.
- [ ] Open advanced routine options and save fixed/rotation, recovery, preset and exact weekdays.
- [ ] Verify Add Subject beside goal and routine subject fields.

### 6. Progress workspace
- [ ] Verify Overview.
- [ ] Verify Records.
- [ ] Verify History.
- [ ] Confirm time units and labels are correct in English.
- [ ] Switch to Sorani and confirm the same Progress surfaces remain fully localized.

### 7. League
- [ ] Before joining, confirm only public name / join-save controls / privacy explanation are shown.
- [ ] Join League.
- [ ] Confirm rank, score, focused time, scored days, next step, status and milestones reveal after joining.
- [ ] Confirm scoring behavior: 0 points for a completed zero-study day, 1 point from 1 second through 90 minutes, 3 points above 90 minutes.
- [ ] Leave League and confirm the public profile disappears.
- [ ] Rejoin and confirm League history/progress returns.
- [ ] Confirm private subject/session details are not exposed.

### 8. Settings
- [ ] Verify General / Focus / Alerts / Account tabs.
- [ ] Verify System / Light / Dark / Black / White themes.
- [ ] Verify English and Sorani switching.
- [ ] Verify timer, sound and notification controls.
- [ ] Verify sync state display.
- [ ] Verify backup import/export.
- [ ] Verify account state and sign-out.

### 9. Mobile and desktop UX
- [ ] Desktop sidebar shows the six V4 destinations with the subject list.
- [ ] Mobile bottom dock works without clipping.
- [ ] Mobile full sidebar opens/closes correctly.
- [ ] Desktop-only collapse control does not appear in the mobile drawer.
- [ ] Plan / Progress / Settings tabs remain readable and tappable in English.
- [ ] Repeat the same mobile checks in Sorani/RTL.
- [ ] Check keyboard focus and the skip link.

### 10. Final visual and runtime sweep
- [ ] Check Today, Focus, Plan, Progress, League and Settings in all five themes.
- [ ] Confirm no unreadable text, overflow, clipped controls or broken cards.
- [ ] Hard refresh the exact-head preview.
- [ ] Confirm no blank screen or framework error overlay.
- [ ] Re-check Vercel warning/error/fatal runtime logs.
- [ ] Re-run GitHub Quality on the final head.

## Release rule

Only after every blocking manual item above passes:

1. Record the final verified head SHA.
2. Confirm GitHub Quality is green on that exact SHA.
3. Confirm Vercel is READY on that exact SHA.
4. Confirm runtime logs are clean.
5. Mark PR #3 ready for review only if explicitly requested.
6. Merge only after explicit user permission.
