# FOCUS V2 — Database Architecture

## Goal

Define a provider-neutral database contract before connecting FOCUS to a real backend.

The database must become an implementation detail behind the existing storage boundary:

UI -> useFocusData -> FocusDataStore -> Local/Remote implementation

## Core entities

### users
- id: UUID, primary key
- email: string, unique
- display_name: string, nullable
- created_at: timestamp
- updated_at: timestamp

### subjects
- id: UUID, primary key
- user_id: UUID, foreign key -> users.id
- name: string
- color: string
- icon: string, nullable
- created_at: timestamp
- updated_at: timestamp
- archived_at: timestamp, nullable

Unique constraint: (user_id, lower(name))

### study_sessions
- id: UUID, primary key
- user_id: UUID, foreign key -> users.id
- subject_id: UUID, foreign key -> subjects.id
- planned_seconds: integer
- actual_seconds: integer
- started_at: timestamp
- completed_at: timestamp
- completed: boolean
- interruptions: integer
- total_paused_seconds: integer
- created_at: timestamp
- updated_at: timestamp

Indexes:
- (user_id, started_at)
- (user_id, completed_at)
- (user_id, subject_id, started_at)

### goals
- id: UUID, primary key
- user_id: UUID, foreign key -> users.id
- daily_minutes: integer
- weekly_minutes: integer
- effective_from: date
- created_at: timestamp
- updated_at: timestamp

### weekly_goal_history
- id: UUID, primary key
- user_id: UUID, foreign key -> users.id
- week_start: date
- goal_minutes: integer
- achieved_minutes: integer
- created_at: timestamp
- updated_at: timestamp

Unique constraint: (user_id, week_start)

### user_settings
- user_id: UUID, primary/foreign key -> users.id
- theme: dark | light | system
- language: en | ku
- focus_minutes: integer
- short_break_minutes: integer
- long_break_minutes: integer
- sessions_before_long_break: integer
- sound_enabled: boolean
- volume: number
- notifications_enabled: boolean
- auto_start_break: boolean
- updated_at: timestamp

## Important relationship decisions

1. `study_sessions` reference `subject_id`; subject name/color are not canonical session fields.
2. Historical display can still preserve subject information through joins or snapshot fields later if required.
3. All user-owned rows carry `user_id` so authorization can be enforced at the data layer.
4. Dates are stored as explicit timestamps/dates; do not use `toISOString()` as a substitute for local calendar semantics.
5. `started_at` is now first-class, enabling accurate time-of-day and session-duration analytics.
6. Deleting a subject should not delete study history. Prefer archive/soft-delete semantics.

## LocalStorage migration

Legacy data remains supported locally.

Migration flow:

localStorage snapshot
-> normalize legacy shapes
-> generate stable UUIDs where needed
-> map subject references
-> map session timestamps
-> create user-owned records
-> upload in batches
-> verify counts/checksums
-> mark migration complete

Migration must be idempotent. A second run must not duplicate sessions, subjects, goals, or settings.

## Backend boundary

The future implementation should satisfy the existing `FocusDataStore` contract or a future async equivalent:

```text
FocusDataStore
  load
  save

LocalStorageStore
RemoteStore
```

Do not put database SDK calls inside React components.

## Future backend API contract

Recommended application-level operations:

- getCurrentUser()
- listSubjects()
- createSubject()
- updateSubject()
- archiveSubject()
- listSessions(range)
- createSession()
- updateSession()
- getGoals()
- saveGoals()
- listWeeklyGoalHistory()
- getSettings()
- saveSettings()

The React layer should depend on these domain operations, not on SQL or provider-specific SDKs.

## Recommended V2 implementation order

1. Choose backend provider.
2. Create database migrations.
3. Add authentication.
4. Implement remote repository/store.
5. Add local-first sync.
6. Migrate existing local data.
7. Add conflict handling.
8. Add offline queue/retry.
9. Enable cloud sync.
