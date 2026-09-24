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

function localFallback(
  context: AdvisorContext,
): AiAdvisorResponse {
  const recommended =
    context
      .deterministicRecommendation

  const urgentGoal =
    context.advancedGoals
      .filter(
        (goal) =>
          goal.status === 'active',
      )
      .sort(
        (a, b) =>
          new Date(
            a.deadline,
          ).getTime() -
          new Date(
            b.deadline,
          ).getTime(),
      )[0]

  const reasons = [
    `${context.today.minutes}/${context.today.goalMinutes} minutes completed today`,
    `${context.week.minutes}/${context.week.goalMinutes} minutes completed this week`,
    `Consistency is ${context.consistency.trend}`,
  ]

  if (urgentGoal) {
    reasons.push(
      `Goal "${urgentGoal.title}" is ${urgentGoal.percent}% complete with ${urgentGoal.remainingMinutes} minutes remaining`,
    )
  }

  if (
    context.bestStudyTime
  ) {
    reasons.push(
      `Your strongest recent study window is ${context.bestStudyTime}`,
    )
  }

  return {
    source: 'local',
    headline:
      urgentGoal?.overdue
        ? `Recover your overdue goal: ${urgentGoal.title}.`
        : recommended.subjectName
          ? `Focus on ${recommended.subjectName} next.`
          : 'Take one focused step next.',
    answer:
      recommended.summary,
    reasons,
    confidence:
      recommended.priority ===
      'high'
        ? 'high'
        : 'medium',
    action: {
      subjectId:
        recommended.subjectId,
      subjectName:
        recommended.subjectName,
      minutes:
        recommended.minutes,
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
