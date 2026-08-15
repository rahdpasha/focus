import type { StudySession } from '../types'
import {
  getStartOfDay,
  getStartOfWeek,
  getWeeklyMinutes,
} from './goalHistory'

export interface SubjectInsight {
  subjectId: string
  subjectName: string
  subjectColor: string
  minutes: number
  percentage: number
  sessions: number
}

export interface StudyTimePeriodInsight {
  period: 'morning' | 'afternoon' | 'evening' | 'night'
  label: string
  sessions: number
  totalMinutes: number
  averageMinutes: number
}

export interface BestTimeInsight {
  period: 'morning' | 'afternoon' | 'evening' | 'night'
  label: string
  sessions: number
  averageMinutes: number
}

export interface ProductivityInsights {
  thisWeekMinutes: number
  lastWeekMinutes: number
  weekChangeMinutes: number
  weekChangePercent: number
  thisWeekSessions: number
  lastWeekSessions: number
  studyDaysThisWeek: number
  averageSessionMinutes: number
  bestStudyTime: BestTimeInsight | null
  studyTimePeriods: StudyTimePeriodInsight[]
  bestSubject: SubjectInsight | null
  leastStudiedSubject: SubjectInsight | null
  subjectBalance: SubjectInsight[]
}

function getCompletedSessions(
  sessions: StudySession[]
): StudySession[] {
  return sessions.filter(
    (session) =>
      session.completed &&
      session.actualDuration > 0
  )
}

function getWeekSessions(
  sessions: StudySession[],
  date: Date
): StudySession[] {
  const weekStart =
    getStartOfWeek(date).getTime()

  const nextWeek =
    new Date(getStartOfWeek(date))

  nextWeek.setDate(
    nextWeek.getDate() + 7
  )

  const weekEnd =
    nextWeek.getTime()

  return getCompletedSessions(
    sessions
  ).filter((session) => {
    const timestamp =
      new Date(
        session.completedAt
      ).getTime()

    return (
      timestamp >= weekStart &&
      timestamp < weekEnd
    )
  })
}

function getStudyDays(
  sessions: StudySession[]
): number {
  const days = new Set<string>()

  sessions.forEach((session) => {
    days.add(
      getStartOfDay(
        new Date(
          session.completedAt
        )
      )
        .toISOString()
        .slice(0, 10)
    )
  })

  return days.size
}

function getTotalMinutes(
  sessions: StudySession[]
): number {
  return Math.floor(
    sessions.reduce(
      (total, session) =>
        total +
        session.actualDuration,
      0
    ) / 60
  )
}

function getSubjectInsights(
  sessions: StudySession[]
): SubjectInsight[] {
  const totalMinutes =
    getTotalMinutes(sessions)

  const subjectMap = new Map<
    string,
    {
      subjectId: string
      subjectName: string
      subjectColor: string
      minutes: number
      sessions: number
    }
  >()

  sessions.forEach((session) => {
    const existing =
      subjectMap.get(
        session.subjectId
      )

    const minutes =
      Math.floor(
        session.actualDuration /
          60
      )

    if (existing) {
      existing.minutes += minutes
      existing.sessions += 1
      return
    }

    subjectMap.set(
      session.subjectId,
      {
        subjectId:
          session.subjectId,
        subjectName:
          session.subjectName,
        subjectColor:
          session.subjectColor,
        minutes,
        sessions: 1,
      }
    )
  })

  return Array.from(
    subjectMap.values()
  )
    .map((subject) => ({
      ...subject,
      percentage:
        totalMinutes > 0
          ? Math.round(
              (subject.minutes /
                totalMinutes) *
                100
            )
          : 0,
    }))
    .sort(
      (a, b) =>
        b.minutes - a.minutes
    )
}

function getStudyTimePeriods(
  sessions: StudySession[]
): StudyTimePeriodInsight[] {
  const buckets: Record<
    StudyTimePeriodInsight['period'],
    {
      sessions: number
      totalMinutes: number
    }
  > = {
    morning: {
      sessions: 0,
      totalMinutes: 0,
    },
    afternoon: {
      sessions: 0,
      totalMinutes: 0,
    },
    evening: {
      sessions: 0,
      totalMinutes: 0,
    },
    night: {
      sessions: 0,
      totalMinutes: 0,
    },
  }

  sessions.forEach((session) => {
    const hour = new Date(
      session.completedAt
    ).getHours()

    let period:
      StudyTimePeriodInsight['period']

    if (hour >= 6 && hour < 12) {
      period = 'morning'
    } else if (
      hour >= 12 &&
      hour < 17
    ) {
      period = 'afternoon'
    } else if (
      hour >= 17 &&
      hour < 22
    ) {
      period = 'evening'
    } else {
      period = 'night'
    }

    buckets[period].sessions += 1
    buckets[period].totalMinutes +=
      session.actualDuration / 60
  })

  const labels: Record<
    StudyTimePeriodInsight['period'],
    string
  > = {
    morning: '06:00–12:00',
    afternoon: '12:00–17:00',
    evening: '17:00–22:00',
    night: '22:00–06:00',
  }

  return (
    Object.entries(
      buckets
    ) as Array<
      [
        StudyTimePeriodInsight['period'],
        {
          sessions: number
          totalMinutes: number
        }
      ]
    >
  ).map(([period, value]) => ({
    period,
    label: labels[period],
    sessions: value.sessions,
    totalMinutes: Math.round(
      value.totalMinutes
    ),
    averageMinutes:
      value.sessions > 0
        ? Math.round(
            value.totalMinutes /
              value.sessions
          )
        : 0,
  }))
}

function getBestStudyTime(
  sessions: StudySession[]
): BestTimeInsight | null {
  if (sessions.length === 0) {
    return null
  }

  const buckets: Record<
    BestTimeInsight['period'],
    { minutes: number; sessions: number }
  > = {
    morning: { minutes: 0, sessions: 0 },
    afternoon: { minutes: 0, sessions: 0 },
    evening: { minutes: 0, sessions: 0 },
    night: { minutes: 0, sessions: 0 },
  }

  sessions.forEach((session) => {
    const hour = new Date(
      session.completedAt
    ).getHours()

    let period: BestTimeInsight['period']

    if (hour >= 6 && hour < 12) {
      period = 'morning'
    } else if (hour >= 12 && hour < 17) {
      period = 'afternoon'
    } else if (hour >= 17 && hour < 22) {
      period = 'evening'
    } else {
      period = 'night'
    }

    buckets[period].minutes +=
      session.actualDuration / 60

    buckets[period].sessions += 1
  })

  const labels: Record<
    BestTimeInsight['period'],
    string
  > = {
    morning: '06:00–12:00',
    afternoon: '12:00–17:00',
    evening: '17:00–22:00',
    night: '22:00–06:00',
  }

  const ranked = (
    Object.entries(buckets) as Array<
      [
        BestTimeInsight['period'],
        {
          minutes: number
          sessions: number
        }
      ]
    >
  )
    .filter(
      ([, value]) =>
        value.sessions > 0
    )
    .sort(
      ([, a], [, b]) =>
        b.minutes / b.sessions -
        a.minutes / a.sessions
    )

  const best = ranked[0]

  if (!best) {
    return null
  }

  const [period, stats] = best

  return {
    period,
    label: labels[period],
    sessions: stats.sessions,
    averageMinutes: Math.round(
      stats.minutes /
        stats.sessions
    ),
  }
}

export function getProductivityInsights(
  sessions: StudySession[],
  date: Date = new Date()
): ProductivityInsights {
  const currentWeek =
    getStartOfWeek(date)

  const previousWeek =
    new Date(currentWeek)

  previousWeek.setDate(
    previousWeek.getDate() - 7
  )

  const thisWeekSessions =
    getWeekSessions(
      sessions,
      currentWeek
    )

  const lastWeekSessions =
    getWeekSessions(
      sessions,
      previousWeek
    )

  const thisWeekMinutes =
    getWeeklyMinutes(
      sessions,
      currentWeek
    )

  const lastWeekMinutes =
    getWeeklyMinutes(
      sessions,
      previousWeek
    )

  const weekChangeMinutes =
    thisWeekMinutes -
    lastWeekMinutes

  const weekChangePercent =
    lastWeekMinutes > 0
      ? Math.round(
          (weekChangeMinutes /
            lastWeekMinutes) *
            100
        )
      : thisWeekMinutes > 0
        ? 100
        : 0

  const subjectBalance =
    getSubjectInsights(
      thisWeekSessions
    )

  const averageSessionMinutes =
    thisWeekSessions.length > 0
      ? Math.round(
          thisWeekSessions.reduce(
            (total, session) =>
              total +
              session.actualDuration,
            0
          ) /
            thisWeekSessions.length /
            60
        )
      : 0

  const bestStudyTime =
    getBestStudyTime(
      thisWeekSessions
    )

  const studyTimePeriods =
    getStudyTimePeriods(
      thisWeekSessions
    )


  return {
    thisWeekMinutes,
    lastWeekMinutes,
    weekChangeMinutes,
    weekChangePercent,

    thisWeekSessions:
      thisWeekSessions.length,

    lastWeekSessions:
      lastWeekSessions.length,

    studyDaysThisWeek:
      getStudyDays(
        thisWeekSessions
      ),

    averageSessionMinutes,

    bestStudyTime,

    studyTimePeriods,

    bestSubject:
      subjectBalance[0] ?? null,

    leastStudiedSubject:
      subjectBalance.length > 1
        ? subjectBalance[
            subjectBalance.length - 1
          ]
        : null,

    subjectBalance,
  }
}
