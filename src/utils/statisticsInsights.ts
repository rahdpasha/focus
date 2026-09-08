import type { StudySession } from '../types'
import { getWeeklyGoalHistory, type WeeklyGoalMap } from './goalHistory'

export interface StatisticsOverview {
  completedCount: number
  todayFocusSeconds: number
  weekFocusSeconds: number
  totalFocusSeconds: number
  averageSessionSeconds: number
  longestSessionSeconds: number
}

function startOfDay(date: Date): Date {
  const result = new Date(date)
  result.setHours(0, 0, 0, 0)
  return result
}

export function getStatisticsOverview(sessions: StudySession[]): StatisticsOverview {
  const completed = sessions.filter((session) => session.completed)
  const today = startOfDay(new Date())
  const last7Start = new Date(today)
  last7Start.setDate(last7Start.getDate() - 6)

  const todayFocusSeconds = completed
    .filter((session) => startOfDay(new Date(session.completedAt)).getTime() === today.getTime())
    .reduce((sum, session) => sum + session.actualDuration, 0)

  const weekFocusSeconds = completed
    .filter((session) => {
      const date = startOfDay(new Date(session.completedAt))
      return date >= last7Start && date <= today
    })
    .reduce((sum, session) => sum + session.actualDuration, 0)

  const totalFocusSeconds = completed.reduce((sum, session) => sum + session.actualDuration, 0)
  const longestSessionSeconds = completed.length > 0
    ? Math.max(...completed.map((session) => session.actualDuration))
    : 0

  return {
    completedCount: completed.length,
    todayFocusSeconds,
    weekFocusSeconds,
    totalFocusSeconds,
    averageSessionSeconds: completed.length > 0 ? Math.round(totalFocusSeconds / completed.length) : 0,
    longestSessionSeconds,
  }
}

export function getStatisticsWeeklyHistory(
  sessions: StudySession[],
  weeklyGoalsHistory: WeeklyGoalMap,
  weeklyGoal: number,
  numberOfWeeks = 4,
) {
  return getWeeklyGoalHistory(sessions, weeklyGoalsHistory, weeklyGoal, numberOfWeeks)
}
