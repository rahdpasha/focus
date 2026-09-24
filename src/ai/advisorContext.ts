import type {
  Subject,
  StudySession,
} from '../types'
import {
  getProductivityInsights,
} from '../utils/productivityInsights'
import {
  getConsistencyInsights,
} from '../utils/consistencyInsights'
import {
  getStudyAdvisor,
} from '../utils/studyAdvisor'

export interface AdvisorContext {
  generatedAt: string
  today: {
    minutes: number
    goalMinutes: number
    remainingMinutes: number
  }
  week: {
    minutes: number
    goalMinutes: number
    remainingMinutes: number
    studyDays: number
    changePercent: number
  }
  consistency: {
    trend:
      | 'improving'
      | 'declining'
      | 'stable'
    averageWeeklyMinutes: number
  }
  bestStudyTime: string | null
  subjects: Array<{
    id: string
    name: string
    minutesThisWeek: number
    percentageThisWeek: number
    sessionsThisWeek: number
  }>
  recentSessions: Array<{
    subjectName: string
    minutes: number
    completed: boolean
    interruptions: number
    checklistCompletionPercent:
      | number
      | null
  }>
  deterministicRecommendation: {
    subjectId?: string
    subjectName?: string
    minutes: number
    summary: string
    priority:
      | 'high'
      | 'medium'
      | 'low'
  }
}

function getTodayMinutes(
  sessions: StudySession[],
): number {
  const now = new Date()
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)

  const end = new Date(start)
  end.setDate(end.getDate() + 1)

  return Math.round(
    sessions.reduce(
      (total, session) => {
        const completedAt =
          new Date(
            session.completedAt,
          )

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

function checklistPercent(
  session: StudySession,
): number | null {
  const tasks =
    session.subtasks ?? []

  if (tasks.length === 0) {
    return null
  }

  const completed =
    tasks.filter(
      (task) => task.completed,
    ).length

  return Math.round(
    (completed / tasks.length) *
      100,
  )
}

export function buildAdvisorContext(
  sessions: StudySession[],
  subjects: Subject[],
  dailyGoal: number,
  weeklyGoal: number,
): AdvisorContext {
  const productivity =
    getProductivityInsights(
      sessions,
    )
  const consistency =
    getConsistencyInsights(
      sessions,
      weeklyGoal,
    )
  const advisor =
    getStudyAdvisor(
      sessions,
      subjects,
      weeklyGoal,
    )
  const todayMinutes =
    getTodayMinutes(
      sessions,
    )

  const balanceById =
    new Map(
      productivity.subjectBalance.map(
        (subject) => [
          subject.subjectId,
          subject,
        ],
      ),
    )

  return {
    generatedAt:
      new Date().toISOString(),
    today: {
      minutes: todayMinutes,
      goalMinutes: dailyGoal,
      remainingMinutes:
        Math.max(
          0,
          dailyGoal -
            todayMinutes,
        ),
    },
    week: {
      minutes:
        productivity.thisWeekMinutes,
      goalMinutes: weeklyGoal,
      remainingMinutes:
        Math.max(
          0,
          weeklyGoal -
            productivity.thisWeekMinutes,
        ),
      studyDays:
        productivity.studyDaysThisWeek,
      changePercent:
        productivity.weekChangePercent,
    },
    consistency: {
      trend:
        consistency.trend,
      averageWeeklyMinutes:
        consistency.averageWeeklyMinutes,
    },
    bestStudyTime:
      productivity
        .bestStudyTime?.label ??
      null,
    subjects:
      subjects.map((subject) => {
        const balance =
          balanceById.get(
            subject.id,
          )

        return {
          id: subject.id,
          name: subject.name,
          minutesThisWeek:
            balance?.minutes ?? 0,
          percentageThisWeek:
            balance?.percentage ??
            0,
          sessionsThisWeek:
            balance?.sessions ?? 0,
        }
      }),
    recentSessions:
      [...sessions]
        .sort(
          (a, b) =>
            new Date(
              b.completedAt,
            ).getTime() -
            new Date(
              a.completedAt,
            ).getTime(),
        )
        .slice(0, 12)
        .map((session) => ({
          subjectName:
            session.subjectName,
          minutes:
            Math.round(
              Math.max(
                0,
                session.actualDuration,
              ) / 60,
            ),
          completed:
            session.completed,
          interruptions:
            session.interruptions,
          checklistCompletionPercent:
            checklistPercent(
              session,
            ),
        })),
    deterministicRecommendation: {
      subjectId:
        advisor.action
          .subjectId,
      subjectName:
        advisor.action
          .subjectName,
      minutes:
        advisor.action.minutes,
      summary:
        advisor.summary,
      priority:
        advisor.priority,
    },
  }
}
