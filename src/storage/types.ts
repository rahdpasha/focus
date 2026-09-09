import type { Subject, StudySession } from "../types"
import type { AppSettings } from "../app/settings"
import type { WeeklyGoalMap } from "../utils/goalHistory"

export interface FocusDataSnapshot {
  sessions: StudySession[]
  subjects: Subject[]
  dailyGoal: number
  weeklyGoal: number
  weeklyGoalsHistory: WeeklyGoalMap
  activeSubjectId: string | null
  settings: AppSettings
}

export interface FocusDataStore {
  load(): FocusDataSnapshot
  save(snapshot: FocusDataSnapshot): void
}

/** Current browser-backed implementation used by the app in V1. */
export type LocalStorageDataStore = FocusDataStore
