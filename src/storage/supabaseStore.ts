import type { Subject, StudySession } from '../types'
import type { AppSettings } from '../app/settings'
import { normalizeSettings } from '../app/settings'
import { supabase } from '../api/supabaseClient'
import type { WeeklyGoalMap } from '../utils/goalHistory'
import type { FocusDataSnapshot } from './types'

type SubjectRow = {
  id: string
  client_id: string | null
  user_id: string
  name: string
  color: string
  icon: string | null
  archived_at: string | null
  created_at: string
  updated_at: string
}

type StudySessionRow = {
  id: string
  client_id: string | null
  user_id: string
  subject_id: string
  planned_seconds: number
  actual_seconds: number
  started_at: string
  completed_at: string
  completed: boolean
  interruptions: number
  total_paused_seconds: number
  created_at: string
  updated_at: string
}

type GoalRow = {
  id: string
  user_id: string
  daily_minutes: number
  weekly_minutes: number
  effective_from: string
  created_at: string
  updated_at: string
}

type WeeklyGoalHistoryRow = {
  id: string
  user_id: string
  week_start: string
  goal_minutes: number
  achieved_minutes: number
  created_at: string
  updated_at: string
}

type UserSettingsRow = {
  user_id: string
  theme: 'dark' | 'light' | 'system'
  language: 'en' | 'ku'
  focus_minutes: number
  short_break_minutes: number
  long_break_minutes: number
  sessions_before_long_break: number
  sound_enabled: boolean
  volume: number
  notifications_enabled: boolean
  auto_start_break: boolean
  updated_at: string
}

function requireSupabase() {
  if (!supabase) {
    throw new Error('Supabase is not configured')
  }

  return supabase
}

function toSubject(row: SubjectRow): Subject {
  return {
    id: row.client_id ?? row.id,
    name: row.name,
    color: row.color,
    icon: row.icon ?? undefined,
  }
}

function toStudySession(
  row: StudySessionRow,
  subjectMap: Map<string, Subject>,
  cloudSubjectToClientId: Map<string, string>,
): StudySession {
  const clientSubjectId =
    cloudSubjectToClientId.get(row.subject_id) ??
    row.subject_id

  const subject = subjectMap.get(clientSubjectId)

  return {
    id: row.client_id ?? row.id,
    subjectId: clientSubjectId,
    subjectName: subject?.name ?? 'Unknown',
    subjectColor: subject?.color ?? '#8b5cf6',
    duration: Math.round(row.planned_seconds / 60),
    actualDuration: Math.round(row.actual_seconds / 60),
    startedAt: row.started_at
      ? new Date(row.started_at)
      : undefined,
    completedAt: new Date(row.completed_at),
    completed: row.completed,
    interruptions: row.interruptions,
    totalPausedSeconds: row.total_paused_seconds,
  }
}

function dateOnly(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export async function loadSupabaseSnapshot(userId: string): Promise<FocusDataSnapshot> {
  const client = requireSupabase()

  const [
    subjectsResult,
    sessionsResult,
    goalsResult,
    weeklyGoalsResult,
    settingsResult,
  ] = await Promise.all([
    client
      .from('subjects')
      .select('*')
      .eq('user_id', userId)
      .is('archived_at', null)
      .order('created_at', { ascending: true }),

    client
      .from('study_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('started_at', { ascending: false }),

    client
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('effective_from', { ascending: false })
      .limit(1),

    client
      .from('weekly_goal_history')
      .select('*')
      .eq('user_id', userId)
      .order('week_start', { ascending: true }),

    client
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle(),
  ])

  if (subjectsResult.error) throw subjectsResult.error
  if (sessionsResult.error) throw sessionsResult.error
  if (goalsResult.error) throw goalsResult.error
  if (weeklyGoalsResult.error) throw weeklyGoalsResult.error
  if (settingsResult.error) throw settingsResult.error

  const subjectRows =
    (subjectsResult.data ?? []) as SubjectRow[]
  const sessionRows =
    (sessionsResult.data ?? []) as StudySessionRow[]
  const goalRows =
    (goalsResult.data ?? []) as GoalRow[]
  const weeklyRows =
    (weeklyGoalsResult.data ?? []) as WeeklyGoalHistoryRow[]
  const settingsRow =
    settingsResult.data as UserSettingsRow | null

  const subjects = subjectRows.map(toSubject)

  const subjectMap = new Map(
    subjects.map((subject) => [subject.id, subject]),
  )

  const cloudSubjectToClientId = new Map(
    subjectRows.map((row) => [
      row.id,
      row.client_id ?? row.id,
    ]),
  )

  const sessions = sessionRows.map((row) =>
    toStudySession(
      row,
      subjectMap,
      cloudSubjectToClientId,
    ),
  )

  const latestGoal = goalRows[0]

  const weeklyGoalsHistory: WeeklyGoalMap = {}

  for (const row of weeklyRows) {
    weeklyGoalsHistory[row.week_start] =
      row.goal_minutes
  }

  const settings: AppSettings =
    normalizeSettings(
      settingsRow
        ? {
            shortBreak:
              settingsRow.short_break_minutes,
            longBreak:
              settingsRow.long_break_minutes,
            sessionsBeforeLongBreak:
              settingsRow.sessions_before_long_break,
            autoStartBreak:
              settingsRow.auto_start_break,
            soundEnabled:
              settingsRow.sound_enabled,
            soundVolume:
              settingsRow.volume,
            notificationsEnabled:
              settingsRow.notifications_enabled,
          }
        : null,
    )

  return {
    subjects,
    activeSubjectId: subjects[0]?.id ?? null,
    sessions,
    dailyGoal: latestGoal?.daily_minutes ?? 120,
    weeklyGoal:
      latestGoal?.weekly_minutes ?? 600,
    weeklyGoalsHistory,
    settings,
  }
}

export async function saveSupabaseSnapshot(
  snapshot: FocusDataSnapshot,
  userId: string,
): Promise<void> {
  requireSupabase()

  if (!userId) {
    throw new Error('No authenticated user')
  }
  const client = requireSupabase()
  const now = new Date().toISOString()

  const cloudSubjectByClientId =
    new Map<string, string>()

  if (snapshot.subjects.length > 0) {
    const subjectRows = snapshot.subjects.map(
      (subject) => ({
        client_id: subject.id,
        user_id: userId,
        name: subject.name,
        color: subject.color,
        icon: subject.icon ?? null,
        updated_at: now,
      }),
    )

    const { error } = await client
      .from('subjects')
      .upsert(subjectRows, {
        onConflict: 'user_id,client_id',
      })

    if (error) throw error

    const { data, error: subjectReadError } =
      await client
        .from('subjects')
        .select('id, client_id')
        .eq('user_id', userId)

    if (subjectReadError) {
      throw subjectReadError
    }

    for (const row of (data ?? []) as Array<{
      id: string
      client_id: string | null
    }>) {
      if (row.client_id) {
        cloudSubjectByClientId.set(
          row.client_id,
          row.id,
        )
      }
    }
  }

  if (snapshot.sessions.length > 0) {
    const sessionRows = snapshot.sessions.flatMap(
      (session) => {
        const cloudSubjectId =
          cloudSubjectByClientId.get(
            session.subjectId,
          )

        if (!cloudSubjectId) {
          console.warn(
            'Skipping session because its subject is not synced:',
            session.id,
          )
          return []
        }

        return [
          {
            client_id: session.id,
            user_id: userId,
            subject_id: cloudSubjectId,
            planned_seconds: Math.max(
              0,
              Math.round(
                session.duration * 60,
              ),
            ),
            actual_seconds: Math.max(
              0,
              Math.round(
                session.actualDuration * 60,
              ),
            ),
            started_at: (
              session.startedAt ??
              session.completedAt
            ).toISOString(),
            completed_at:
              session.completedAt.toISOString(),
            completed: session.completed,
            interruptions: Math.max(
              0,
              session.interruptions,
            ),
            total_paused_seconds: Math.max(
              0,
              session.totalPausedSeconds,
            ),
            updated_at: now,
          },
        ]
      },
    )

    if (sessionRows.length > 0) {
      const { error } = await client
        .from('study_sessions')
        .upsert(sessionRows, {
          onConflict: 'user_id,client_id',
        })

      if (error) throw error
    }
  }

  const { data: existingGoals, error: goalReadError } =
    await client
      .from('goals')
      .select('id')
      .eq('user_id', userId)
      .order('effective_from', {
        ascending: false,
      })
      .limit(1)

  if (goalReadError) throw goalReadError

  const goalValues = {
    user_id: userId,
    daily_minutes: Math.max(
      0,
      Math.round(snapshot.dailyGoal),
    ),
    weekly_minutes: Math.max(
      0,
      Math.round(snapshot.weeklyGoal),
    ),
    effective_from: dateOnly(new Date()),
    updated_at: now,
  }

  if (existingGoals?.[0]?.id) {
    const { error } = await client
      .from('goals')
      .update(goalValues)
      .eq('id', existingGoals[0].id)
      .eq('user_id', userId)

    if (error) throw error
  } else {
    const { error } = await client
      .from('goals')
      .insert(goalValues)

    if (error) throw error
  }

  const weeklyRows = Object.entries(
    snapshot.weeklyGoalsHistory,
  ).map(([weekStart, goalMinutes]) => ({
    user_id: userId,
    week_start: weekStart,
    goal_minutes: Math.max(
      0,
      Math.round(goalMinutes),
    ),
    achieved_minutes: 0,
    updated_at: now,
  }))

  if (weeklyRows.length > 0) {
    const { error } = await client
      .from('weekly_goal_history')
      .upsert(weeklyRows, {
        onConflict: 'user_id,week_start',
      })

    if (error) throw error
  }

  const { error: settingsError } =
    await client
      .from('user_settings')
      .upsert(
        {
          user_id: userId,
          short_break_minutes:
            snapshot.settings.shortBreak,
          long_break_minutes:
            snapshot.settings.longBreak,
          sessions_before_long_break:
            snapshot.settings
              .sessionsBeforeLongBreak,
          sound_enabled:
            snapshot.settings.soundEnabled,
          volume:
            snapshot.settings.soundVolume,
          notifications_enabled:
            snapshot.settings
              .notificationsEnabled,
          auto_start_break:
            snapshot.settings.autoStartBreak,
          updated_at: now,
        },
        {
          onConflict: 'user_id',
        },
      )

  if (settingsError) {
    throw settingsError
  }
}
