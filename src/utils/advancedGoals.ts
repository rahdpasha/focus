import type { StudySession } from "../types"
import type { AdvancedGoal } from "../storage/types"

export interface AdvancedGoalProgress {
  minutes: number
  targetMinutes: number
  percent: number
  remainingMinutes: number
  overdue: boolean
  completed: boolean
}

function safeDate(value: string | Date | undefined) {
  const date = value instanceof Date ? value : new Date(value ?? "")
  return Number.isNaN(date.getTime()) ? null : date
}

export function getAdvancedGoalProgress(
  goal: AdvancedGoal,
  sessions: StudySession[],
  now = new Date(),
): AdvancedGoalProgress {
  const createdAt = safeDate(goal.createdAt)
  const deadline = safeDate(goal.deadline)

  const seconds = sessions.reduce((total, session) => {
    if (!session.completed) return total
    if (
      goal.subjectId &&
      session.subjectId !== goal.subjectId
    ) {
      return total
    }

    const completedAt = safeDate(session.completedAt)
    if (!completedAt) return total
    if (createdAt && completedAt < createdAt) return total
    if (deadline && completedAt > deadline) return total

    return total + Math.max(0, session.actualDuration || 0)
  }, 0)

  const minutes = Math.round(seconds / 60)
  const targetMinutes = Math.max(1, Math.round(goal.targetMinutes))
  const percent = Math.min(
    100,
    Math.round((minutes / targetMinutes) * 100),
  )

  const deadlinePassed = Boolean(
    deadline && now.getTime() > deadline.getTime(),
  )

  const completed =
    goal.status === "completed" || percent >= 100

  return {
    minutes,
    targetMinutes,
    percent,
    remainingMinutes: Math.max(0, targetMinutes - minutes),
    overdue: deadlinePassed && !completed,
    completed,
  }
}
