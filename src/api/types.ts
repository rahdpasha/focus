import type { Subject, StudySession } from '../types'
import type { AppSettings } from '../app/settings'
import type { WeeklyGoalMap } from '../utils/goalHistory'

export interface UserIdentity {
  id: string
}

export interface FocusDataResource {
  sessions: StudySession[]
  subjects: Subject[]
  dailyGoal: number
  weeklyGoal: number
  weeklyGoalsHistory: WeeklyGoalMap
  activeSubjectId: string | null
  settings: AppSettings
}

export interface ApiContext {
  user: UserIdentity
}

export interface ApiResponse<T> {
  data: T
  requestId?: string
}

export interface FocusApi {
  getFocusData(context: ApiContext): Promise<ApiResponse<FocusDataResource>>
  saveFocusData(
    context: ApiContext,
    data: FocusDataResource,
  ): Promise<ApiResponse<FocusDataResource>>
}
