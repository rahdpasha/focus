import type { Subject, StudySession } from '../types'
import type {
  AdvancedGoal,
  RoutineItem,
} from '../storage/types'
import {
  getStudyPlan,
  type StudyPlan,
} from '../utils/studyPlan.ts'
import {
  getAdvancedGoalProgress,
} from '../utils/advancedGoals.ts'
import {
  getRecoverableRoutineOccurrences,
  getRoutineItemsForDate,
  getRoutineMinutesForDate,
} from '../utils/routine.ts'

export const AGENT_READ_TOOL_NAMES = [
  'get_today_plan',
  'get_subjects',
  'get_active_goals',
  'get_routines',
  'get_recent_sessions',
  'get_week_progress',
  'get_recoverable_routines',
] as const

export type AgentReadToolName =
  (typeof AGENT_READ_TOOL_NAMES)[number]

export interface AgentToolContext {
  sessions: StudySession[]
  subjects: Subject[]
  dailyGoal: number
  weeklyGoal: number
  advancedGoals: AdvancedGoal[]
  routineItems: RoutineItem[]
  availableMinutes?: number
  now?: Date
}

export interface AgentSessionSummary {
  id: string
  subjectId: string
  subjectName: string
  completedAt: string
  actualMinutes: number
  completed: boolean
  interruptions: number
  totalPausedSeconds: number
}

export function getAgentTodayPlan(
  context: AgentToolContext,
): StudyPlan {
  return getStudyPlan({
    sessions: context.sessions,
    subjects: context.subjects,
    dailyGoal: context.dailyGoal,
    weeklyGoal: context.weeklyGoal,
    advancedGoals:
      context.advancedGoals,
    routineItems:
      context.routineItems,
    availableMinutes:
      context.availableMinutes,
    now: context.now,
  })
}

export function getAgentSubjects(
  context: AgentToolContext,
) {
  return context.subjects.map(
    (subject) => ({
      id: subject.id,
      name: subject.name,
    }),
  )
}

export function getAgentActiveGoals(
  context: AgentToolContext,
) {
  const now =
    context.now ??
    new Date()

  return context.advancedGoals
    .filter(
      (goal) =>
        goal.status === 'active',
    )
    .map((goal) => {
      const progress =
        getAdvancedGoalProgress(
          goal,
          context.sessions,
          now,
        )

      return {
        id: goal.id,
        title: goal.title,
        subjectId:
          goal.subjectId,
        targetMinutes:
          progress.targetMinutes,
        completedMinutes:
          progress.minutes,
        remainingMinutes:
          progress.remainingMinutes,
        percent:
          progress.percent,
        deadline:
          goal.deadline,
        priority:
          goal.priority,
        overdue:
          progress.overdue,
      }
    })
}

export function getAgentRoutines(
  context: AgentToolContext,
) {
  const now =
    context.now ??
    new Date()

  const dueIds =
    new Set(
      getRoutineItemsForDate(
        context.routineItems,
        now,
      ).map(
        (item) =>
          item.id,
      ),
    )

  return context.routineItems
    .filter(
      (item) =>
        item.enabled,
    )
    .map((item) => ({
      id: item.id,
      title: item.title,
      subjectId:
        item.subjectId,
      targetMinutes:
        item.targetMinutes,
      mode: item.mode,
      daysOfWeek:
        [...item.daysOfWeek],
      recoveryDays:
        item.recoveryDays,
      dueToday:
        dueIds.has(
          item.id,
        ),
      completedMinutesToday:
        getRoutineMinutesForDate(
          item,
          context.sessions,
          now,
        ),
    }))
}

export function getAgentRecentSessions(
  context: AgentToolContext,
  limit = 20,
): AgentSessionSummary[] {
  const safeLimit =
    Math.max(
      1,
      Math.min(
        50,
        Math.round(
          limit,
        ),
      ),
    )

  return [...context.sessions]
    .sort(
      (a, b) =>
        new Date(
          b.completedAt,
        ).getTime() -
        new Date(
          a.completedAt,
        ).getTime(),
    )
    .slice(
      0,
      safeLimit,
    )
    .map(
      (session) => ({
        id: session.id,
        subjectId:
          session.subjectId,
        subjectName:
          session.subjectName,
        completedAt:
          new Date(
            session.completedAt,
          ).toISOString(),
        actualMinutes:
          Math.max(
            0,
            Math.round(
              session.actualDuration /
                60,
            ),
          ),
        completed:
          session.completed,
        interruptions:
          session.interruptions,
        totalPausedSeconds:
          session.totalPausedSeconds,
      }),
    )
}

export function getAgentWeekProgress(
  context: AgentToolContext,
) {
  const plan =
    getAgentTodayPlan(
      context,
    )

  return {
    daily: {
      targetMinutes:
        context.dailyGoal,
      completedMinutes:
        plan.todayCompletedMinutes,
      remainingMinutes:
        plan.todayRemainingMinutes,
    },
    weekly: {
      targetMinutes:
        context.weeklyGoal,
      completedMinutes:
        plan.weeklyCompletedMinutes,
      remainingMinutes:
        plan.weeklyRemainingMinutes,
    },
  }
}

export function getAgentRecoverableRoutines(
  context: AgentToolContext,
) {
  const now =
    context.now ??
    new Date()

  return getRecoverableRoutineOccurrences(
    context.routineItems,
    context.sessions,
    now,
  ).map(
    (occurrence) => ({
      itemId:
        occurrence.item.id,
      title:
        occurrence.item.title,
      subjectId:
        occurrence.item
          .subjectId,
      originalDate:
        occurrence.dateKey,
      remainingMinutes:
        occurrence.remainingMinutes,
    }),
  )
}
