import type {
  Subject,
  StudySession,
} from '../types'
import {
  getProductivityInsights,
} from './productivityInsights'
import {
  getConsistencyInsights,
} from './consistencyInsights'
import {
  getStudyAdvisor,
} from './studyAdvisor'

export interface FocusPulse {
  headline: string
  summary: string
  todayMinutes: number
  dailyGoal: number
  dailyProgress: number
  weeklyMinutes: number
  weeklyGoal: number
  weeklyProgress: number
  consistencyTrend:
    | 'improving'
    | 'declining'
    | 'stable'
  bestTime: string | null
  action: {
    subjectId?: string
    subjectName?: string
    minutes: number
    label: string
  }
  evidence: string[]
}

function startOfDay(
  date: Date,
): number {
  const result = new Date(date)
  result.setHours(0, 0, 0, 0)
  return result.getTime()
}

function todayMinutes(
  sessions: StudySession[],
  now: Date,
): number {
  const start = startOfDay(now)
  const end = start + 24 * 60 * 60 * 1000

  return Math.round(
    sessions.reduce(
      (total, session) => {
        const completedAt =
          new Date(
            session.completedAt,
          ).getTime()

        if (
          !session.completed ||
          completedAt < start ||
          completedAt >= end
        ) {
          return total
        }

        return (
          total +
          Math.max(
            0,
            session.actualDuration,
          ) /
            60
        )
      },
      0,
    ),
  )
}

function actionLabel(
  subjectName: string | undefined,
  minutes: number,
): string {
  if (subjectName) {
    return `Start ${minutes}m · ${subjectName}`
  }

  return `Start ${minutes}m focus`
}

export function getFocusPulse(
  sessions: StudySession[],
  subjects: Subject[],
  dailyGoal: number,
  weeklyGoal: number,
  now: Date = new Date(),
): FocusPulse {
  const productivity =
    getProductivityInsights(
      sessions,
      now,
    )
  const consistency =
    getConsistencyInsights(
      sessions,
      weeklyGoal,
      4,
      now,
    )
  const advisor =
    getStudyAdvisor(
      sessions,
      subjects,
      weeklyGoal,
    )

  const studiedToday =
    todayMinutes(
      sessions,
      now,
    )

  const dailyProgress =
    dailyGoal > 0
      ? Math.min(
          100,
          Math.round(
            (studiedToday /
              dailyGoal) *
              100,
          ),
        )
      : 0

  const weeklyProgress =
    weeklyGoal > 0
      ? Math.min(
          100,
          Math.round(
            (productivity.thisWeekMinutes /
              weeklyGoal) *
              100,
          ),
        )
      : 0

  const evidence: string[] = [
    `${studiedToday}/${dailyGoal}m today`,
    `${productivity.thisWeekMinutes}/${weeklyGoal}m this week`,
  ]

  if (
    productivity.bestStudyTime
  ) {
    evidence.push(
      `Best window ${productivity.bestStudyTime.label}`,
    )
  }

  evidence.push(
    `Consistency ${consistency.trend}`,
  )

  let headline =
    advisor.summary
  let summary =
    'FOCUS is using your recent study behavior to choose one useful next action.'

  if (
    studiedToday >= dailyGoal &&
    dailyGoal > 0
  ) {
    headline =
      'Daily target reached.'
    summary =
      consistency.trend ===
      'declining'
        ? 'You have done enough for today. Protect the win and return tomorrow rather than forcing extra volume.'
        : 'You have completed today’s target. Extra study is optional; consistency matters more than squeezing in random minutes.'
  } else if (
    advisor.action
      .subjectName
  ) {
    summary =
      `${advisor.action.subjectName} is the strongest next action from your current subject balance, weekly target and consistency pattern.`
  } else if (
    productivity.thisWeekSessions ===
    0
  ) {
    summary =
      'There is not enough current-week data yet, so FOCUS is starting with a simple session to establish momentum.'
  }

  return {
    headline,
    summary,
    todayMinutes:
      studiedToday,
    dailyGoal,
    dailyProgress,
    weeklyMinutes:
      productivity.thisWeekMinutes,
    weeklyGoal,
    weeklyProgress,
    consistencyTrend:
      consistency.trend,
    bestTime:
      productivity.bestStudyTime
        ?.label ?? null,
    action: {
      subjectId:
        advisor.action
          .subjectId,
      subjectName:
        advisor.action
          .subjectName,
      minutes:
        advisor.action.minutes,
      label: actionLabel(
        advisor.action
          .subjectName,
        advisor.action.minutes,
      ),
    },
    evidence,
  }
}
