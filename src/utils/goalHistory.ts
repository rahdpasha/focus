import type { StudySession } from '../types'

export interface WeeklyGoalRecord {
  weekStart: string
  goalMinutes: number
  completedMinutes: number
  progressPercent: number
  completed: boolean
}

export interface StreakStats {
  currentDailyStreak: number
  bestDailyStreak: number
  currentWeeklyStreak: number
  bestWeeklyStreak: number
}

export type WeeklyGoalMap = Record<string, number>

export function getStartOfDay(date: Date): Date {
  const result = new Date(date)
  result.setHours(0, 0, 0, 0)
  return result
}

export function getStartOfWeek(date: Date): Date {
  const result = getStartOfDay(date)
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
  const weekStart =
    getStartOfWeek(date).getTime()

  const nextWeek =
    new Date(getStartOfWeek(date))

  nextWeek.setDate(
    nextWeek.getDate() + 7
  )

  const weekEnd = nextWeek.getTime()

  return Math.floor(
    sessions
      .filter((session) => {
        if (!session.completed) {
          return false
        }

        const timestamp =
          new Date(
            session.completedAt
          ).getTime()

        return (
          timestamp >= weekStart &&
          timestamp < weekEnd
        )
      })
      .reduce(
        (total, session) =>
          total + session.actualDuration,
        0
      ) / 60
  )
}

export function getDailyStudyDays(
  sessions: StudySession[]
): Set<string> {
  const days = new Set<string>()

  sessions.forEach((session) => {
    if (!session.completed) {
      return
    }

    const date =
      getStartOfDay(
        new Date(
          session.completedAt
        )
      )

    days.add(
      date.toISOString().slice(0, 10)
    )
  })

  return days
}

export function getDailyStreak(
  sessions: StudySession[]
): number {
  const days =
    getDailyStudyDays(sessions)

  let streak = 0
  const date =
    getStartOfDay(new Date())

  while (
    days.has(
      date.toISOString().slice(0, 10)
    )
  ) {
    streak += 1

    date.setDate(
      date.getDate() - 1
    )
  }

  return streak
}

export function getBestDailyStreak(
  sessions: StudySession[]
): number {
  const days =
    getDailyStudyDays(sessions)

  if (days.size === 0) {
    return 0
  }

  const sortedDays =
    Array.from(days)
      .map(
        (value) =>
          new Date(`${value}T00:00:00`)
      )
      .sort(
        (a, b) =>
          a.getTime() - b.getTime()
      )

  let best = 1
  let current = 1

  for (
    let i = 1;
    i < sortedDays.length;
    i += 1
  ) {
    const previous =
      sortedDays[i - 1]

    const currentDay =
      sortedDays[i]

    const difference =
      currentDay.getTime() -
      previous.getTime()

    if (
      difference ===
      24 * 60 * 60 * 1000
    ) {
      current += 1
      best = Math.max(
        best,
        current
      )
    } else {
      current = 1
    }
  }

  return best
}

export function getWeeklyGoalHistory(
  sessions: StudySession[],
  goalMap: WeeklyGoalMap,
  fallbackGoalMinutes: number,
  numberOfWeeks = 4
): WeeklyGoalRecord[] {
  const currentWeek =
    getStartOfWeek(new Date())

  return Array.from(
    { length: numberOfWeeks },
    (_, index) => {
      const week =
        new Date(currentWeek)

      week.setDate(
        week.getDate() -
          index * 7
      )

      const weekStart =
        getWeekKey(week)

      const goalMinutes =
        goalMap[weekStart] ??
        fallbackGoalMinutes

      const completedMinutes =
        getWeeklyMinutes(
          sessions,
          week
        )

      const progressPercent =
        goalMinutes > 0
          ? Math.min(
              100,
              Math.round(
                (completedMinutes /
                  goalMinutes) *
                  100
              )
            )
          : 0

      return {
        weekStart,
        goalMinutes,
        completedMinutes,
        progressPercent,
        completed:
          goalMinutes > 0 &&
          completedMinutes >=
            goalMinutes,
      }
    }
  )
}

export function getCurrentWeeklyStreak(
  sessions: StudySession[],
  goalMap: WeeklyGoalMap,
  fallbackGoalMinutes: number
): number {
  let streak = 0
  const week =
    getStartOfWeek(new Date())

  while (true) {
    const goal =
      goalMap[getWeekKey(week)] ??
      fallbackGoalMinutes

    if (
      goal <= 0 ||
      getWeeklyMinutes(
        sessions,
        week
      ) < goal
    ) {
      break
    }

    streak += 1

    week.setDate(
      week.getDate() - 7
    )
  }

  return streak
}

export function getBestWeeklyStreak(
  sessions: StudySession[],
  goalMap: WeeklyGoalMap,
  fallbackGoalMinutes: number
): number {
  const completedSessions =
    sessions.filter(
      (session) => session.completed
    )

  if (completedSessions.length === 0) {
    return 0
  }

  const firstSession =
    [...completedSessions].sort(
      (a, b) =>
        new Date(
          a.completedAt
        ).getTime() -
        new Date(
          b.completedAt
        ).getTime()
    )[0]

  if (!firstSession) {
    return 0
  }

  const firstWeek =
    getStartOfWeek(
      new Date(
        firstSession.completedAt
      )
    )

  const currentWeek =
    getStartOfWeek(new Date())

  const cursor =
    new Date(firstWeek)

  let best = 0
  let current = 0

  while (
    cursor.getTime() <=
    currentWeek.getTime()
  ) {
    const goal =
      goalMap[getWeekKey(cursor)] ??
      fallbackGoalMinutes

    const completedMinutes =
      getWeeklyMinutes(
        sessions,
        cursor
      )

    if (
      goal > 0 &&
      completedMinutes >= goal
    ) {
      current += 1
      best = Math.max(
        best,
        current
      )
    } else {
      current = 0
    }

    cursor.setDate(
      cursor.getDate() + 7
    )
  }

  return best
}

export function getStreakStats(
  sessions: StudySession[],
  goalMap: WeeklyGoalMap,
  fallbackGoalMinutes: number
): StreakStats {
  return {
    currentDailyStreak:
      getDailyStreak(sessions),

    bestDailyStreak:
      getBestDailyStreak(sessions),

    currentWeeklyStreak:
      getCurrentWeeklyStreak(
        sessions,
        goalMap,
        fallbackGoalMinutes
      ),

    bestWeeklyStreak:
      getBestWeeklyStreak(
        sessions,
        goalMap,
        fallbackGoalMinutes
      ),
  }
}

export function createWeeklyGoalRecord(
  sessions: StudySession[],
  goalMinutes: number,
  date: Date = new Date()
): WeeklyGoalRecord {
  const completedMinutes =
    getWeeklyMinutes(
      sessions,
      date
    )

  const progressPercent =
    goalMinutes > 0
      ? Math.min(
          100,
          Math.round(
            (completedMinutes /
              goalMinutes) *
              100
          )
        )
      : 0

  return {
    weekStart:
      getWeekKey(date),
    goalMinutes,
    completedMinutes,
    progressPercent,
    completed:
      goalMinutes > 0 &&
      completedMinutes >=
        goalMinutes,
  }
}
