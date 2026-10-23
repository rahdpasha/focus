# Focus Calm redesign

## Product changes
- Four primary destinations: Focus, Progress, League, Settings.
- Focus opens directly to the timer; subject creation is a native, keyboard-accessible dialog.
- Subject management, goals, fixed routines, rotation, and recovery remain in a contextual study-plan dialog.
- Progress adds a seven-day chart, weekly goal ring, twelve-week activity calendar, and time by subject. Detailed analytics, achievements and searchable history remain available.
- League preserves all existing loading, scoring, rankings, ties, profile opt-in, results and achievements. Secondary podium, season, scoring and champion panels are collapsed by default.
- Appearance, focus preferences, alerts and account controls remain grouped in Settings. AI entry points are removed from navigation; underlying modules are retained.
- New cream, ink and teal design tokens; forest dark mode; touch targets, bottom navigation, reduced motion and RTL handling.

## Reliability and data
- No database migrations, production deployment, scoring edits or user-data writes were performed during implementation.
- Timer remains mounted across navigation. Active sessions retain their subject, and study-plan changes are blocked while a session runs or is paused.
- Removed the three-second countdown before saving a finished session. Completion records use the actual deadline instead of the time the interface was reopened.
- New active-timer snapshots are isolated by account. The old unscoped browser snapshot is retained but deliberately not imported into another account. Finish any existing timer before a production upgrade. Existing saved history is unchanged.
- Notification permission requests are confined to Settings. Existing Supabase timer jobs and web-push integration are retained.
- Read-only verification found the background-completion cron enabled every 15 seconds, with its latest 20 runs succeeding. Timer-job and subscription tables have RLS enabled.

## Validation
- Production build and TypeScript checks passed.
- 66 unit/regression tests passed (existing routine, recovery, planner, theme, timer and data protections, plus new summary/account isolation coverage).
- Targeted ESLint checks passed for changed core components.
- Browser checked desktop Focus and Progress; mobile 390px layout, completion, subject creation dialog, Settings, dark mode and Sorani RTL. Mobile RTL document width matched viewport width.
- Browser functional checks used local-only test data; no fake sessions were added to Supabase.
- No authenticated end-to-end cloud write or physical iPhone/Android push-delivery test was performed. A signed-in device check remains necessary before production rollout.

## Background limits
A browser can suspend JavaScript when backgrounded or closed. Server completion works only after its timer job reaches Supabase. Web push requires installation on iPhone Home Screen, permission, network connectivity and a registered subscription. OS notification settings can delay/suppress alerts. The 15-second scheduler is not an exact-second alarm. Offline starts cannot be guaranteed to notify while closed. Auto-started break notifications still depend on client execution.

## Review
Preview uses the existing Supabase integration and real account data after sign-in. Edits made while reviewing therefore affect that account. Production remains unchanged. Branch: redesign/focus-calm.
