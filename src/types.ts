export interface Subject {
  id: string
  name: string
  color: string
  icon?: string
}

export interface StudySession {
  id: string
  subjectId: string
  subjectName: string
  subjectColor: string
  duration: number
  actualDuration: number
  completedAt: Date
  completed: boolean
  interruptions: number
  totalPausedSeconds: number
}

export interface DailyStats {
  totalMinutes: number
  goalMinutes: number
  sessions: StudySession[]
  streak: number
}
