import type { AppSettings } from '../app/settings'
import type { FocusDataSnapshot } from './types'

const OFFLINE_SYNC_KEY_PREFIX =
  'focus-offline-sync:'

export interface OfflineMutationState {
  subjectIds: string[]
  sessionIds: string[]
  advancedGoalIds: string[]
  deletedSubjectIds: string[]
  deletedSessionIds: string[]
  deletedAdvancedGoalIds: string[]
  settingsKeys: Array<keyof AppSettings>
  weeklyHistoryKeys: string[]
  dailyGoal: boolean
  weeklyGoal: boolean
  replaceWorkspace: boolean
}

export function createOfflineMutationState(): OfflineMutationState {
  return {
    subjectIds: [],
    sessionIds: [],
    advancedGoalIds: [],
    deletedSubjectIds: [],
    deletedSessionIds: [],
    deletedAdvancedGoalIds: [],
    settingsKeys: [],
    weeklyHistoryKeys: [],
    dailyGoal: false,
    weeklyGoal: false,
    replaceWorkspace: false,
  }
}

export function hasOfflineMutations(
  state: OfflineMutationState,
): boolean {
  return (
    state.replaceWorkspace ||
    state.dailyGoal ||
    state.weeklyGoal ||
    state.subjectIds.length > 0 ||
    state.sessionIds.length > 0 ||
    state.advancedGoalIds.length > 0 ||
    state.deletedSubjectIds.length > 0 ||
    state.deletedSessionIds.length > 0 ||
    state.deletedAdvancedGoalIds.length > 0 ||
    state.settingsKeys.length > 0 ||
    state.weeklyHistoryKeys.length > 0
  )
}

export function addOfflineMutationId(
  values: string[],
  id: string,
): void {
  if (!values.includes(id)) {
    values.push(id)
  }
}

export function removeOfflineMutationId(
  values: string[],
  id: string,
): void {
  const index = values.indexOf(id)

  if (index >= 0) {
    values.splice(index, 1)
  }
}

export function loadOfflineMutationState(
  userId?: string,
): OfflineMutationState {
  if (!userId) {
    return createOfflineMutationState()
  }

  try {
    const raw = localStorage.getItem(
      `${OFFLINE_SYNC_KEY_PREFIX}${userId}`,
    )

    if (!raw) {
      return createOfflineMutationState()
    }

    const parsed: unknown = JSON.parse(raw)

    if (
      !parsed ||
      typeof parsed !== 'object' ||
      Array.isArray(parsed)
    ) {
      return createOfflineMutationState()
    }

    const value =
      parsed as Record<string, unknown>

    const stringArray = (
      input: unknown,
    ): string[] =>
      Array.isArray(input)
        ? Array.from(
            new Set(
              input.filter(
                (item): item is string =>
                  typeof item === 'string' &&
                  item.length > 0,
              ),
            ),
          )
        : []

    const settingsKeys =
      stringArray(value.settingsKeys).filter(
        (
          key,
        ): key is keyof AppSettings =>
          key === 'theme' ||
          key === 'language' ||
          key === 'shortBreak' ||
          key === 'longBreak' ||
          key === 'sessionsBeforeLongBreak' ||
          key === 'autoStartBreak' ||
          key === 'soundEnabled' ||
          key === 'soundVolume' ||
          key === 'notificationsEnabled',
      )

    return {
      subjectIds:
        stringArray(value.subjectIds),
      sessionIds:
        stringArray(value.sessionIds),
      advancedGoalIds:
        stringArray(
          value.advancedGoalIds,
        ),
      deletedSubjectIds:
        stringArray(
          value.deletedSubjectIds,
        ),
      deletedSessionIds:
        stringArray(
          value.deletedSessionIds,
        ),
      deletedAdvancedGoalIds:
        stringArray(
          value.deletedAdvancedGoalIds,
        ),
      settingsKeys,
      weeklyHistoryKeys:
        stringArray(
          value.weeklyHistoryKeys,
        ),
      dailyGoal:
        value.dailyGoal === true,
      weeklyGoal:
        value.weeklyGoal === true,
      replaceWorkspace:
        value.replaceWorkspace === true,
    }
  } catch {
    return createOfflineMutationState()
  }
}

export function saveOfflineMutationState(
  userId: string,
  state: OfflineMutationState,
): void {
  try {
    if (!hasOfflineMutations(state)) {
      localStorage.removeItem(
        `${OFFLINE_SYNC_KEY_PREFIX}${userId}`,
      )
      return
    }

    localStorage.setItem(
      `${OFFLINE_SYNC_KEY_PREFIX}${userId}`,
      JSON.stringify(state),
    )
  } catch {
    // Local persistence is best-effort.
  }
}

export function clearOfflineMutationState(
  userId?: string,
): void {
  if (!userId) return

  try {
    localStorage.removeItem(
      `${OFFLINE_SYNC_KEY_PREFIX}${userId}`,
    )
  } catch {
    // Local persistence is best-effort.
  }
}

function mergeById<T extends { id: string }>(
  cloudItems: T[],
  localItems: T[],
  changedIds: string[],
): T[] {
  const changed =
    new Set(changedIds)
  const localById =
    new Map(
      localItems.map(
        (item) => [
          item.id,
          item,
        ],
      ),
    )
  const merged =
    new Map(
      cloudItems.map(
        (item) => [
          item.id,
          item,
        ],
      ),
    )

  for (const id of changed) {
    const localItem =
      localById.get(id)

    if (localItem) {
      merged.set(
        id,
        localItem,
      )
    }
  }

  return Array.from(
    merged.values(),
  )
}

export function mergeOfflineMutations(
  cloud: FocusDataSnapshot,
  local: FocusDataSnapshot,
  changes: OfflineMutationState,
): FocusDataSnapshot {
  const deletedSubjectIds =
    new Set(
      changes.deletedSubjectIds,
    )
  const deletedSessionIds =
    new Set(
      changes.deletedSessionIds,
    )
  const deletedAdvancedGoalIds =
    new Set(
      changes.deletedAdvancedGoalIds,
    )

  const subjects =
    mergeById(
      cloud.subjects,
      local.subjects,
      changes.subjectIds,
    ).filter(
      (subject) =>
        !deletedSubjectIds.has(
          subject.id,
        ),
    )

  const sessions =
    mergeById(
      cloud.sessions,
      local.sessions,
      changes.sessionIds,
    ).filter(
      (session) =>
        !deletedSessionIds.has(
          session.id,
        ),
    )

  const advancedGoals =
    mergeById(
      cloud.advancedGoals,
      local.advancedGoals,
      changes.advancedGoalIds,
    ).filter(
      (goal) =>
        !deletedAdvancedGoalIds.has(
          goal.id,
        ),
    )

  const settings: AppSettings = {
    ...cloud.settings,
  }

  for (
    const key of changes.settingsKeys
  ) {
    Object.assign(
      settings,
      {
        [key]:
          local.settings[key],
      },
    )
  }

  const weeklyGoalsHistory = {
    ...cloud.weeklyGoalsHistory,
  }

  for (
    const weekKey of
      changes.weeklyHistoryKeys
  ) {
    const value =
      local.weeklyGoalsHistory[
        weekKey
      ]

    if (value === undefined) {
      delete weeklyGoalsHistory[
        weekKey
      ]
    } else {
      weeklyGoalsHistory[
        weekKey
      ] = value
    }
  }

  const activeSubjectId =
    local.activeSubjectId &&
    subjects.some(
      (subject) =>
        subject.id ===
        local.activeSubjectId,
    )
      ? local.activeSubjectId
      : cloud.activeSubjectId &&
          subjects.some(
            (subject) =>
              subject.id ===
              cloud.activeSubjectId,
          )
        ? cloud.activeSubjectId
        : subjects[0]?.id ?? null

  return {
    subjects,
    sessions,
    advancedGoals,
    activeSubjectId,
    dailyGoal:
      changes.dailyGoal
        ? local.dailyGoal
        : cloud.dailyGoal,
    weeklyGoal:
      changes.weeklyGoal
        ? local.weeklyGoal
        : cloud.weeklyGoal,
    weeklyGoalsHistory,
    settings,
    workspacePreferencesVersion:
      changes.settingsKeys.length > 0
        ? Math.max(
            1,
            cloud.workspacePreferencesVersion,
            local.workspacePreferencesVersion,
          )
        : cloud.workspacePreferencesVersion,
  }
}
