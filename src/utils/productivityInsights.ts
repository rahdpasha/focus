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

export interface ProductivityInsights {
  thisWeekMinutes: number
  lastWeekMinutes: number
  weekChangeMinutes: number
  weekChangePercent: number
  thisWeekSessions: number
  lastWeekSessions: number
  studyDaysThisWeek: number
  averageSessionMinutes: number
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
