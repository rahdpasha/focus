import type {
  Subject,
  StudySession,
} from '../types'
import type {
  AdvancedGoal,
} from '../storage/types'
import {
  getAdvancedGoalProgress,
} from '../utils/advancedGoals'
import {
  getProductivityInsights,
} from '../utils/productivityInsights'
import {
  getConsistencyInsights,
} from '../utils/consistencyInsights'
import {
  getStudyAdvisor,
} from '../utils/studyAdvisor'

export interface AdvisorPeriodSummary {
  days: number
  minutes: number
  sessions: number
  activeDays: number
  averageSessionMinutes: number
  averageInterruptions: number
  topSubject: string | null
}

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
  periods: {
    last7: AdvisorPeriodSummary
    last30: AdvisorPeriodSummary
    last90: AdvisorPeriodSummary
  }
  subjects: Array<{
    id: string
    name: string
    minutesThisWeek: number
    percentageThisWeek: number
    sessionsThisWeek: number
  }>
  advancedGoals: Array<{
    id: string
    title: string
    priority:
      | 'low'
      | 'medium'
      | 'high'
    status:
      | 'active'
      | 'completed'
    deadline: string
    targetMinutes: number
    completedMinutes: number
    remainingMinutes: number
    percent: number
    overdue: boolean
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


function buildPeriodSummary(
  sessions: StudySession[],
  days: number,
  now = new Date(),
): AdvisorPeriodSummary {
  const end = new Date(now)
  end.setHours(23, 59, 59, 999)

  const start = new Date(end)
  start.setDate(
    start.getDate() - (days - 1),
  )
  start.setHours(0, 0, 0, 0)

  const completed = sessions.filter(
    (session) => {
      if (
        !session.completed ||
        session.actualDuration <= 0
      ) {
        return false
      }

      const completedAt =
        new Date(
          session.completedAt,
        )

      return (
        completedAt >= start &&
        completedAt <= end
      )
    },
  )

  const totalSeconds =
    completed.reduce(
      (sum, session) =>
        sum +
        Math.max(
          0,
          session.actualDuration,
        ),
      0,
    )

  const dayKeys =
    new Set<string>()

  const subjectMinutes =
    new Map<string, number>()

  completed.forEach(
    (session) => {
      const date =
        new Date(
          session.completedAt,
        )

      dayKeys.add(
        `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`,
      )

      subjectMinutes.set(
        session.subjectName,
        (subjectMinutes.get(
          session.subjectName,
        ) ?? 0) +
          session.actualDuration /
            60,
      )
    },
  )

  const topSubject =
    [...subjectMinutes.entries()]
      .sort(
        (
          [, a],
          [, b],
        ) => b - a,
      )[0]?.[0] ?? null

  return {
    days,
    minutes:
      Math.round(
        totalSeconds / 60,
      ),
    sessions:
      completed.length,
    activeDays:
      dayKeys.size,
    averageSessionMinutes:
      completed.length > 0
        ? Math.round(
            totalSeconds /
              completed.length /
              60,
          )
        : 0,
    averageInterruptions:
      completed.length > 0
        ? Number(
            (
              completed.reduce(
                (
                  sum,
                  session,
                ) =>
                  sum +
                  Math.max(
                    0,
                    session.interruptions,
                  ),
                0,
              ) /
              completed.length
            ).toFixed(1),
          )
        : 0,
    topSubject,
  }
}

export function buildAdvisorContext(
  sessions: StudySession[],
  subjects: Subject[],
  dailyGoal: number,
  weeklyGoal: number,
  advancedGoals: AdvancedGoal[] = [],
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
    periods: {
      last7:
        buildPeriodSummary(
          sessions,
          7,
        ),
      last30:
        buildPeriodSummary(
          sessions,
          30,
        ),
      last90:
        buildPeriodSummary(
          sessions,
          90,
        ),
    },
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
    advancedGoals:
      advancedGoals.map((goal) => {
        const progress =
          getAdvancedGoalProgress(
            goal,
            sessions,
          )

        return {
          id: goal.id,
          title: goal.title,
          priority: goal.priority,
          status: goal.status,
          deadline: goal.deadline,
          targetMinutes:
            goal.targetMinutes,
          completedMinutes:
            progress.minutes,
          remainingMinutes:
            progress.remainingMinutes,
          percent:
            progress.percent,
          overdue:
            progress.overdue,
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
