import type { StudySession } from '../types'
import {
  getStartOfWeek,
  getWeeklyMinutes,
} from './goalHistory'

export type ConsistencyTrend =
  | 'improving'
  | 'declining'
  | 'stable'

export interface WeeklyConsistency {
  weekStart: string
  minutes: number
  studyDays: number
  goalMinutes: number
  goalPercent: number
}

export interface ConsistencyInsights {
  weeks: WeeklyConsistency[]
  trend: ConsistencyTrend
  changePercent: number
  averageWeeklyMinutes: number
  bestWeek: WeeklyConsistency | null
  strongestConsistencyWeek: WeeklyConsistency | null
}

function getStudyDays(
  sessions: StudySession[],
  week: Date
): number {
  const start =
    getStartOfWeek(week).getTime()

  const endDate =
    new Date(
      getStartOfWeek(week)
    )

  endDate.setDate(
    endDate.getDate() + 7
  )

  const end =
    endDate.getTime()

  const days = new Set<string>()

  sessions.forEach((session) => {
    if (!session.completed) {
      return
    }

    const date =
      new Date(
        session.completedAt
      )

    const timestamp =
      date.getTime()

    if (
      timestamp >= start &&
      timestamp < end
    ) {
      days.add(
        `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
      )
    }
  })

  return days.size
}

export function getConsistencyInsights(
  sessions: StudySession[],
  weeklyGoal: number,
  numberOfWeeks = 4,
  date: Date = new Date()
): ConsistencyInsights {
  const currentWeek =
    getStartOfWeek(date)

  const weeks: WeeklyConsistency[] =
    Array.from(
      { length: numberOfWeeks },
      (_, index) => {
        const week =
          new Date(currentWeek)

        week.setDate(
          week.getDate() -
            index * 7
        )

        const minutes =
          getWeeklyMinutes(
            sessions,
            week
          )

        const studyDays =
          getStudyDays(
            sessions,
            week
          )

        const goalPercent =
          weeklyGoal > 0
            ? Math.min(
                100,
                Math.round(
                  (minutes /
                    weeklyGoal) *
                    100
                )
              )
            : 0

        return {
          weekStart:
            `${week.getFullYear()}-${String(
              week.getMonth() + 1
            ).padStart(2, '0')}-${String(
              week.getDate()
            ).padStart(2, '0')}`,
          minutes,
          studyDays,
          goalMinutes:
            weeklyGoal,
          goalPercent,
        }
      }
    )

  const newest =
    weeks[0]

  const previous =
    weeks[1]

  const getConsistencyScore =
    (week: WeeklyConsistency | undefined) => {
      if (!week) {
        return 0
      }

      const minuteScore =
        weeklyGoal > 0
          ? Math.min(
              100,
              (week.minutes /
                weeklyGoal) *
                100
            )
          : 0

      const dayScore =
        (week.studyDays / 7) *
        100

      return (
        minuteScore * 0.5 +
        dayScore * 0.5
      )
    }

  const newestScore =
    getConsistencyScore(newest)

  const previousScore =
    getConsistencyScore(previous)

  const changePercent =
    previousScore > 0
      ? Math.round(
          ((newestScore -
            previousScore) /
            previousScore) *
            100
        )
      : newestScore > 0
        ? 100
        : 0

  const trend: ConsistencyTrend =
    changePercent >= 10
      ? 'improving'
      : changePercent <= -10
        ? 'declining'
        : 'stable'

  const averageWeeklyMinutes =
    Math.round(
      weeks.reduce(
        (total, week) =>
          total + week.minutes,
        0
      ) / weeks.length
    )

  const bestWeek =
    [...weeks].sort(
      (a, b) =>
        b.minutes - a.minutes
    )[0] ?? null

  const strongestConsistencyWeek =
    [...weeks].sort(
      (a, b) => {
        if (
          b.studyDays !==
          a.studyDays
        ) {
          return (
            b.studyDays -
            a.studyDays
          )
        }

        return (
          b.minutes -
          a.minutes
        )
      }
    )[0] ?? null

  return {
    weeks,
    trend,
    changePercent,
    averageWeeklyMinutes,
    bestWeek,
    strongestConsistencyWeek,
  }
}
