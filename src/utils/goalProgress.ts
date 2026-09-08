import type { StudySession } from "../types"

export interface GoalProgress {
  minutes: number
  goal: number
  remaining: number
  percent: number
}

function startOfDay(date: Date): Date {
  const value = new Date(date)
  value.setHours(0, 0, 0, 0)
  return value
}

function startOfWeek(date: Date): Date {
  const value = startOfDay(date)
  const day = value.getDay()
  const daysFromMonday = (day + 6) % 7
  value.setDate(value.getDate() - daysFromMonday)
  return value
}

function toGoalProgress(minutes: number, goal: number): GoalProgress {
  const safeMinutes = Math.max(0, Math.round(minutes))
  const safeGoal = Math.max(0, Math.round(goal))
  return {
    minutes: safeMinutes,
    goal: safeGoal,
    remaining: Math.max(0, safeGoal - safeMinutes),
    percent: safeGoal > 0 ? Math.min(100, Math.round((safeMinutes / safeGoal) * 100)) : 0,
  }
}

export function getDailyGoalProgress(sessions: StudySession[], goal: number, now = new Date()): GoalProgress {
  const start = startOfDay(now).getTime()
  const end = start + 24 * 60 * 60 * 1000
  const minutes = sessions.reduce((total, session) => {
    const timestamp = new Date(session.completedAt).getTime()
    return timestamp >= start && timestamp < end && session.completed ? total + session.actualDuration : total
  }, 0) / 60
  return toGoalProgress(minutes, goal)
}

export function getWeeklyGoalProgress(sessions: StudySession[], goal: number, now = new Date()): GoalProgress {
  const start = startOfWeek(now).getTime()
  const end = now.getTime()
  const minutes = sessions.reduce((total, session) => {
    const timestamp = new Date(session.completedAt).getTime()
    return timestamp >= start && timestamp <= end && session.completed ? total + session.actualDuration : total
  }, 0) / 60
  return toGoalProgress(minutes, goal)
}
