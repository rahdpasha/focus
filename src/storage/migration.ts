import type { FocusDataSnapshot } from './types'
import type {
  GoalRecord,
  SubjectRecord,
  StudySessionRecord,
  UserSettingsRecord,
  WeeklyGoalHistoryRecord,
} from './databaseSchema'

export interface MigratedFocusData {
  subjects: SubjectRecord[]
  sessions: StudySessionRecord[]
  goals: GoalRecord[]
  weeklyGoalsHistory: WeeklyGoalHistoryRecord[]
  settings: UserSettingsRecord | null
}

export interface MigrationOptions {
  userId: string
  now?: Date
}

function asDate(value: Date | string | undefined, fallback: Date): Date {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value
  if (typeof value === 'string') {
    const parsed = new Date(value)
    if (!Number.isNaN(parsed.getTime())) return parsed
  }
  return fallback
}

export function migrateLocalDataToRecords(
  snapshot: FocusDataSnapshot,
  options: MigrationOptions,
): MigratedFocusData {
  const now = options.now ?? new Date()
  const userId = options.userId

  const subjects: SubjectRecord[] = snapshot.subjects.map((subject) => ({
    id: subject.id,
    userId,
    name: subject.name,
    color: subject.color,
    icon: subject.icon ?? null,
    createdAt: now,
    updatedAt: now,
    archivedAt: null,
  }))

  const sessions: StudySessionRecord[] = snapshot.sessions.map((session) => {
    const startedAt = asDate(session.startedAt, asDate(session.completedAt, now))
    const completedAt = asDate(session.completedAt, startedAt)
    const plannedSeconds = Math.max(0, Math.round(session.duration * 60))
    const actualSeconds = Math.max(0, Math.round(session.actualDuration * 60))

    return {
      id: session.id,
      userId,
      subjectId: session.subjectId,
      plannedSeconds,
      actualSeconds,
      startedAt,
      completedAt,
      completed: session.completed,
      interruptions: Math.max(0, session.interruptions ?? 0),
      totalPausedSeconds: Math.max(0, session.totalPausedSeconds ?? 0),
      createdAt: startedAt,
      updatedAt: completedAt,
    }
  })

  const goals: GoalRecord[] = [{
    id: `${userId}:goals:current`,
    userId,
    dailyMinutes: Math.max(0, snapshot.dailyGoal),
    weeklyMinutes: Math.max(0, snapshot.weeklyGoal),
    effectiveFrom: now.toISOString().slice(0, 10),
    createdAt: now,
    updatedAt: now,
  }]

  const weeklyGoalsHistory: WeeklyGoalHistoryRecord[] = Object.entries(
    snapshot.weeklyGoalsHistory,
  ).map(([weekStart, goalMinutes]) => ({
    id: `${userId}:weekly-goal:${weekStart}`,
    userId,
    weekStart,
    goalMinutes: Math.max(0, goalMinutes),
    achievedMinutes: 0,
    createdAt: now,
    updatedAt: now,
  }))

  const settings: UserSettingsRecord = {
    userId,
    theme: 'system',
    language: 'en',
    focusMinutes: 25,
    shortBreakMinutes: snapshot.settings.shortBreak,
    longBreakMinutes: snapshot.settings.longBreak,
    sessionsBeforeLongBreak: snapshot.settings.sessionsBeforeLongBreak,
    soundEnabled: snapshot.settings.soundEnabled,
    volume: snapshot.settings.soundVolume,
    notificationsEnabled: snapshot.settings.notificationsEnabled,
    autoStartBreak: snapshot.settings.autoStartBreak,
  }

  return { subjects, sessions, goals, weeklyGoalsHistory, settings }
}
