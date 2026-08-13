import type { StudySession } from '../types'

export interface WeeklyGoalRecord {
  weekStart: string
  goalMinutes: number
  completedMinutes: number
}

export function getStartOfWeek(date: Date): Date {
  const result = new Date(date)

  result.setHours(0, 0, 0, 0)

  const day = result.getDay()
  const daysSinceMonday = day === 0 ? 6 : day - 1

  result.setDate(
    result.getDate() - daysSinceMonday
  )

  return result
}

export function getWeekKey(date: Date): string {
  return getStartOfWeek(date)
    .toISOString()
    .slice(0, 10)
}

export function getWeeklyMinutes(
  sessions: StudySession[],
  date: Date
): number {
  const weekStart = getStartOfWeek(date).getTime()

  return Math.floor(
    sessions
      .filter((session) => {
        if (!session.completed) {
          return false
        }

        const sessionDate = new Date(
          session.completedAt
        )

        const sessionDay = new Date(
          sessionDate
        )

        sessionDay.setHours(0, 0, 0, 0)

        return (
          sessionDay.getTime() >= weekStart
        )
      })
      .reduce(
        (total, session) =>
          total + session.actualDuration,
        0
      ) / 60
  )
}

export function createWeeklyGoalRecord(
  sessions: StudySession[],
  goalMinutes: number,
  date: Date = new Date()
): WeeklyGoalRecord {
  return {
    weekStart: getWeekKey(date),
    goalMinutes,
    completedMinutes: getWeeklyMinutes(
      sessions,
      date
    ),
  }
}
