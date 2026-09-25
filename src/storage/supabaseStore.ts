import type { Subject, StudySession } from '../types'
import type { AppSettings } from '../app/settings'
import { normalizeSettings } from '../app/settings'
import { supabase } from '../api/supabaseClient'
import type { WeeklyGoalMap } from '../utils/goalHistory'
import type { AdvancedGoal, FocusDataSnapshot, RoutineItem } from './types'
import type { OfflineMutationState } from './offlineSync'

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
  notes: string | null
  subtasks: unknown
  routine_item_client_id: string | null
  routine_date: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
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

type AdvancedGoalRow = {
  id: string
  client_id: string | null
  user_id: string
  title: string
  subject_client_id: string | null
  target_minutes: number
  deadline: string
  priority: 'low' | 'medium' | 'high'
  status: 'active' | 'completed'
  created_at: string
  updated_at: string
  deleted_at: string | null
}

type RoutineItemRow = {
  id: string
  client_id: string
  user_id: string
  title: string
  subject_client_id: string
  target_minutes: number
  mode: 'fixed' | 'rotation'
  rotation_order: number
  days_of_week: number[]
  recovery_days: number
  enabled: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
}

type UserSettingsRow = {
  user_id: string
  theme: 'dark' | 'light' | 'system' | 'black' | 'white' | 'custom'
  custom_theme_pack: unknown | null
  language: 'en' | 'ku'
  focus_minutes: number
  short_break_minutes: number
  long_break_minutes: number
  sessions_before_long_break: number
  sound_enabled: boolean
  volume: number
  notifications_enabled: boolean
  auto_start_break: boolean
  workspace_preferences_version: number
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
    duration: row.planned_seconds,
    actualDuration: row.actual_seconds,
    startedAt: row.started_at
      ? new Date(row.started_at)
      : undefined,
    completedAt: new Date(row.completed_at),
    completed: row.completed,
    interruptions: row.interruptions,
    totalPausedSeconds: row.total_paused_seconds,
    notes: row.notes ?? undefined,
    subtasks: Array.isArray(row.subtasks)
      ? (row.subtasks as StudySession['subtasks'])
      : undefined,
    routineItemId:
      row.routine_item_client_id ?? undefined,
    routineDate:
      row.routine_date ?? undefined,
  }
}

function dateOnly(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export async function loadSupabaseSnapshot(
  userId: string,
): Promise<
  FocusDataSnapshot & {
    hasArchivedSubjects: boolean
  }
> {
  const client = requireSupabase()

  const [
    subjectsResult,
    sessionsResult,
    goalsResult,
    weeklyGoalsResult,
    advancedGoalsResult,
    routineItemsResult,
    settingsResult,
  ] = await Promise.all([
    client
      .from('subjects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true }),

    client
      .from('study_sessions')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
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
      .from('advanced_goals')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),

    client
      .from('routine_items')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('mode', { ascending: true })
      .order('rotation_order', { ascending: true })
      .order('created_at', { ascending: true }),

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
  if (advancedGoalsResult.error) throw advancedGoalsResult.error
  if (routineItemsResult.error) throw routineItemsResult.error
  if (settingsResult.error) throw settingsResult.error

  const subjectRows =
    (subjectsResult.data ?? []) as SubjectRow[]
  const sessionRows =
    (sessionsResult.data ?? []) as StudySessionRow[]
  const goalRows =
    (goalsResult.data ?? []) as GoalRow[]
  const weeklyRows =
    (weeklyGoalsResult.data ?? []) as WeeklyGoalHistoryRow[]
  const advancedGoalRows =
    (advancedGoalsResult.data ?? []) as AdvancedGoalRow[]
  const routineRows =
    (routineItemsResult.data ?? []) as RoutineItemRow[]
  const settingsRow =
    settingsResult.data as UserSettingsRow | null

  const allSubjects =
    subjectRows.map(toSubject)

  const subjects =
    subjectRows
      .filter((row) => !row.archived_at)
      .map(toSubject)

  const subjectMap = new Map(
    allSubjects.map((subject) => [subject.id, subject]),
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

  const advancedGoals: AdvancedGoal[] =
    advancedGoalRows.map((row) => ({
      id: row.client_id ?? row.id,
      title: row.title,
      subjectId: row.subject_client_id ?? undefined,
      targetMinutes: row.target_minutes,
      deadline: row.deadline,
      priority: row.priority,
      status: row.status,
      createdAt: row.created_at,
    }))

  const routineItems: RoutineItem[] =
    routineRows.map((row) => ({
      id: row.client_id,
      title: row.title,
      subjectId:
        row.subject_client_id,
      targetMinutes:
        row.target_minutes,
      mode: row.mode,
      rotationOrder:
        row.rotation_order,
      daysOfWeek:
        Array.isArray(row.days_of_week) &&
        row.days_of_week.length > 0
          ? row.days_of_week
          : [0, 1, 2, 3, 4, 5, 6],
      recoveryDays:
        Math.max(
          0,
          Math.min(
            3,
            row.recovery_days ?? 1,
          ),
        ),
      enabled: row.enabled,
      createdAt:
        row.created_at,
    }))

  const settings: AppSettings =
    normalizeSettings(
      settingsRow
        ? {
            theme:
              settingsRow.theme,
            customThemePack:
              normalizeThemeTokenPack(
                settingsRow.custom_theme_pack,
              ),
            language:
              settingsRow.language,
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
    advancedGoals,
    routineItems,
    settings,
    workspacePreferencesVersion:
      settingsRow?.workspace_preferences_version ?? 0,
    hasArchivedSubjects:
      subjectRows.some(
        (row) =>
          Boolean(row.archived_at),
      ),
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

  const {
    data: cloudSubjectRows,
    error: cloudSubjectReadError,
  } = await client
    .from('subjects')
    .select('id, client_id, archived_at')
    .eq('user_id', userId)

  if (cloudSubjectReadError) {
    throw cloudSubjectReadError
  }

  const cloudSubjects =
    (cloudSubjectRows ?? []) as Array<{
      id: string
      client_id: string | null
      archived_at: string | null
    }>

  for (const row of cloudSubjects) {
    if (row.client_id) {
      cloudSubjectByClientId.set(
        row.client_id,
        row.id,
      )
    }
  }

  const activeSubjectIds = new Set(
    snapshot.subjects.map(
      (subject) => subject.id,
    ),
  )

  if (snapshot.subjects.length > 0) {
    const subjectRows =
      snapshot.subjects.map(
        (subject) => ({
          client_id: subject.id,
          user_id: userId,
          name: subject.name,
          color: subject.color,
          icon: subject.icon ?? null,
          updated_at: now,
        }),
      )

    const { error } =
      await client
        .from('subjects')
        .upsert(subjectRows, {
          onConflict:
            'user_id,client_id',
        })

    if (error) throw error

    }

  const historicalSubjectRows = Array.from(
    snapshot.sessions.reduce(
      (rows, session) => {
        if (
          !session.subjectId ||
          activeSubjectIds.has(session.subjectId) ||
          cloudSubjectByClientId.has(session.subjectId) ||
          rows.has(session.subjectId)
        ) {
          return rows
        }

        rows.set(session.subjectId, {
          client_id: session.subjectId,
          user_id: userId,
          name:
            session.subjectName.trim() ||
            'Archived subject',
          color:
            session.subjectColor ||
            '#8b5cf6',
          icon: null,
          archived_at: now,
          updated_at: now,
        })

        return rows
      },
      new Map<
        string,
        {
          client_id: string
          user_id: string
          name: string
          color: string
          icon: null
          archived_at: string
          updated_at: string
        }
      >(),
    ).values(),
  )

  if (historicalSubjectRows.length > 0) {
    const { error } = await client
      .from('subjects')
      .upsert(historicalSubjectRows, {
        onConflict: 'user_id,client_id',
      })

    if (error) throw error
  }

  const {
    data: refreshedSubjectRows,
    error: refreshedSubjectReadError,
  } = await client
    .from('subjects')
    .select('id, client_id')
    .eq('user_id', userId)

  if (refreshedSubjectReadError) {
    throw refreshedSubjectReadError
  }

  cloudSubjectByClientId.clear()

  for (const row of (refreshedSubjectRows ?? []) as Array<{
    id: string
    client_id: string | null
  }>) {
    cloudSubjectByClientId.set(row.id, row.id)
    if (row.client_id) {
      cloudSubjectByClientId.set(
        row.client_id,
        row.id,
      )
    }
  }

  /*
   * Historical sessions may reference archived subjects. Missing
   * historical subject rows are reconstructed above before sessions
   * are written so portable backups remain restorable.
   */

  if (snapshot.sessions.length > 0) {
    const sessionRows =
      snapshot.sessions.flatMap(
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
              planned_seconds:
                Math.max(
                  0,
                  Math.round(
                    session.duration,
                  ),
                ),
              actual_seconds:
                Math.max(
                  0,
                  Math.round(
                    session.actualDuration,
                  ),
                ),
              started_at:
                new Date(
                  session.startedAt ??
                    session.completedAt,
                ).toISOString(),
              completed_at:
                new Date(
                  session.completedAt,
                ).toISOString(),
              completed:
                session.completed,
              interruptions:
                Math.max(
                  0,
                  session.interruptions,
                ),
              total_paused_seconds:
                Math.max(
                  0,
                  session.totalPausedSeconds,
                ),
              notes: session.notes ?? null,
              subtasks: session.subtasks ?? [],
              routine_item_client_id:
                session.routineItemId ?? null,
              routine_date:
                session.routineDate ?? null,
              updated_at: now,
            },
          ]
        },
      )

    if (sessionRows.length > 0) {
      const { error } =
        await client
          .from('study_sessions')
          .upsert(sessionRows, {
            onConflict:
              'user_id,client_id',
          })

      if (error) throw error
    }
  }

  // Snapshot saves are intentionally non-destructive. Entity
  // deletion/archival uses explicit per-entity operations so a stale
  // device cannot remove newer data created on another device.

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

  const advancedGoalRows = snapshot.advancedGoals.map((goal) => ({
    client_id: goal.id,
    user_id: userId,
    title: goal.title.trim(),
    subject_client_id: goal.subjectId ?? null,
    target_minutes: Math.max(1, Math.round(goal.targetMinutes)),
    deadline: new Date(goal.deadline).toISOString(),
    priority: goal.priority,
    status: goal.status,
    created_at: goal.createdAt,
    updated_at: now,
  }))

  if (advancedGoalRows.length > 0) {
    const { error } = await client
      .from('advanced_goals')
      .upsert(advancedGoalRows, {
        onConflict: 'user_id,client_id',
      })

    if (error) throw error
  }

  const routineRows =
    snapshot.routineItems.map(
      (item) => ({
        client_id: item.id,
        user_id: userId,
        title: item.title.trim(),
        subject_client_id:
          item.subjectId,
        target_minutes: Math.max(
          1,
          Math.round(
            item.targetMinutes,
          ),
        ),
        mode: item.mode,
        rotation_order:
          Math.max(
            0,
            Math.round(
              item.rotationOrder,
            ),
          ),
        days_of_week:
          item.daysOfWeek.length > 0
            ? Array.from(
                new Set(
                  item.daysOfWeek
                    .filter(
                      (day) =>
                        Number.isInteger(day) &&
                        day >= 0 &&
                        day <= 6,
                    ),
                ),
              )
            : [0, 1, 2, 3, 4, 5, 6],
        recovery_days:
          Math.max(
            0,
            Math.min(
              3,
              Math.round(
                item.recoveryDays,
              ),
            ),
          ),
        enabled: item.enabled,
        created_at:
          item.createdAt,
        updated_at: now,
      }),
    )

  if (routineRows.length > 0) {
    const { error } = await client
      .from('routine_items')
      .upsert(routineRows, {
        onConflict:
          'user_id,client_id',
      })

    if (error) throw error
  }

  const { error: settingsError } =
    await client
      .from('user_settings')
      .upsert(
        {
          user_id: userId,
          theme:
            snapshot.settings.theme,
          custom_theme_pack:
            snapshot.settings.customThemePack,
          language:
            snapshot.settings.language,
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
          workspace_preferences_version: 1,
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

export async function saveSupabaseMutations(
  snapshot: FocusDataSnapshot,
  userId: string,
  changes: OfflineMutationState,
): Promise<void> {
  if (!userId) {
    throw new Error('No authenticated user')
  }

  const client = requireSupabase()
  const now = new Date().toISOString()

  const changedSubjectIds =
    new Set(changes.subjectIds)
  const changedSessionIds =
    new Set(changes.sessionIds)
  const changedAdvancedGoalIds =
    new Set(
      changes.advancedGoalIds,
    )

  const subjectRows = snapshot.subjects
    .filter((subject) =>
      changedSubjectIds.has(
        subject.id,
      ),
    )
    .map((subject) => ({
      client_id: subject.id,
      user_id: userId,
      name: subject.name,
      color: subject.color,
      icon: subject.icon ?? null,
      updated_at: now,
    }))

  if (subjectRows.length > 0) {
    const { error } = await client
      .from('subjects')
      .upsert(subjectRows, {
        onConflict:
          'user_id,client_id',
      })

    if (error) throw error
  }

  if (changedSessionIds.size > 0) {
    const {
      data: subjectRowsForSessions,
      error: subjectReadError,
    } = await client
      .from('subjects')
      .select('id, client_id')
      .eq('user_id', userId)

    if (subjectReadError) {
      throw subjectReadError
    }

    const cloudSubjectByClientId =
      new Map<string, string>()

    for (
      const row of
        (subjectRowsForSessions ??
          []) as Array<{
          id: string
          client_id: string | null
        }>
    ) {
      cloudSubjectByClientId.set(
        row.id,
        row.id,
      )

      if (row.client_id) {
        cloudSubjectByClientId.set(
          row.client_id,
          row.id,
        )
      }
    }

    const sessionRows =
      snapshot.sessions
        .filter((session) =>
          changedSessionIds.has(
            session.id,
          ),
        )
        .map((session) => {
          const cloudSubjectId =
            cloudSubjectByClientId.get(
              session.subjectId,
            )

          if (!cloudSubjectId) {
            throw new Error(
              `Cannot sync session ${session.id}: subject is not available in cloud.`,
            )
          }

          return {
            client_id: session.id,
            user_id: userId,
            subject_id:
              cloudSubjectId,
            planned_seconds:
              Math.max(
                0,
                Math.round(
                  session.duration,
                ),
              ),
            actual_seconds:
              Math.max(
                0,
                Math.round(
                  session.actualDuration,
                ),
              ),
            started_at:
              new Date(
                session.startedAt ??
                  session.completedAt,
              ).toISOString(),
            completed_at:
              new Date(
                session.completedAt,
              ).toISOString(),
            completed:
              session.completed,
            interruptions:
              Math.max(
                0,
                session.interruptions,
              ),
            total_paused_seconds:
              Math.max(
                0,
                session.totalPausedSeconds,
              ),
            notes:
              session.notes ?? null,
            subtasks:
              session.subtasks ?? [],
            routine_item_client_id:
              session.routineItemId ?? null,
            routine_date:
              session.routineDate ?? null,
            updated_at: now,
          }
        })

    if (sessionRows.length > 0) {
      const { error } = await client
        .from('study_sessions')
        .upsert(sessionRows, {
          onConflict:
            'user_id,client_id',
        })

      if (error) throw error
    }
  }

  if (
    changes.dailyGoal ||
    changes.weeklyGoal
  ) {
    const {
      data: existingGoals,
      error: goalReadError,
    } = await client
      .from('goals')
      .select('id')
      .eq('user_id', userId)
      .order('effective_from', {
        ascending: false,
      })
      .limit(1)

    if (goalReadError) {
      throw goalReadError
    }

    if (existingGoals?.[0]?.id) {
      const goalPatch: Record<
        string,
        unknown
      > = {
        effective_from:
          dateOnly(new Date()),
        updated_at: now,
      }

      if (changes.dailyGoal) {
        goalPatch.daily_minutes =
          Math.max(
            0,
            Math.round(
              snapshot.dailyGoal,
            ),
          )
      }

      if (changes.weeklyGoal) {
        goalPatch.weekly_minutes =
          Math.max(
            0,
            Math.round(
              snapshot.weeklyGoal,
            ),
          )
      }

      const { error } = await client
        .from('goals')
        .update(goalPatch)
        .eq(
          'id',
          existingGoals[0].id,
        )
        .eq('user_id', userId)

      if (error) throw error
    } else {
      const { error } = await client
        .from('goals')
        .insert({
          user_id: userId,
          daily_minutes:
            Math.max(
              0,
              Math.round(
                snapshot.dailyGoal,
              ),
            ),
          weekly_minutes:
            Math.max(
              0,
              Math.round(
                snapshot.weeklyGoal,
              ),
            ),
          effective_from:
            dateOnly(new Date()),
          updated_at: now,
        })

      if (error) throw error
    }
  }

  for (
    const weekStart of
      changes.weeklyHistoryKeys
  ) {
    const goalMinutes =
      snapshot.weeklyGoalsHistory[
        weekStart
      ]

    if (goalMinutes === undefined) {
      const { error } = await client
        .from(
          'weekly_goal_history',
        )
        .delete()
        .eq('user_id', userId)
        .eq(
          'week_start',
          weekStart,
        )

      if (error) throw error
      continue
    }

    const { error } = await client
      .from('weekly_goal_history')
      .upsert(
        {
          user_id: userId,
          week_start:
            weekStart,
          goal_minutes:
            Math.max(
              0,
              Math.round(
                goalMinutes,
              ),
            ),
          achieved_minutes: 0,
          updated_at: now,
        },
        {
          onConflict:
            'user_id,week_start',
        },
      )

    if (error) throw error
  }

  const advancedGoalRows =
    snapshot.advancedGoals
      .filter((goal) =>
        changedAdvancedGoalIds.has(
          goal.id,
        ),
      )
      .map((goal) => ({
        client_id: goal.id,
        user_id: userId,
        title:
          goal.title.trim(),
        subject_client_id:
          goal.subjectId ?? null,
        target_minutes:
          Math.max(
            1,
            Math.round(
              goal.targetMinutes,
            ),
          ),
        deadline:
          new Date(
            goal.deadline,
          ).toISOString(),
        priority:
          goal.priority,
        status:
          goal.status,
        created_at:
          goal.createdAt,
        updated_at: now,
      }))

  if (
    advancedGoalRows.length > 0
  ) {
    const { error } = await client
      .from('advanced_goals')
      .upsert(
        advancedGoalRows,
        {
          onConflict:
            'user_id,client_id',
        },
      )

    if (error) throw error
  }

  const routineRows =
    snapshot.routineItems
      .filter((item) =>
        changes.routineItemIds.includes(
          item.id,
        ),
      )
      .map((item) => ({
        client_id: item.id,
        user_id: userId,
        title:
          item.title.trim(),
        subject_client_id:
          item.subjectId,
        target_minutes:
          Math.max(
            1,
            Math.round(
              item.targetMinutes,
            ),
          ),
        mode: item.mode,
        rotation_order:
          Math.max(
            0,
            Math.round(
              item.rotationOrder,
            ),
          ),
        days_of_week:
          item.daysOfWeek.length > 0
            ? Array.from(
                new Set(
                  item.daysOfWeek.filter(
                    (day) =>
                      Number.isInteger(day) &&
                      day >= 0 &&
                      day <= 6,
                  ),
                ),
              )
            : [0, 1, 2, 3, 4, 5, 6],
        recovery_days:
          Math.max(
            0,
            Math.min(
              3,
              Math.round(
                item.recoveryDays,
              ),
            ),
          ),
        enabled:
          item.enabled,
        created_at:
          item.createdAt,
        updated_at: now,
      }))

  if (routineRows.length > 0) {
    const { error } = await client
      .from('routine_items')
      .upsert(
        routineRows,
        {
          onConflict:
            'user_id,client_id',
        },
      )

    if (error) throw error
  }

  if (
    changes.settingsKeys.length >
    0
  ) {
    const {
      data: existingSettings,
      error:
        settingsReadError,
    } = await client
      .from('user_settings')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle()

    if (settingsReadError) {
      throw settingsReadError
    }

    if (!existingSettings) {
      const { error } = await client
        .from('user_settings')
        .insert({
          user_id: userId,
          theme:
            snapshot.settings.theme,
          custom_theme_pack:
            snapshot.settings.customThemePack,
          language:
            snapshot.settings.language,
          short_break_minutes:
            snapshot.settings
              .shortBreak,
          long_break_minutes:
            snapshot.settings
              .longBreak,
          sessions_before_long_break:
            snapshot.settings
              .sessionsBeforeLongBreak,
          sound_enabled:
            snapshot.settings
              .soundEnabled,
          volume:
            snapshot.settings
              .soundVolume,
          notifications_enabled:
            snapshot.settings
              .notificationsEnabled,
          auto_start_break:
            snapshot.settings
              .autoStartBreak,
          workspace_preferences_version:
            1,
          updated_at: now,
        })

      if (error) throw error
    } else {
      const settingsPatch: Record<
        string,
        unknown
      > = {
        workspace_preferences_version:
          1,
        updated_at: now,
      }

      for (
        const key of
          changes.settingsKeys
      ) {
        switch (key) {
          case 'theme':
            settingsPatch.theme =
              snapshot.settings.theme
            break
          case 'customThemePack':
            settingsPatch.custom_theme_pack =
              snapshot.settings.customThemePack
            break
          case 'language':
            settingsPatch.language =
              snapshot.settings.language
            break
          case 'shortBreak':
            settingsPatch.short_break_minutes =
              snapshot.settings.shortBreak
            break
          case 'longBreak':
            settingsPatch.long_break_minutes =
              snapshot.settings.longBreak
            break
          case 'sessionsBeforeLongBreak':
            settingsPatch.sessions_before_long_break =
              snapshot.settings
                .sessionsBeforeLongBreak
            break
          case 'autoStartBreak':
            settingsPatch.auto_start_break =
              snapshot.settings
                .autoStartBreak
            break
          case 'soundEnabled':
            settingsPatch.sound_enabled =
              snapshot.settings
                .soundEnabled
            break
          case 'soundVolume':
            settingsPatch.volume =
              snapshot.settings
                .soundVolume
            break
          case 'notificationsEnabled':
            settingsPatch.notifications_enabled =
              snapshot.settings
                .notificationsEnabled
            break
        }
      }

      const { error } = await client
        .from('user_settings')
        .update(settingsPatch)
        .eq('user_id', userId)

      if (error) throw error
    }
  }
}

export async function replaceSupabaseSnapshot(
  snapshot: FocusDataSnapshot,
  userId: string,
): Promise<void> {
  const client = requireSupabase()
  const now = new Date().toISOString()

  const [
    subjectsResult,
    sessionsResult,
    advancedGoalsResult,
    routineItemsResult,
  ] = await Promise.all([
    client
      .from('subjects')
      .select('id, client_id, archived_at')
      .eq('user_id', userId),
    client
      .from('study_sessions')
      .select('id, client_id, deleted_at')
      .eq('user_id', userId),
    client
      .from('advanced_goals')
      .select('id, client_id, deleted_at')
      .eq('user_id', userId),
    client
      .from('routine_items')
      .select('id, client_id, deleted_at')
      .eq('user_id', userId),
  ])

  if (subjectsResult.error) {
    throw subjectsResult.error
  }
  if (sessionsResult.error) {
    throw sessionsResult.error
  }
  if (advancedGoalsResult.error) {
    throw advancedGoalsResult.error
  }
  if (routineItemsResult.error) {
    throw routineItemsResult.error
  }

  const importedSubjectIds =
    new Set(
      snapshot.subjects.map(
        (subject) => subject.id,
      ),
    )
  const importedSessionIds =
    new Set(
      snapshot.sessions.map(
        (session) => session.id,
      ),
    )
  const importedGoalIds =
    new Set(
      snapshot.advancedGoals.map(
        (goal) => goal.id,
      ),
    )
  const importedRoutineIds =
    new Set(
      snapshot.routineItems.map(
        (item) => item.id,
      ),
    )

  const staleSubjectIds =
    (
      subjectsResult.data ?? []
    )
      .filter(
        (row) =>
          !row.archived_at &&
          (
            !row.client_id ||
            !importedSubjectIds.has(
              row.client_id,
            )
          ),
      )
      .map((row) => row.id)

  if (staleSubjectIds.length > 0) {
    const { error } = await client
      .from('subjects')
      .update({
        archived_at: now,
        updated_at: now,
      })
      .eq('user_id', userId)
      .in('id', staleSubjectIds)

    if (error) throw error
  }

  const staleSessionIds =
    (
      sessionsResult.data ?? []
    )
      .filter(
        (row) =>
          !row.deleted_at &&
          (
            !row.client_id ||
            !importedSessionIds.has(
              row.client_id,
            )
          ),
      )
      .map((row) => row.id)

  if (staleSessionIds.length > 0) {
    const { error } = await client
      .from('study_sessions')
      .update({
        deleted_at: now,
        updated_at: now,
      })
      .eq('user_id', userId)
      .in('id', staleSessionIds)

    if (error) throw error
  }

  const staleGoalIds =
    (
      advancedGoalsResult.data ?? []
    )
      .filter(
        (row) =>
          !row.deleted_at &&
          (
            !row.client_id ||
            !importedGoalIds.has(
              row.client_id,
            )
          ),
      )
      .map((row) => row.id)

  if (staleGoalIds.length > 0) {
    const { error } = await client
      .from('advanced_goals')
      .update({
        deleted_at: now,
        updated_at: now,
      })
      .eq('user_id', userId)
      .in('id', staleGoalIds)

    if (error) throw error
  }

  const staleRoutineIds =
    (
      routineItemsResult.data ?? []
    )
      .filter(
        (row) =>
          !row.deleted_at &&
          (
            !row.client_id ||
            !importedRoutineIds.has(
              row.client_id,
            )
          ),
      )
      .map((row) => row.id)

  if (staleRoutineIds.length > 0) {
    const { error } = await client
      .from('routine_items')
      .update({
        deleted_at: now,
        updated_at: now,
      })
      .eq('user_id', userId)
      .in('id', staleRoutineIds)

    if (error) throw error
  }

  const subjectIds =
    Array.from(importedSubjectIds)

  if (subjectIds.length > 0) {
    const { error } = await client
      .from('subjects')
      .update({
        archived_at: null,
        updated_at: now,
      })
      .eq('user_id', userId)
      .in('client_id', subjectIds)

    if (error) throw error
  }

  const sessionIds =
    Array.from(importedSessionIds)

  if (sessionIds.length > 0) {
    const { error } = await client
      .from('study_sessions')
      .update({
        deleted_at: null,
        updated_at: now,
      })
      .eq('user_id', userId)
      .in('client_id', sessionIds)

    if (error) throw error
  }

  const routineIds =
    Array.from(importedRoutineIds)

  if (routineIds.length > 0) {
    const { error } = await client
      .from('routine_items')
      .update({
        deleted_at: null,
        updated_at: now,
      })
      .eq('user_id', userId)
      .in('client_id', routineIds)

    if (error) throw error
  }

  const goalIds =
    Array.from(importedGoalIds)

  if (goalIds.length > 0) {
    const { error } = await client
      .from('advanced_goals')
      .update({
        deleted_at: null,
        updated_at: now,
      })
      .eq('user_id', userId)
      .in('client_id', goalIds)

    if (error) throw error
  }

  await saveSupabaseSnapshot(
    snapshot,
    userId,
  )
}

export async function deleteSupabaseAdvancedGoal(
  userId: string,
  clientId: string,
): Promise<void> {
  const client = requireSupabase()
  const now = new Date().toISOString()

  const { error } = await client
    .from('advanced_goals')
    .update({
      deleted_at: now,
      updated_at: now,
    })
    .eq('user_id', userId)
    .eq('client_id', clientId)

  if (error) {
    throw error
  }
}

export async function deleteSupabaseRoutineItem(
  userId: string,
  clientId: string,
): Promise<void> {
  const client = requireSupabase()
  const now = new Date().toISOString()

  const { error } = await client
    .from('routine_items')
    .update({
      deleted_at: now,
      updated_at: now,
    })
    .eq('user_id', userId)
    .eq('client_id', clientId)

  if (error) {
    throw error
  }
}

export async function deleteSupabaseSession(
  userId: string,
  clientId: string,
): Promise<void> {
  const client = requireSupabase()
  const now = new Date().toISOString()

  const { error } = await client
    .from('study_sessions')
    .update({
      deleted_at: now,
      updated_at: now,
    })
    .eq('user_id', userId)
    .eq('client_id', clientId)

  if (error) {
    throw error
  }
}

export async function deleteSupabaseSubject(
  userId: string,
  clientId: string,
): Promise<void> {
  const client = requireSupabase()
  const now = new Date().toISOString()

  const { error } =
    await client
      .from('subjects')
      .update({
        archived_at: now,
        updated_at: now,
      })
      .eq('user_id', userId)
      .eq('client_id', clientId)

  if (error) {
    throw error
  }
}
