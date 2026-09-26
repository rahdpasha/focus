import type { AppSettings } from '../app/settings'
import type { FocusDataSnapshot } from './types'

const OFFLINE_SYNC_KEY_PREFIX =
  'focus-offline-sync:'

export interface OfflineMutationState {
  subjectIds: string[]
  sessionIds: string[]
  advancedGoalIds: string[]
  routineItemIds: string[]
  deletedSubjectIds: string[]
  deletedSessionIds: string[]
  deletedAdvancedGoalIds: string[]
  deletedRoutineItemIds: string[]
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
    routineItemIds: [],
    deletedSubjectIds: [],
    deletedSessionIds: [],
    deletedAdvancedGoalIds: [],
    deletedRoutineItemIds: [],
    settingsKeys: [],
    weeklyHistoryKeys: [],
    dailyGoal: false,
    weeklyGoal: false,
    replaceWorkspace: false,
  }
}

export function cloneOfflineMutationState(
  state: OfflineMutationState,
): OfflineMutationState {
  return {
    subjectIds: [...state.subjectIds],
    sessionIds: [...state.sessionIds],
    advancedGoalIds: [
      ...state.advancedGoalIds,
    ],
    routineItemIds: [
      ...state.routineItemIds,
    ],
    deletedSubjectIds: [
      ...state.deletedSubjectIds,
    ],
    deletedSessionIds: [
      ...state.deletedSessionIds,
    ],
    deletedAdvancedGoalIds: [
      ...state.deletedAdvancedGoalIds,
    ],
    deletedRoutineItemIds: [
      ...state.deletedRoutineItemIds,
    ],
    settingsKeys: [
      ...state.settingsKeys,
    ],
    weeklyHistoryKeys: [
      ...state.weeklyHistoryKeys,
    ],
    dailyGoal: state.dailyGoal,
    weeklyGoal: state.weeklyGoal,
    replaceWorkspace:
      state.replaceWorkspace,
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
    state.routineItemIds.length > 0 ||
    state.deletedSubjectIds.length > 0 ||
    state.deletedSessionIds.length > 0 ||
    state.deletedAdvancedGoalIds.length > 0 ||
    state.deletedRoutineItemIds.length > 0 ||
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
      routineItemIds:
        stringArray(
          value.routineItemIds,
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
      deletedRoutineItemIds:
        stringArray(
          value.deletedRoutineItemIds,
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
  const deletedRoutineItemIds =
    new Set(
      changes.deletedRoutineItemIds,
    )

  const cloudSubjectByName =
    new Map(
      cloud.subjects.map(
        (subject) => [
          subject.name
            .trim()
            .toLocaleLowerCase(),
          subject,
        ],
      ),
    )

  const subjectIdAliases =
    new Map<string, string>()

  for (const subjectId of changes.subjectIds) {
    const localSubject =
      local.subjects.find(
        (subject) =>
          subject.id === subjectId,
      )

    if (!localSubject) {
      continue
    }

    const matchingCloudSubject =
      cloudSubjectByName.get(
        localSubject.name
          .trim()
          .toLocaleLowerCase(),
      )

    if (
      matchingCloudSubject &&
      matchingCloudSubject.id !==
        localSubject.id
    ) {
      subjectIdAliases.set(
        localSubject.id,
        matchingCloudSubject.id,
      )
    }
  }

  const subjects =
    mergeById(
      cloud.subjects,
      local.subjects.filter(
        (subject) =>
          !subjectIdAliases.has(
            subject.id,
          ),
      ),
      changes.subjectIds.filter(
        (id) =>
          !subjectIdAliases.has(id),
      ),
    ).filter(
      (subject) =>
        !deletedSubjectIds.has(
          subject.id,
        ),
    )

  const subjectById =
    new Map(
      subjects.map(
        (subject) => [
          subject.id,
          subject,
        ],
      ),
    )

  const remapSessionSubject = (
    session:
      FocusDataSnapshot['sessions'][number],
  ) => {
    const mappedSubjectId =
      subjectIdAliases.get(
        session.subjectId,
      )

    if (!mappedSubjectId) {
      return session
    }

    const subject =
      subjectById.get(
        mappedSubjectId,
      )

    return {
      ...session,
      subjectId: mappedSubjectId,
      subjectName:
        subject?.name ??
        session.subjectName,
      subjectColor:
        subject?.color ??
        session.subjectColor,
    }
  }

  const sessions =
    mergeById(
      cloud.sessions,
      local.sessions.map(
        remapSessionSubject,
      ),
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
      local.advancedGoals.map(
        (goal) => {
          if (!goal.subjectId) {
            return goal
          }

          const mappedSubjectId =
            subjectIdAliases.get(
              goal.subjectId,
            )

          return mappedSubjectId
            ? {
                ...goal,
                subjectId:
                  mappedSubjectId,
              }
            : goal
        },
      ),
      changes.advancedGoalIds,
    ).filter(
      (goal) =>
        !deletedAdvancedGoalIds.has(
          goal.id,
        ),
    )

  const routineItems =
    mergeById(
      cloud.routineItems,
      local.routineItems.map(
        (item) => {
          const mappedSubjectId =
            subjectIdAliases.get(
              item.subjectId,
            )

          return mappedSubjectId
            ? {
                ...item,
                subjectId:
                  mappedSubjectId,
              }
            : item
        },
      ),
      changes.routineItemIds,
    ).filter(
      (item) =>
        !deletedRoutineItemIds.has(
          item.id,
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

  const remappedLocalActiveSubjectId =
    local.activeSubjectId
      ? subjectIdAliases.get(
          local.activeSubjectId,
        ) ??
        local.activeSubjectId
      : null

  const activeSubjectId =
    remappedLocalActiveSubjectId &&
    subjects.some(
      (subject) =>
        subject.id ===
        remappedLocalActiveSubjectId,
    )
      ? remappedLocalActiveSubjectId
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
    routineItems,
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
