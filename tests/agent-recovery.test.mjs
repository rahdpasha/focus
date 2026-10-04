import test from 'node:test'
import assert from 'node:assert/strict'

import {
  recoverExplicitGoalUpdateProposal,
  recoverExplicitRoutineUpdateProposal,
} from '../src/ai/agentRecovery.ts'

const context = {
  generatedAt:
    '2026-10-02T13:00:00.000Z',
  today: {
    minutes: 50,
    goalMinutes: 180,
    remainingMinutes: 130,
  },
  week: {
    minutes: 340,
    goalMinutes: 1500,
    remainingMinutes: 1160,
    studyDays: 3,
    changePercent: 10,
  },
  consistency: {
    trend: 'improving',
    averageWeeklyMinutes: 900,
  },
  bestStudyTime: '06:00–12:00',
  plan: {
    totalPlannedTodayMinutes: 45,
    mainPrioritySubjectId: 'se',
    items: [],
  },
  routines: {
    all: [
      {
        id: 'routine-history',
        title: 'History',
        subjectId: 'history',
        targetMinutes: 30,
        mode: 'fixed',
        daysOfWeek: [1, 3, 5],
        recoveryDays: 1,
        enabled: true,
      },
    ],
    dueToday: [],
    recoverable: [],
  },
  periods: {
    last7: {
      days: 7,
      minutes: 340,
      sessions: 5,
      activeDays: 3,
      averageSessionMinutes: 68,
      averageInterruptions: 0,
      topSubject:
        'Software Engineering',
    },
    last30: {
      days: 30,
      minutes: 1000,
      sessions: 15,
      activeDays: 10,
      averageSessionMinutes: 67,
      averageInterruptions: 0,
      topSubject:
        'Software Engineering',
    },
    last90: {
      days: 90,
      minutes: 2000,
      sessions: 30,
      activeDays: 20,
      averageSessionMinutes: 67,
      averageInterruptions: 0,
      topSubject:
        'Software Engineering',
    },
  },
  subjects: [
    {
      id: 'se',
      name: 'Software Engineering',
      minutesThisWeek: 200,
      percentageThisWeek: 59,
      sessionsThisWeek: 3,
    },
    {
      id: 'history',
      name: 'History',
      minutesThisWeek: 140,
      percentageThisWeek: 41,
      sessionsThisWeek: 2,
    },
  ],
  advancedGoals: [
    {
      id: 'goal-se',
      title: 'Software Engineering',
      subjectId: 'se',
      subjectName:
        'Software Engineering',
      priority: 'high',
      status: 'active',
      deadline:
        '2026-10-20T00:00:00.000Z',
      targetMinutes: 240,
      completedMinutes: 100,
      remainingMinutes: 140,
      percent: 42,
      overdue: false,
    },
  ],
  recentSessions: [],
  deterministicRecommendation: {
    subjectId: 'se',
    subjectName:
      'Software Engineering',
    minutes: 25,
    summary: 'Continue SE.',
    priority: 'high',
  },
}

test('recovers one exact explicit goal update', () => {
  const proposal =
    recoverExplicitGoalUpdateProposal(
      'Change my existing Software Engineering goal to 300 minutes.',
      context,
    )

  assert.equal(
    proposal?.tool,
    'update_goal',
  )

  if (
    proposal?.tool !==
    'update_goal'
  ) {
    assert.fail(
      'Expected update_goal',
    )
  }

  assert.equal(
    proposal.targetId,
    'goal-se',
  )
  assert.equal(
    proposal.targetMinutes,
    300,
  )
  assert.equal(
    proposal.subjectId,
    'se',
  )
  assert.equal(
    proposal.deadline,
    '2026-10-20T00:00:00.000Z',
  )
})

test('does not infer a write from advice-only wording', () => {
  assert.equal(
    recoverExplicitGoalUpdateProposal(
      'What should I do about Software Engineering?',
      context,
    ),
    undefined,
  )
})

test('does not guess when more than one goal matches', () => {
  const duplicateContext = {
    ...context,
    advancedGoals: [
      ...context.advancedGoals,
      {
        ...context.advancedGoals[0],
        id: 'goal-se-2',
      },
    ],
  }

  assert.equal(
    recoverExplicitGoalUpdateProposal(
      'Update Software Engineering to 300 minutes.',
      duplicateContext,
    ),
    undefined,
  )
})


test('recovers one exact explicit routine update', () => {
  const proposal =
    recoverExplicitRoutineUpdateProposal(
      'Change my History routine to 45 minutes.',
      context,
    )

  assert.equal(
    proposal?.tool,
    'update_routine',
  )

  if (
    proposal?.tool !==
    'update_routine'
  ) {
    assert.fail(
      'Expected update_routine',
    )
  }

  assert.equal(
    proposal.targetId,
    'routine-history',
  )
  assert.equal(
    proposal.targetMinutes,
    45,
  )
  assert.deepEqual(
    proposal.daysOfWeek,
    [1, 3, 5],
  )
  assert.equal(
    proposal.enabled,
    true,
  )
})

test('routine recovery refuses ambiguous matches', () => {
  const duplicateContext = {
    ...context,
    routines: {
      ...context.routines,
      all: [
        ...context.routines.all,
        {
          ...context.routines.all[0],
          id: 'routine-history-2',
        },
      ],
    },
  }

  assert.equal(
    recoverExplicitRoutineUpdateProposal(
      'Update History routine to 45 minutes.',
      duplicateContext,
    ),
    undefined,
  )
})


test('verified subject hint recovers the one matching goal', () => {
  const renamedContext = {
    ...context,
    advancedGoals: [
      {
        ...context.advancedGoals[0],
        title: 'Finish Stage 3 SE',
      },
    ],
  }

  const proposal =
    recoverExplicitGoalUpdateProposal(
      'Change my existing Software Engineering goal to 300 minutes.',
      renamedContext,
      'se',
    )

  assert.equal(
    proposal?.tool,
    'update_goal',
  )

  if (
    proposal?.tool !==
    'update_goal'
  ) {
    assert.fail(
      'Expected update_goal',
    )
  }

  assert.equal(
    proposal.targetId,
    'goal-se',
  )
  assert.equal(
    proposal.targetMinutes,
    300,
  )
})
