export interface Subtask {
  id: string
  text: string
  completed: boolean
}

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
  startedAt?: Date
  completedAt: Date
  completed: boolean
  interruptions: number
  totalPausedSeconds: number
  notes?: string
  subtasks?: Subtask[]
  routineItemId?: string
  routineDate?: string
}

export interface DailyStats {
  totalMinutes: number
  goalMinutes: number
  sessions: StudySession[]
  streak: number
}
