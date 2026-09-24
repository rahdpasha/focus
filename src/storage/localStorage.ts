import { subjects as defaultSubjects } from "../data/subjects"
import type { Subject, StudySession } from "../types"
import { type WeeklyGoalMap } from "../utils/goalHistory"
import { defaultSettings, normalizeSettings, type AppSettings } from "../app/settings"
import type { AdvancedGoal, FocusDataSnapshot, FocusDataStore } from "./types"

export const STORAGE_KEY = "focus-sessions"
export const SUBJECTS_KEY = "focus-subjects"
export const GOAL_KEY = "focus-daily-goal"
export const WEEKLY_GOAL_KEY = "focus-weekly-goal"
export const WEEKLY_GOALS_HISTORY_KEY = "focus-weekly-goals-history"
export const ADVANCED_GOALS_KEY = "focus-advanced-goals"
export const ACTIVE_SUBJECT_KEY = "focus-active-subject"
export const SETTINGS_KEY = "focus-settings"

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
export function saveActiveSubject(id: string | null) {
  try { if (id) localStorage.setItem(ACTIVE_SUBJECT_KEY, id); else localStorage.removeItem(ACTIVE_SUBJECT_KEY) } catch { /* Ignore storage errors. */ }
}
export function saveSettings(settings: AppSettings) { try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)) } catch { /* Ignore storage errors. */ } }

export const localStorageStore: FocusDataStore = {
  load(): FocusDataSnapshot {
    return {
      sessions: loadSessions(),
      subjects: loadSubjects(),
      dailyGoal: loadDailyGoal(),
      weeklyGoal: loadWeeklyGoal(),
      weeklyGoalsHistory: loadWeeklyGoalsHistory(),
      advancedGoals: loadAdvancedGoals(),
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
    saveActiveSubject(snapshot.activeSubjectId)
    saveSettings(snapshot.settings)
  },
}
