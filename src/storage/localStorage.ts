import { subjects as defaultSubjects } from "../data/subjects"
import type { Subject, StudySession } from "../types"
import { type WeeklyGoalMap } from "../utils/goalHistory"
import { defaultSettings, normalizeSettings, type AppSettings } from "../app/settings"
import type { AdvancedGoal, FocusDataSnapshot, FocusDataStore, RoutineItem } from "./types"

export const STORAGE_KEY = "focus-sessions"
export const SUBJECTS_KEY = "focus-subjects"
export const GOAL_KEY = "focus-daily-goal"
export const WEEKLY_GOAL_KEY = "focus-weekly-goal"
export const WEEKLY_GOALS_HISTORY_KEY = "focus-weekly-goals-history"
export const ADVANCED_GOALS_KEY = "focus-advanced-goals"
export const ROUTINE_ITEMS_KEY = "focus-routine-items"
export const ACTIVE_SUBJECT_KEY = "focus-active-subject"
export const SETTINGS_KEY = "focus-settings"
const ACCOUNT_SNAPSHOT_PREFIX =
  "focus-account-snapshot:"

export function loadSessions(): StudySession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.map((session: StudySession) => ({
      ...session,
      startedAt: session.startedAt
        ? new Date(session.startedAt)
        : undefined,
      completedAt: new Date(session.completedAt),
      totalPausedSeconds: session.totalPausedSeconds ?? 0,
    }))
  } catch { return [] }
}

export function loadSubjects(): Subject[] {
  try {
    const raw = localStorage.getItem(SUBJECTS_KEY)
    if (!raw) return defaultSubjects
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return defaultSubjects
    return parsed as Subject[]
  } catch { return defaultSubjects }
}

function loadPositiveNumber(key: string, fallback: number): number {
  try {
    const value = Number(localStorage.getItem(key))
    return Number.isFinite(value) && value > 0 ? value : fallback
  } catch { return fallback }
}

export function loadDailyGoal(): number { return loadPositiveNumber(GOAL_KEY, 120) }
export function loadWeeklyGoal(): number { return loadPositiveNumber(WEEKLY_GOAL_KEY, 600) }

export function loadWeeklyGoalsHistory(): WeeklyGoalMap {
  try {
    const raw = localStorage.getItem(WEEKLY_GOALS_HISTORY_KEY)
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {}
    const result: WeeklyGoalMap = {}
    Object.entries(parsed as Record<string, unknown>).forEach(([weekKey, value]) => {
      if (typeof value === "number" && Number.isFinite(value) && value > 0) result[weekKey] = value
    })
    return result
  } catch { return {} }
}

export function loadAdvancedGoals(): AdvancedGoal[] {
  try {
    const raw = localStorage.getItem(ADVANCED_GOALS_KEY)
    if (!raw) return []

    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return parsed.filter((goal): goal is AdvancedGoal => {
      if (!goal || typeof goal !== "object") return false
      const value = goal as Record<string, unknown>

      return (
        typeof value.id === "string" &&
        typeof value.title === "string" &&
        (value.subjectId === undefined ||
          typeof value.subjectId === "string") &&
        typeof value.targetMinutes === "number" &&
        Number.isFinite(value.targetMinutes) &&
        value.targetMinutes > 0 &&
        typeof value.deadline === "string" &&
        (value.priority === "low" ||
          value.priority === "medium" ||
          value.priority === "high") &&
        (value.status === "active" ||
          value.status === "completed") &&
        typeof value.createdAt === "string"
      )
    })
  } catch {
    return []
  }
}

export function loadRoutineItems(): RoutineItem[] {
  try {
    const raw = localStorage.getItem(
      ROUTINE_ITEMS_KEY,
    )
    if (!raw) return []

    const parsed: unknown =
      JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.flatMap(
      (candidate): RoutineItem[] => {
        if (
          !candidate ||
          typeof candidate !== "object" ||
          Array.isArray(candidate)
        ) {
          return []
        }

        const value =
          candidate as Record<
            string,
            unknown
          >

        const id =
          typeof value.id === "string"
            ? value.id.trim()
            : ""
        const title =
          typeof value.title === "string"
            ? value.title.trim()
            : ""
        const subjectId =
          typeof value.subjectId === "string"
            ? value.subjectId.trim()
            : ""
        const targetMinutes =
          typeof value.targetMinutes === "number" &&
          Number.isFinite(
            value.targetMinutes,
          )
            ? Math.max(
                1,
                Math.round(
                  value.targetMinutes,
                ),
              )
            : 25
        const mode =
          value.mode === "rotation"
            ? "rotation"
            : "fixed"
        const rotationOrder =
          typeof value.rotationOrder === "number" &&
          Number.isFinite(
            value.rotationOrder,
          )
            ? Math.max(
                0,
                Math.round(
                  value.rotationOrder,
                ),
              )
            : 0
        const createdAt =
          typeof value.createdAt === "string" &&
          !Number.isNaN(
            new Date(
              value.createdAt,
            ).getTime(),
          )
            ? new Date(
                value.createdAt,
              ).toISOString()
            : new Date(0).toISOString()

        if (
          !id ||
          !title ||
          !subjectId
        ) {
          return []
        }

        return [{
          id,
          title,
          subjectId,
          targetMinutes,
          mode,
          rotationOrder,
          enabled:
            value.enabled !== false,
          createdAt,
        }]
      },
    )
  } catch {
    return []
  }
}

export function loadActiveSubject(): string | null {
  try { return localStorage.getItem(ACTIVE_SUBJECT_KEY) } catch { return null }
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : {}

    if (
      !parsed ||
      typeof parsed !== "object" ||
      Array.isArray(parsed)
    ) {
      return defaultSettings
    }

    const stored =
      parsed as Partial<AppSettings>

    const legacyTheme =
      localStorage.getItem("focus-theme")
    const legacyLanguage =
      localStorage.getItem("focus-language")

    return normalizeSettings({
      ...stored,
      theme:
        stored.theme ??
        (legacyTheme === "dark" ||
        legacyTheme === "light" ||
        legacyTheme === "system"
          ? legacyTheme
          : undefined),
      language:
        stored.language ??
        (legacyLanguage === "ku"
          ? "ku"
          : legacyLanguage === "en"
            ? "en"
            : undefined),
    })
  } catch {
    return defaultSettings
  }
}

export function saveSessions(sessions: StudySession[]) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions)) } catch { /* Ignore storage errors. */ } }
export function saveSubjects(subjects: Subject[]) { try { localStorage.setItem(SUBJECTS_KEY, JSON.stringify(subjects)) } catch { /* Ignore storage errors. */ } }
export function saveDailyGoal(goal: number) { try { localStorage.setItem(GOAL_KEY, String(goal)) } catch { /* Ignore storage errors. */ } }
export function saveWeeklyGoal(goal: number) { try { localStorage.setItem(WEEKLY_GOAL_KEY, String(goal)) } catch { /* Ignore storage errors. */ } }
export function saveWeeklyGoalsHistory(goals: WeeklyGoalMap) { try { localStorage.setItem(WEEKLY_GOALS_HISTORY_KEY, JSON.stringify(goals)) } catch { /* Ignore storage errors. */ } }
export function saveAdvancedGoals(goals: AdvancedGoal[]) { try { localStorage.setItem(ADVANCED_GOALS_KEY, JSON.stringify(goals)) } catch { /* Ignore storage errors. */ } }
export function saveRoutineItems(items: RoutineItem[]) { try { localStorage.setItem(ROUTINE_ITEMS_KEY, JSON.stringify(items)) } catch { /* Ignore storage errors. */ } }
export function saveActiveSubject(id: string | null) {
  try { if (id) localStorage.setItem(ACTIVE_SUBJECT_KEY, id); else localStorage.removeItem(ACTIVE_SUBJECT_KEY) } catch { /* Ignore storage errors. */ }
}
export function saveSettings(settings: AppSettings) { try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)) } catch { /* Ignore storage errors. */ } }

function normalizeSnapshotRecord(
  value: unknown,
): FocusDataSnapshot | null {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return null
  }

  const data =
    value as Record<string, unknown>

  if (
    !Array.isArray(data.sessions) ||
    !Array.isArray(data.subjects)
  ) {
    return null
  }

  const sessions =
    data.sessions.flatMap(
      (candidate): StudySession[] => {
        if (
          !candidate ||
          typeof candidate !== "object" ||
          Array.isArray(candidate)
        ) {
          return []
        }

        const session =
          candidate as StudySession
        const completedAt =
          new Date(
            session.completedAt,
          )
        const startedAt =
          session.startedAt
            ? new Date(
                session.startedAt,
              )
            : undefined

        if (
          Number.isNaN(
            completedAt.getTime(),
          ) ||
          (startedAt &&
            Number.isNaN(
              startedAt.getTime(),
            ))
        ) {
          return []
        }

        return [{
          ...session,
          startedAt,
          completedAt,
          totalPausedSeconds:
            session.totalPausedSeconds ??
            0,
        }]
      },
    )

  const subjects =
    data.subjects.filter(
      (subject): subject is Subject =>
        Boolean(
          subject &&
            typeof subject === "object" &&
            !Array.isArray(subject) &&
            typeof (
              subject as Subject
            ).id === "string" &&
            typeof (
              subject as Subject
            ).name === "string" &&
            typeof (
              subject as Subject
            ).color === "string",
        ),
    )

  const weeklyGoalsHistory: WeeklyGoalMap =
    {}

  if (
    data.weeklyGoalsHistory &&
    typeof data.weeklyGoalsHistory ===
      "object" &&
    !Array.isArray(
      data.weeklyGoalsHistory,
    )
  ) {
    for (
      const [weekKey, goal] of
      Object.entries(
        data.weeklyGoalsHistory as Record<
          string,
          unknown
        >,
      )
    ) {
      if (
        typeof goal === "number" &&
        Number.isFinite(goal) &&
        goal > 0
      ) {
        weeklyGoalsHistory[
          weekKey
        ] = goal
      }
    }
  }

  const advancedGoals =
    Array.isArray(
      data.advancedGoals,
    )
      ? data.advancedGoals.filter(
          (
            goal,
          ): goal is AdvancedGoal => {
            if (
              !goal ||
              typeof goal !==
                "object" ||
              Array.isArray(goal)
            ) {
              return false
            }

            const item =
              goal as Record<
                string,
                unknown
              >

            return (
              typeof item.id ===
                "string" &&
              typeof item.title ===
                "string" &&
              (item.subjectId ===
                undefined ||
                typeof item.subjectId ===
                  "string") &&
              typeof item.targetMinutes ===
                "number" &&
              Number.isFinite(
                item.targetMinutes,
              ) &&
              item.targetMinutes > 0 &&
              typeof item.deadline ===
                "string" &&
              (item.priority ===
                "low" ||
                item.priority ===
                  "medium" ||
                item.priority ===
                  "high") &&
              (item.status ===
                "active" ||
                item.status ===
                  "completed") &&
              typeof item.createdAt ===
                "string"
            )
          },
        )
      : []

  const routineItems =
    Array.isArray(
      data.routineItems,
    )
      ? data.routineItems.flatMap(
          (
            candidate,
          ): RoutineItem[] => {
            if (
              !candidate ||
              typeof candidate !==
                "object" ||
              Array.isArray(candidate)
            ) {
              return []
            }

            const item =
              candidate as Record<
                string,
                unknown
              >
            const id =
              typeof item.id ===
              "string"
                ? item.id.trim()
                : ""
            const title =
              typeof item.title ===
              "string"
                ? item.title.trim()
                : ""
            const subjectId =
              typeof item.subjectId ===
              "string"
                ? item.subjectId.trim()
                : ""
            const targetMinutes =
              typeof item.targetMinutes ===
                "number" &&
              Number.isFinite(
                item.targetMinutes,
              )
                ? Math.max(
                    1,
                    Math.round(
                      item.targetMinutes,
                    ),
                  )
                : 25
            const rotationOrder =
              typeof item.rotationOrder ===
                "number" &&
              Number.isFinite(
                item.rotationOrder,
              )
                ? Math.max(
                    0,
                    Math.round(
                      item.rotationOrder,
                    ),
                  )
                : 0
            const createdAt =
              typeof item.createdAt ===
                "string" &&
              !Number.isNaN(
                new Date(
                  item.createdAt,
                ).getTime(),
              )
                ? new Date(
                    item.createdAt,
                  ).toISOString()
                : new Date(0).toISOString()

            if (
              !id ||
              !title ||
              !subjectId
            ) {
              return []
            }

            return [{
              id,
              title,
              subjectId,
              targetMinutes,
              mode:
                item.mode ===
                "rotation"
                  ? "rotation"
                  : "fixed",
              rotationOrder,
              enabled:
                item.enabled !==
                false,
              createdAt,
            }]
          },
        )
      : []

  const positiveNumber = (
    input: unknown,
    fallback: number,
  ) =>
    typeof input === "number" &&
    Number.isFinite(input) &&
    input > 0
      ? input
      : fallback

  return {
    sessions,
    subjects,
    dailyGoal:
      positiveNumber(
        data.dailyGoal,
        120,
      ),
    weeklyGoal:
      positiveNumber(
        data.weeklyGoal,
        600,
      ),
    weeklyGoalsHistory,
    advancedGoals,
    routineItems,
    activeSubjectId:
      typeof data.activeSubjectId ===
        "string" &&
      subjects.some(
        (subject) =>
          subject.id ===
          data.activeSubjectId,
      )
        ? data.activeSubjectId
        : null,
    settings:
      normalizeSettings(
        data.settings &&
          typeof data.settings ===
            "object" &&
          !Array.isArray(
            data.settings,
          )
          ? data.settings as Partial<AppSettings>
          : null,
      ),
    workspacePreferencesVersion:
      typeof data.workspacePreferencesVersion ===
        "number" &&
      Number.isFinite(
        data.workspacePreferencesVersion,
      ) &&
      data.workspacePreferencesVersion >=
        0
        ? Math.floor(
            data.workspacePreferencesVersion,
          )
        : 1,
  }
}

export function loadAccountSnapshot(
  userId: string,
): FocusDataSnapshot | null {
  try {
    const raw =
      localStorage.getItem(
        `${ACCOUNT_SNAPSHOT_PREFIX}${userId}`,
      )

    if (!raw) {
      return null
    }

    return normalizeSnapshotRecord(
      JSON.parse(raw) as unknown,
    )
  } catch {
    return null
  }
}

export function saveAccountSnapshot(
  userId: string,
  snapshot: FocusDataSnapshot,
): void {
  try {
    localStorage.setItem(
      `${ACCOUNT_SNAPSHOT_PREFIX}${userId}`,
      JSON.stringify(snapshot),
    )
  } catch {
    // Account cache is best-effort.
  }
}

export const localStorageStore: FocusDataStore = {
  load(): FocusDataSnapshot {
    return {
      sessions: loadSessions(),
      subjects: loadSubjects(),
      dailyGoal: loadDailyGoal(),
      weeklyGoal: loadWeeklyGoal(),
      weeklyGoalsHistory: loadWeeklyGoalsHistory(),
      advancedGoals: loadAdvancedGoals(),
      routineItems: loadRoutineItems(),
      activeSubjectId: loadActiveSubject(),
      settings: loadSettings(),
      workspacePreferencesVersion: 1,
    }
  },
  save(snapshot) {
    saveSessions(snapshot.sessions)
    saveSubjects(snapshot.subjects)
    saveDailyGoal(snapshot.dailyGoal)
    saveWeeklyGoal(snapshot.weeklyGoal)
    saveWeeklyGoalsHistory(snapshot.weeklyGoalsHistory)
    saveAdvancedGoals(snapshot.advancedGoals)
    saveRoutineItems(snapshot.routineItems)
    saveActiveSubject(snapshot.activeSubjectId)
    saveSettings(snapshot.settings)
  },
}
