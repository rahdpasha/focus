import type { Subject, StudySession } from '../types'
import type { AppSettings } from '../app/settings'
import { normalizeSettings } from '../app/settings'
import { supabase } from '../api/supabaseClient'
import type { WeeklyGoalMap } from '../utils/goalHistory'
import type { FocusDataSnapshot } from './types'

type SubjectRow = {
  id: string
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

async function requireUserId(): Promise<string> {
  const client = requireSupabase()

  const { data, error } = await client.auth.getUser()

  if (error) throw error

  if (!data.user) {
    throw new Error('No authenticated user')
  }

  return data.user.id
}

function toSubject(row: SubjectRow): Subject {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    icon: row.icon ?? undefined,
  }
}

function toStudySession(
  row: StudySessionRow,
  subjectMap: Map<string, Subject>,
): StudySession {
  const subject = subjectMap.get(row.subject_id)

  return {
    id: row.id,
    subjectId: row.subject_id,
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

export async function loadSupabaseSnapshot(): Promise<FocusDataSnapshot> {
  const client = requireSupabase()
  const userId = await requireUserId()

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

  const subjectRows = (subjectsResult.data ?? []) as SubjectRow[]
  const sessionRows = (sessionsResult.data ?? []) as StudySessionRow[]
  const goalRows = (goalsResult.data ?? []) as GoalRow[]
  const weeklyRows =
    (weeklyGoalsResult.data ?? []) as WeeklyGoalHistoryRow[]
  const settingsRow =
    settingsResult.data as UserSettingsRow | null

  const subjects = subjectRows.map(toSubject)
  const subjectMap = new Map(
    subjects.map((subject) => [subject.id, subject]),
  )

  const sessions = sessionRows.map((row) =>
    toStudySession(row, subjectMap),
  )

  const latestGoal = goalRows[0]

  const weeklyGoalsHistory: WeeklyGoalMap = {}

  for (const row of weeklyRows) {
    weeklyGoalsHistory[row.week_start] = row.goal_minutes
  }

  const settings: AppSettings = normalizeSettings(
    settingsRow
      ? {
          shortBreak: settingsRow.short_break_minutes,
          longBreak: settingsRow.long_break_minutes,
          sessionsBeforeLongBreak:
            settingsRow.sessions_before_long_break,
          autoStartBreak: settingsRow.auto_start_break,
          soundEnabled: settingsRow.sound_enabled,
          soundVolume: settingsRow.volume,
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
    weeklyGoal: latestGoal?.weekly_minutes ?? 600,
    weeklyGoalsHistory,
    settings,
  }
}

export async function saveSupabaseSnapshot(
  snapshot: FocusDataSnapshot,
): Promise<void> {
  const client = requireSupabase()
  const userId = await requireUserId()
  const now = new Date().toISOString()

  if (snapshot.subjects.length > 0) {
    const subjectRows = snapshot.subjects.map((subject) => ({
      id: subject.id,
      user_id: userId,
      name: subject.name,
      color: subject.color,
      icon: subject.icon ?? null,
      updated_at: now,
    }))

    const { error } = await client
      .from('subjects')
      .upsert(subjectRows, {
        onConflict: 'id',
      })

    if (error) throw error
  }

  if (snapshot.sessions.length > 0) {
    const sessionRows = snapshot.sessions.map((session) => ({
      id: session.id,
      user_id: userId,
      subject_id: session.subjectId,
      planned_seconds: Math.max(
        0,
        Math.round(session.duration * 60),
      ),
      actual_seconds: Math.max(
        0,
        Math.round(session.actualDuration * 60),
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
    }))

    const { error } = await client
      .from('study_sessions')
      .upsert(sessionRows, {
        onConflict: 'id',
      })

    if (error) throw error
  }

  const { error: goalError } = await client
    .from('goals')
    .upsert(
      {
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
      },
      {
        onConflict: 'id',
      },
    )

  if (goalError) {
    const fallback = await client
      .from('goals')
      .insert({
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
      })

    if (fallback.error) {
      throw fallback.error
    }
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

  const { error: settingsError } = await client
    .from('user_settings')
    .upsert(
      {
        user_id: userId,
        short_break_minutes:
          snapshot.settings.shortBreak,
        long_break_minutes:
          snapshot.settings.longBreak,
        sessions_before_long_break:
          snapshot.settings.sessionsBeforeLongBreak,
        sound_enabled:
          snapshot.settings.soundEnabled,
        volume:
          snapshot.settings.soundVolume,
        notifications_enabled:
          snapshot.settings.notificationsEnabled,
        auto_start_break:
          snapshot.settings.autoStartBreak,
        updated_at: now,
      },
      {
        onConflict: 'user_id',
      },
    )

  if (settingsError) throw settingsError
}
