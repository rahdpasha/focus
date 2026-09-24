import { supabase } from '../api/supabaseClient'
import type {
  AdvisorContext,
} from './advisorContext'

export interface AiAdvisorResponse {
  source: 'ai' | 'local'
  headline: string
  answer: string
  reasons: string[]
  confidence:
    | 'high'
    | 'medium'
    | 'low'
  action: {
    subjectId?: string
    subjectName?: string
    minutes: number
  }
}

function getUrgentGoal(
  context: AdvisorContext,
): AdvisorContext['advancedGoals'][number] | undefined {
  const generatedAt =
    new Date(
      context.generatedAt,
    ).getTime()

  return context.advancedGoals
    .filter(
      (goal) => {
        if (
          goal.status !== 'active' ||
          goal.remainingMinutes <= 0
        ) {
          return false
        }

        if (goal.overdue) {
          return true
        }

        const deadline =
          new Date(
            goal.deadline,
          ).getTime()

        if (
          !Number.isFinite(deadline) ||
          !Number.isFinite(generatedAt)
        ) {
          return false
        }

        const hoursRemaining =
          (deadline - generatedAt) /
          3_600_000

        return (
          hoursRemaining <= 48 ||
          (
            goal.priority === 'high' &&
            hoursRemaining <= 168
          )
        )
      },
    )
    .sort(
      (a, b) => {
        if (a.overdue !== b.overdue) {
          return a.overdue ? -1 : 1
        }

        const priorityRank = {
          high: 0,
          medium: 1,
          low: 2,
        } as const

        const priorityDifference =
          priorityRank[a.priority] -
          priorityRank[b.priority]

        if (priorityDifference !== 0) {
          return priorityDifference
        }

        return (
          new Date(
            a.deadline,
          ).getTime() -
          new Date(
            b.deadline,
          ).getTime()
        )
      },
    )[0]
}

function localFallback(
  context: AdvisorContext,
): AiAdvisorResponse {
  const recommended =
    context
      .deterministicRecommendation

  const urgentGoal =
    getUrgentGoal(context)

  const reasons = [
    `${context.today.minutes}/${context.today.goalMinutes} minutes completed today`,
    `${context.week.minutes}/${context.week.goalMinutes} minutes completed this week`,
    `Consistency is ${context.consistency.trend}`,
  ]

  if (urgentGoal) {
    reasons.push(
      `Goal "${urgentGoal.title}"${urgentGoal.subjectName ? ` for ${urgentGoal.subjectName}` : ''} is ${urgentGoal.percent}% complete with ${urgentGoal.remainingMinutes} minutes remaining`,
    )
  }

  if (
    context.bestStudyTime
  ) {
    reasons.push(
      `Your strongest recent study window is ${context.bestStudyTime}`,
    )
  }

  const actionSubjectId =
    urgentGoal?.subjectId ??
    recommended.subjectId
  const actionSubjectName =
    urgentGoal?.subjectName ??
    recommended.subjectName
  const actionMinutes =
    urgentGoal
      ? Math.min(
          recommended.minutes,
          Math.max(
            10,
            urgentGoal.remainingMinutes,
          ),
        )
      : recommended.minutes

  const headline =
    urgentGoal
      ? urgentGoal.overdue
        ? `Recover your overdue goal: ${urgentGoal.title}.`
        : urgentGoal.subjectName
          ? `Prioritize ${urgentGoal.subjectName} for ${urgentGoal.title}.`
          : `Make progress on ${urgentGoal.title}.`
      : recommended.subjectName
        ? `Focus on ${recommended.subjectName} next.`
        : 'Take one focused step next.'

  const answer =
    urgentGoal
      ? `${urgentGoal.remainingMinutes} minutes remain on this goal. Use the next focused block to move it forward.`
      : recommended.summary

  return {
    source: 'local',
    headline,
    answer,
    reasons,
    confidence:
      urgentGoal ||
      recommended.priority ===
        'high'
        ? 'high'
        : 'medium',
    action: {
      subjectId:
        actionSubjectId,
      subjectName:
        actionSubjectName,
      minutes:
        actionMinutes,
    },
  }
}

export async function askStudyAdvisor(
  question: string,
  context: AdvisorContext,
): Promise<AiAdvisorResponse> {
  if (!supabase) {
    return localFallback(
      context,
    )
  }

  const { data, error } =
    await supabase.functions.invoke(
      'study-advisor',
      {
        body: {
          question:
            question.trim(),
          context,
        },
      },
    )

  if (
    error ||
    !data ||
    typeof data !== 'object'
  ) {
    return localFallback(
      context,
    )
  }

  const candidate =
    data as Partial<AiAdvisorResponse>

  if (
    typeof candidate.headline !==
      'string' ||
    typeof candidate.answer !==
      'string' ||
    !candidate.action ||
    typeof candidate.action
      .minutes !== 'number'
  ) {
    return localFallback(
      context,
    )
  }

  return {
    source: 'ai',
    headline:
      candidate.headline,
    answer:
      candidate.answer,
    reasons:
      Array.isArray(
        candidate.reasons,
      )
        ? candidate.reasons.filter(
            (
              reason,
            ): reason is string =>
              typeof reason ===
              'string',
          )
        : [],
    confidence:
      candidate.confidence ===
        'high' ||
      candidate.confidence ===
        'low'
        ? candidate.confidence
        : 'medium',
    action: {
      subjectId:
        typeof candidate.action
          .subjectId === 'string'
          ? candidate.action
              .subjectId
          : undefined,
      subjectName:
        typeof candidate.action
          .subjectName === 'string'
          ? candidate.action
              .subjectName
          : undefined,
      minutes:
        Math.max(
          10,
          Math.min(
            120,
            Math.round(
              candidate.action
                .minutes,
            ),
          ),
        ),
    },
  }
}
