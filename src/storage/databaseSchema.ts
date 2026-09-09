export type EntityId = string

export interface UserRecord {
  id: EntityId
  email: string
  displayName: string | null
  createdAt: Date
  updatedAt: Date
}

export interface SubjectRecord {
  id: EntityId
  userId: EntityId
  name: string
  color: string
  icon: string | null
  createdAt: Date
  updatedAt: Date
  archivedAt: Date | null
}

export interface StudySessionRecord {
  id: EntityId
  userId: EntityId
  subjectId: EntityId
  plannedSeconds: number
  actualSeconds: number
  startedAt: Date
  completedAt: Date
  completed: boolean
  interruptions: number
  totalPausedSeconds: number
  createdAt: Date
  updatedAt: Date
}

export interface GoalRecord {
  id: EntityId
  userId: EntityId
  dailyMinutes: number
  weeklyMinutes: number
  effectiveFrom: string
  createdAt: Date
  updatedAt: Date
}

export interface WeeklyGoalHistoryRecord {
  id: EntityId
  userId: EntityId
  weekStart: string
  goalMinutes: number
  achievedMinutes: number
  createdAt: Date
  updatedAt: Date
}

export interface UserSettingsRecord {
  userId: EntityId
  theme: 'dark' | 'light' | 'system'
  language: 'en' | 'ku'
  focusMinutes: number
  shortBreakMinutes: number
  longBreakMinutes: number
  sessionsBeforeLongBreak: number
  soundEnabled: boolean
  volume: number
  notificationsEnabled: boolean
  autoStartBreak: boolean
}
