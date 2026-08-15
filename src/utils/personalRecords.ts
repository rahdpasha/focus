import type { StudySession } from '../types'
import { getStartOfDay } from './goalHistory'
import { getConsistencyInsights } from './consistencyInsights'

export interface PersonalRecords {
  longestSessionSeconds: number
  bestDayMinutes: number
  bestDayDate: string | null
  bestWeekMinutes: number
  bestWeekStart: string | null
  bestSubjectName: string | null
  bestSubjectMinutes: number
  bestDailyStreak: number
}

export function getPersonalRecords(
  sessions: StudySession[],
  weeklyGoal: number
): PersonalRecords {
  const completed =
    sessions.filter(
      (session) =>
        session.completed &&
        session.actualDuration > 0
    )

  const longestSessionSeconds =
    completed.length > 0
      ? Math.max(
          ...completed.map(
            (session) =>
              session.actualDuration
          )
        )
      : 0

  const dayTotals = new Map<
    string,
    number
  >()

  completed.forEach((session) => {
    const date = getStartOfDay(
      new Date(session.completedAt)
    )

    const key =
      `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, '0')}-${String(
        date.getDate()
      ).padStart(2, '0')}`

    dayTotals.set(
      key,
      (dayTotals.get(key) ?? 0) +
        session.actualDuration
    )
  })

  const bestDayEntry =
    Array.from(dayTotals.entries())
      .sort(
        ([, a], [, b]) =>
          b - a
      )[0] ?? null

  const subjectTotals = new Map<
    string,
    {
      name: string
      minutes: number
    }
  >()

  completed.forEach((session) => {
    const existing =
      subjectTotals.get(
        session.subjectId
      )

    const minutes =
      Math.floor(
        session.actualDuration /
          60
      )

    if (existing) {
      existing.minutes += minutes
      return
    }

    subjectTotals.set(
      session.subjectId,
      {
        name: session.subjectName,
        minutes,
      }
    )
  })

  const bestSubjectEntry =
    Array.from(
      subjectTotals.values()
    ).sort(
      (a, b) =>
        b.minutes - a.minutes
    )[0] ?? null

  const consistency =
    getConsistencyInsights(
      sessions,
      weeklyGoal
    )

  const bestWeek =
    consistency.bestWeek

  return {
    longestSessionSeconds,
    bestDayMinutes: bestDayEntry
      ? Math.floor(
          bestDayEntry[1] / 60
        )
      : 0,
    bestDayDate:
      bestDayEntry?.[0] ?? null,
    bestWeekMinutes:
      bestWeek?.minutes ?? 0,
    bestWeekStart:
      bestWeek?.weekStart ?? null,
    bestSubjectName:
      bestSubjectEntry?.name ??
      null,
    bestSubjectMinutes:
      bestSubjectEntry?.minutes ??
      0,
    bestDailyStreak:
      (() => {
        const days =
          Array.from(
            dayTotals.keys()
          ).sort()

        let best = 0
        let current = 0
        let previous: Date | null =
          null

        days.forEach((value) => {
          const currentDate =
            new Date(
              `${value}T00:00:00`
            )

          if (previous) {
            const difference =
              currentDate.getTime() -
              previous.getTime()

            if (
              difference ===
              24 * 60 * 60 * 1000
            ) {
              current += 1
            } else {
              current = 1
            }
          } else {
            current = 1
          }

          best = Math.max(
            best,
            current
          )

          previous =
            currentDate
        })

        return best
      })(),
  }
}
