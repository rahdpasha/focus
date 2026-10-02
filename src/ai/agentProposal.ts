import type {
  AdvancedGoal,
  RoutineItem,
} from '../storage/types'

export interface AgentProposalSubject {
  id: string
  name: string
}

export type AgentProposal =
  | {
      tool: 'prepare_focus_session'
      subjectId: string
      minutes: number
    }
  | {
      tool: 'change_daily_goal'
      minutes: number
    }
  | {
      tool: 'create_goal'
      title: string
      subjectId?: string
      targetMinutes: number
      deadline: string
      priority: AdvancedGoal['priority']
    }
  | {
      tool: 'create_routine'
      title: string
      subjectId: string
      targetMinutes: number
      mode: RoutineItem['mode']
      daysOfWeek: number[]
      recoveryDays: number
    }
  | {
      tool: 'update_goal'
      targetId: string
      title: string
      subjectId?: string
      targetMinutes: number
      deadline: string
      priority: AdvancedGoal['priority']
      status: AdvancedGoal['status']
    }
  | {
      tool: 'update_routine'
      targetId: string
      title: string
      subjectId: string
      targetMinutes: number
      mode: RoutineItem['mode']
      daysOfWeek: number[]
      recoveryDays: number
      enabled: boolean
    }

export interface AgentProposalHandlers {
  onStartSession: (
    subjectId?: string,
    minutes?: number,
  ) => void
  onDailyGoalChange: (
    value: number,
  ) => void
  onAddAdvancedGoal: (
    title: string,
    targetMinutes: number,
    deadline: string,
    priority: AdvancedGoal['priority'],
    subjectId?: string,
  ) => void
  onAddRoutineItem: (
    title: string,
    subjectId: string,
    targetMinutes: number,
    mode: RoutineItem['mode'],
    daysOfWeek?: number[],
    recoveryDays?: number,
  ) => void
  onUpdateAdvancedGoal: (
    id: string,
    patch: Partial<Omit<AdvancedGoal, 'id' | 'createdAt'>>,
  ) => void
  onUpdateRoutineItem: (
    id: string,
    patch: Partial<Omit<RoutineItem, 'id' | 'createdAt'>>,
  ) => void
}

function clampMinutes(
  value: unknown,
  min: number,
  max: number,
): number | null {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value)
  ) {
    return null
  }

  return Math.min(
    max,
    Math.max(
      min,
      Math.round(value),
    ),
  )
}

function cleanText(
  value: unknown,
  maxLength: number,
): string {
  return typeof value === 'string'
    ? value.trim().slice(0, maxLength)
    : ''
}

function safeSubjectId(
  value: unknown,
  subjects: AgentProposalSubject[],
): string | undefined {
  if (
    typeof value !== 'string'
  ) {
    return undefined
  }

  const id = value.trim()

  return subjects.some(
    (subject) =>
      subject.id === id,
  )
    ? id
    : undefined
}

export function parseAgentProposal(
  value: unknown,
  subjects: AgentProposalSubject[],
  goals: AdvancedGoal[] = [],
  routines: RoutineItem[] = [],
): AgentProposal | undefined {
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value)
  ) {
    return undefined
  }

  const candidate =
    value as Record<
      string,
      unknown
    >

  const tool =
    cleanText(
      candidate.tool,
      40,
    )

  if (
    !tool ||
    tool === 'none'
  ) {
    return undefined
  }

  if (
    tool ===
    'prepare_focus_session'
  ) {
    const subjectId =
      safeSubjectId(
        candidate.subjectId,
        subjects,
      )
    const minutes =
      clampMinutes(
        candidate.minutes,
        10,
        120,
      )

    if (
      !subjectId ||
      minutes === null
    ) {
      return undefined
    }

    return {
      tool,
      subjectId,
      minutes,
    }
  }

  if (
    tool ===
    'change_daily_goal'
  ) {
    const minutes =
      clampMinutes(
        candidate.minutes,
        10,
        720,
      )

    return minutes === null
      ? undefined
      : {
          tool,
          minutes,
        }
  }

  if (
    tool === 'create_goal'
  ) {
    const title =
      cleanText(
        candidate.title,
        120,
      )
    const targetMinutes =
      clampMinutes(
        candidate.targetMinutes,
        10,
        10_080,
      )
    const deadlineText =
      cleanText(
        candidate.deadline,
        80,
      )
    const deadline =
      new Date(
        deadlineText,
      )
    const priority =
      candidate.priority ===
        'high' ||
      candidate.priority ===
        'low'
        ? candidate.priority
        : 'medium'
    const subjectId =
      safeSubjectId(
        candidate.subjectId,
        subjects,
      )

    if (
      !title ||
      targetMinutes ===
        null ||
      !deadlineText ||
      Number.isNaN(
        deadline.getTime(),
      )
    ) {
      return undefined
    }

    return {
      tool,
      title,
      subjectId,
      targetMinutes,
      deadline:
        deadline.toISOString(),
      priority,
    }
  }

  if (
    tool ===
    'update_goal'
  ) {
    const targetId =
      cleanText(
        candidate.targetId,
        120,
      )
    const existing =
      goals.find(
        (goal) =>
          goal.id === targetId,
      )

    if (!existing) {
      return undefined
    }

    const title =
      cleanText(
        candidate.title,
        120,
      ) || existing.title
    const targetMinutes =
      clampMinutes(
        candidate.targetMinutes,
        10,
        10_080,
      ) ??
      existing.targetMinutes
    const deadlineText =
      cleanText(
        candidate.deadline,
        80,
      ) || existing.deadline
    const deadline =
      new Date(
        deadlineText,
      )
    const priority =
      candidate.priority ===
        'high' ||
      candidate.priority ===
        'low'
        ? candidate.priority
        : candidate.priority ===
            'medium'
          ? 'medium'
          : existing.priority
    const requestedSubject =
      cleanText(
        candidate.subjectId,
        120,
      )
    const subjectId =
      requestedSubject
        ? safeSubjectId(
            requestedSubject,
            subjects,
          )
        : existing.subjectId
    const status =
      candidate.status ===
      'completed'
        ? 'completed'
        : candidate.status ===
            'active'
          ? 'active'
          : existing.status

    if (
      Number.isNaN(
        deadline.getTime(),
      ) ||
      (
        requestedSubject &&
        !subjectId
      )
    ) {
      return undefined
    }

    return {
      tool,
      targetId,
      title,
      subjectId,
      targetMinutes,
      deadline:
        deadline.toISOString(),
      priority,
      status,
    }
  }

  if (
    tool ===
    'update_routine'
  ) {
    const targetId =
      cleanText(
        candidate.targetId,
        120,
      )
    const existing =
      routines.find(
        (routine) =>
          routine.id === targetId,
      )

    if (!existing) {
      return undefined
    }

    const title =
      cleanText(
        candidate.title,
        120,
      ) || existing.title
    const requestedSubject =
      cleanText(
        candidate.subjectId,
        120,
      ) || existing.subjectId
    const subjectId =
      safeSubjectId(
        requestedSubject,
        subjects,
      )
    const targetMinutes =
      clampMinutes(
        candidate.targetMinutes,
        10,
        720,
      ) ??
      existing.targetMinutes
    const mode =
      candidate.mode ===
      'rotation'
        ? 'rotation'
        : candidate.mode ===
            'fixed'
          ? 'fixed'
          : existing.mode
    const daysOfWeek =
      Array.isArray(
        candidate.daysOfWeek,
      )
        ? Array.from(
            new Set(
              candidate.daysOfWeek.filter(
                (
                  day,
                ): day is number =>
                  typeof day ===
                    'number' &&
                  Number.isInteger(
                    day,
                  ) &&
                  day >= 0 &&
                  day <= 6,
              ),
            ),
          )
        : [...existing.daysOfWeek]
    const recoveryDays =
      clampMinutes(
        candidate.recoveryDays,
        0,
        3,
      ) ??
      existing.recoveryDays
    const enabled =
      typeof candidate.enabled ===
      'boolean'
        ? candidate.enabled
        : existing.enabled

    if (!subjectId) {
      return undefined
    }

    return {
      tool,
      targetId,
      title,
      subjectId,
      targetMinutes,
      mode,
      daysOfWeek:
        daysOfWeek.length > 0
          ? daysOfWeek
          : [...existing.daysOfWeek],
      recoveryDays,
      enabled,
    }
  }

  if (
    tool ===
    'create_routine'
  ) {
    const title =
      cleanText(
        candidate.title,
        120,
      )
    const subjectId =
      safeSubjectId(
        candidate.subjectId,
        subjects,
      )
    const targetMinutes =
      clampMinutes(
        candidate.targetMinutes,
        10,
        720,
      )
    const mode =
      candidate.mode ===
      'rotation'
        ? 'rotation'
        : 'fixed'
    const daysOfWeek =
      Array.isArray(
        candidate.daysOfWeek,
      )
        ? Array.from(
            new Set(
              candidate.daysOfWeek
                .filter(
                  (
                    day,
                  ): day is number =>
                    typeof day ===
                      'number' &&
                    Number.isInteger(
                      day,
                    ) &&
                    day >= 0 &&
                    day <= 6,
                ),
            ),
          )
        : []
    const recoveryDays =
      clampMinutes(
        candidate.recoveryDays,
        0,
        3,
      )

    if (
      !title ||
      !subjectId ||
      targetMinutes ===
        null ||
      recoveryDays === null
    ) {
      return undefined
    }

    return {
      tool,
      title,
      subjectId,
      targetMinutes,
      mode,
      daysOfWeek:
        daysOfWeek.length > 0
          ? daysOfWeek
          : [
              0,
              1,
              2,
              3,
              4,
              5,
              6,
            ],
      recoveryDays,
    }
  }

  return undefined
}

export function executeAgentProposal(
  proposal: AgentProposal,
  handlers: AgentProposalHandlers,
): void {
  if (
    proposal.tool ===
    'prepare_focus_session'
  ) {
    handlers.onStartSession(
      proposal.subjectId,
      proposal.minutes,
    )
    return
  }

  if (
    proposal.tool ===
    'change_daily_goal'
  ) {
    handlers.onDailyGoalChange(
      proposal.minutes,
    )
    return
  }

  if (
    proposal.tool ===
    'create_goal'
  ) {
    handlers.onAddAdvancedGoal(
      proposal.title,
      proposal.targetMinutes,
      proposal.deadline,
      proposal.priority,
      proposal.subjectId,
    )
    return
  }

  if (
    proposal.tool ===
    'create_routine'
  ) {
    handlers.onAddRoutineItem(
      proposal.title,
      proposal.subjectId,
      proposal.targetMinutes,
      proposal.mode,
      proposal.daysOfWeek,
      proposal.recoveryDays,
    )
    return
  }

  if (
    proposal.tool ===
    'update_goal'
  ) {
    handlers.onUpdateAdvancedGoal(
      proposal.targetId,
      {
        title: proposal.title,
        subjectId:
          proposal.subjectId,
        targetMinutes:
          proposal.targetMinutes,
        deadline:
          proposal.deadline,
        priority:
          proposal.priority,
        status:
          proposal.status,
      },
    )
    return
  }

  handlers.onUpdateRoutineItem(
    proposal.targetId,
    {
      title: proposal.title,
      subjectId:
        proposal.subjectId,
      targetMinutes:
        proposal.targetMinutes,
      mode: proposal.mode,
      daysOfWeek:
        proposal.daysOfWeek,
      recoveryDays:
        proposal.recoveryDays,
      enabled:
        proposal.enabled,
    },
  )
}
