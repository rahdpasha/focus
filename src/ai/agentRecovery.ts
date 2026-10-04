import type { AdvisorContext } from './advisorContext'
import {
  parseAgentProposal,
  type AgentProposal,
} from './agentProposal.ts'

function normalize(value: string): string {
  return value.trim().toLowerCase()
}

function extractMinutes(question: string): number | null {
  const match =
    normalize(question).match(
      /\b(\d{2,5})\s*(?:m|min|mins|minute|minutes)?\b/,
    )

  if (!match) return null

  const value = Number(match[1])

  return Number.isFinite(value)
    ? value
    : null
}

export function recoverExplicitGoalUpdateProposal(
  question: string,
  context: AdvisorContext,
  subjectIdHint?: string,
): AgentProposal | undefined {
  const normalizedQuestion =
    normalize(question)

  if (
    !/\b(change|update|set)\b/.test(
      normalizedQuestion,
    )
  ) {
    return undefined
  }

  const requestedMinutes =
    extractMinutes(question)

  if (requestedMinutes === null) {
    return undefined
  }

  const matches =
    context.advancedGoals.filter(
      (goal) => {
        const title =
          normalize(goal.title)

        const subjectName =
          goal.subjectId
            ? normalize(
                context.subjects.find(
                  (subject) =>
                    subject.id ===
                    goal.subjectId,
                )?.name ?? '',
              )
            : ''

        return Boolean(
          (
            title &&
            normalizedQuestion.includes(
              title,
            )
          ) ||
          (
            subjectName &&
            normalizedQuestion.includes(
              subjectName,
            )
          ) ||
          (
            subjectIdHint &&
            goal.subjectId ===
              subjectIdHint
          ),
        )
      },
    )

  if (matches.length !== 1) {
    return undefined
  }

  const goal = matches[0]

  return parseAgentProposal(
    {
      tool: 'update_goal',
      targetId: goal.id,
      title: goal.title,
      subjectId:
        goal.subjectId ?? '',
      targetMinutes:
        requestedMinutes,
      deadline:
        goal.deadline,
      priority:
        goal.priority,
      status:
        goal.status,
    },
    context.subjects,
    context.advancedGoals.map(
      (item) => ({
        id: item.id,
        title: item.title,
        subjectId:
          item.subjectId,
        targetMinutes:
          item.targetMinutes,
        deadline:
          item.deadline,
        priority:
          item.priority,
        status:
          item.status,
        createdAt:
          context.generatedAt,
      }),
    ),
    context.routines.all.map(
      (routine) => ({
        id: routine.id,
        title: routine.title,
        subjectId:
          routine.subjectId,
        targetMinutes:
          routine.targetMinutes,
        mode:
          routine.mode,
        rotationOrder: 0,
        daysOfWeek:
          routine.daysOfWeek,
        recoveryDays:
          routine.recoveryDays,
        enabled:
          routine.enabled,
        createdAt:
          context.generatedAt,
      }),
    ),
  )
}


export function recoverExplicitRoutineUpdateProposal(
  question: string,
  context: AdvisorContext,
): AgentProposal | undefined {
  const normalizedQuestion =
    normalize(question)

  if (
    !/\b(change|update|set)\b/.test(
      normalizedQuestion,
    )
  ) {
    return undefined
  }

  const requestedMinutes =
    extractMinutes(question)

  if (requestedMinutes === null) {
    return undefined
  }

  const matches =
    context.routines.all.filter(
      (routine) => {
        const title =
          normalize(
            routine.title,
          )

        const subjectName =
          normalize(
            context.subjects.find(
              (subject) =>
                subject.id ===
                routine.subjectId,
            )?.name ?? '',
          )

        return Boolean(
          (
            title &&
            normalizedQuestion.includes(
              title,
            )
          ) ||
          (
            subjectName &&
            normalizedQuestion.includes(
              subjectName,
            )
          ),
        )
      },
    )

  if (matches.length !== 1) {
    return undefined
  }

  const routine =
    matches[0]

  return parseAgentProposal(
    {
      tool: 'update_routine',
      targetId:
        routine.id,
      title:
        routine.title,
      subjectId:
        routine.subjectId,
      targetMinutes:
        requestedMinutes,
      mode:
        routine.mode,
      daysOfWeek:
        routine.daysOfWeek,
      recoveryDays:
        routine.recoveryDays,
      enabled:
        routine.enabled,
    },
    context.subjects,
    context.advancedGoals.map(
      (item) => ({
        id: item.id,
        title: item.title,
        subjectId:
          item.subjectId,
        targetMinutes:
          item.targetMinutes,
        deadline:
          item.deadline,
        priority:
          item.priority,
        status:
          item.status,
        createdAt:
          context.generatedAt,
      }),
    ),
    context.routines.all.map(
      (item) => ({
        id: item.id,
        title: item.title,
        subjectId:
          item.subjectId,
        targetMinutes:
          item.targetMinutes,
        mode: item.mode,
        rotationOrder: 0,
        daysOfWeek:
          item.daysOfWeek,
        recoveryDays:
          item.recoveryDays,
        enabled:
          item.enabled,
        createdAt:
          context.generatedAt,
      }),
    ),
  )
}


export function recoverExplicitGoalCreateProposal(
  question: string,
  context: AdvisorContext,
  subjectIdHint?: string,
): AgentProposal | undefined {
  const normalizedQuestion =
    normalize(question)

  if (
    !/\b(change|update|set|create|add)\b/.test(
      normalizedQuestion,
    )
  ) {
    return undefined
  }

  const requestedMinutes =
    extractMinutes(question)

  if (requestedMinutes === null) {
    return undefined
  }

  const subject =
    subjectIdHint
      ? context.subjects.find(
          (item) =>
            item.id ===
            subjectIdHint,
        )
      : context.subjects.find(
          (item) =>
            normalizedQuestion.includes(
              normalize(item.name),
            ),
        )

  if (!subject) {
    return undefined
  }

  const existingMatches =
    context.advancedGoals.filter(
      (goal) =>
        goal.subjectId ===
        subject.id,
    )

  if (existingMatches.length > 0) {
    return undefined
  }

  const deadline =
    new Date(
      new Date(
        context.generatedAt,
      ).getTime() +
        30 *
          24 *
          60 *
          60 *
          1000,
    ).toISOString()

  return parseAgentProposal(
    {
      tool: 'create_goal',
      title: subject.name,
      subjectId: subject.id,
      targetMinutes:
        requestedMinutes,
      deadline,
      priority: 'medium',
    },
    context.subjects,
  )
}
