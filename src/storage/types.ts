import type { Subject, StudySession } from "../types"
import type { AppSettings } from "../app/settings"
import type { WeeklyGoalMap } from "../utils/goalHistory"

export type AdvancedGoalPriority = "low" | "medium" | "high"

export interface AdvancedGoal {
  id: string
  title: string
  subjectId?: string
  targetMinutes: number
  deadline: string
  priority: AdvancedGoalPriority
  status: "active" | "completed"
  createdAt: string
}

export interface RoutineItem {
  id: string
  title: string
  subjectId: string
  targetMinutes: number
  mode: "fixed" | "rotation"
  rotationOrder: number
  daysOfWeek: number[]
  recoveryDays: number
  enabled: boolean
  createdAt: string
}

export interface RoutineSessionContext {
  itemId: string
  routineDate: string
}

export interface FocusDataSnapshot {
  sessions: StudySession[]
  subjects: Subject[]
  dailyGoal: number
  weeklyGoal: number
  weeklyGoalsHistory: WeeklyGoalMap
  advancedGoals: AdvancedGoal[]
  routineItems: RoutineItem[]
  activeSubjectId: string | null
  settings: AppSettings
  workspacePreferencesVersion: number
}

export interface FocusDataStore {
  load(): FocusDataSnapshot
  save(snapshot: FocusDataSnapshot): void
}

/** Current browser-backed implementation used by the app in V1. */
export type LocalStorageDataStore = FocusDataStore


export type CloudSyncStatus =
  | "local"
  | "loading"
  | "saving"
  | "synced"
  | "offline"
  | "error"
