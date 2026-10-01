import test from 'node:test'
import assert from 'node:assert/strict'

import { getStudyPlan } from '../src/utils/studyPlan.ts'

const NOW = new Date('2026-10-01T12:00:00.000Z')

const subjects = [
  { id: 'net', name: 'Networks', color: '#111111' },
  { id: 'ai', name: 'AI', color: '#222222' },
  { id: 'os', name: 'Operating Systems', color: '#333333' },
  { id: 'se', name: 'Software Engineering', color: '#444444' },
  { id: 'mm', name: 'Multimedia', color: '#555555' },
  { id: 'bd', name: 'Big Data', color: '#666666' },
]

function completedSession({
  id,
  subjectId,
  minutes,
  completedAt,
  routineItemId,
  routineDate,
}) {
  const subject = subjects.find((item) => item.id === subjectId)

  return {
    id,
    subjectId,
    subjectName: subject?.name ?? subjectId,
    subjectColor: subject?.color ?? '#000000',
    duration: minutes * 60,
    actualDuration: minutes * 60,
    completedAt: new Date(completedAt),
    completed: true,
    interruptions: 0,
    totalPausedSeconds: 0,
    routineItemId,
    routineDate,
  }
}

function routine({
  id,
  subjectId,
  targetMinutes = 45,
  daysOfWeek = [4],
  recoveryDays = 1,
}) {
  return {
    id,
    title: id,
    subjectId,
    targetMinutes,
    mode: 'fixed',
    rotationOrder: 0,
    daysOfWeek,
    recoveryDays,
    enabled: true,
    createdAt: '2026-09-01T00:00:00.000Z',
  }
}

function goal({
  id,
  subjectId,
  deadline,
  targetMinutes = 120,
  priority = 'medium',
  status = 'active',
}) {
  return {
    id,
    title: id,
    subjectId,
    targetMinutes,
    deadline,
    priority,
    status,
    createdAt: '2026-09-20T00:00:00.000Z',
  }
}

function plan(overrides = {}) {
  return getStudyPlan({
    sessions: [],
    subjects,
    weeklyGoal: 600,
    dailyGoal: 120,
    routineItems: [],
    advancedGoals: [],
    now: NOW,
    ...overrides,
  })
}

test('V5 planner puts an unfinished routine due today first', () => {
  const result = plan({
    routineItems: [
      routine({
        id: 'net-routine',
        subjectId: 'net',
        targetMinutes: 60,
      }),
    ],
  })

  assert.equal(result.items[0].subjectId, 'net')
  assert.equal(result.items[0].reasonCode, 'routine_due')
  assert.equal(result.items[0].minutes, 60)
  assert.deepEqual(result.items[0].routineContext, {
    itemId: 'net-routine',
    routineDate: '2026-10-01',
  })
})

test('V5 planner does not emit routine_due after that routine is satisfied', () => {
  const result = plan({
    sessions: [
      completedSession({
        id: 'done',
        subjectId: 'net',
        minutes: 60,
        completedAt: '2026-10-01T09:00:00.000Z',
        routineItemId: 'net-routine',
        routineDate: '2026-10-01',
      }),
    ],
    routineItems: [
      routine({
        id: 'net-routine',
        subjectId: 'net',
        targetMinutes: 60,
      }),
    ],
  })

  assert.equal(
    result.items.some(
      (item) =>
        item.subjectId === 'net' &&
        item.reasonCode === 'routine_due',
    ),
    false,
  )
})

test('V5 planner includes bounded recovery work from a missed routine', () => {
  const result = plan({
    routineItems: [
      routine({
        id: 'ai-recovery',
        subjectId: 'ai',
        targetMinutes: 80,
        daysOfWeek: [3],
        recoveryDays: 2,
      }),
    ],
  })

  const recovery = result.items.find(
    (item) => item.subjectId === 'ai',
  )

  assert.ok(recovery)
  assert.equal(recovery.reasonCode, 'recovery_due')
  assert.equal(recovery.minutes, 45)
  assert.deepEqual(recovery.routineContext, {
    itemId: 'ai-recovery',
    routineDate: '2026-09-30',
  })
})

test('V5 planner ranks a near goal deadline above a distant deadline', () => {
  const result = plan({
    advancedGoals: [
      goal({
        id: 'net-near',
        subjectId: 'net',
        deadline: '2026-10-02T23:59:59.000Z',
        priority: 'medium',
      }),
      goal({
        id: 'ai-later',
        subjectId: 'ai',
        deadline: '2026-10-20T23:59:59.000Z',
        priority: 'medium',
      }),
    ],
  })

  assert.equal(result.items[0].subjectId, 'net')
  assert.equal(result.items[0].reasonCode, 'goal_deadline')
})

test('V5 planner ignores completed goals', () => {
  const result = plan({
    advancedGoals: [
      goal({
        id: 'finished',
        subjectId: 'net',
        deadline: '2026-10-02T23:59:59.000Z',
        status: 'completed',
      }),
    ],
  })

  assert.equal(
    result.items.some(
      (item) =>
        item.reasonCode === 'goal_deadline' ||
        item.reasonCode === 'goal_gap',
    ),
    false,
  )
})

test('V5 planner merges multiple signals for the same subject', () => {
  const result = plan({
    routineItems: [
      routine({
        id: 'net-routine',
        subjectId: 'net',
        targetMinutes: 45,
      }),
    ],
    advancedGoals: [
      goal({
        id: 'net-goal',
        subjectId: 'net',
        deadline: '2026-10-02T23:59:59.000Z',
        priority: 'high',
      }),
    ],
  })

  const networkBlocks =
    result.items.filter(
      (item) =>
        item.subjectId === 'net',
    )

  assert.equal(networkBlocks.length, 1)
  assert.equal(networkBlocks[0].reasonCode, 'routine_due')
  assert.ok(networkBlocks[0].reasons.includes('goal_deadline'))
})

test('V5 planner returns no more than five positive bounded blocks', () => {
  const result = plan({
    routineItems: subjects.map(
      (subject, index) =>
        routine({
          id: 'routine-' + index,
          subjectId: subject.id,
          targetMinutes: 120,
        }),
    ),
    dailyGoal: 240,
  })

  assert.ok(result.items.length <= 5)

  for (const item of result.items) {
    assert.ok(item.minutes > 0)
    assert.ok(item.minutes <= 90)
  }

  assert.ok(result.totalPlannedTodayMinutes <= 240)
})

test('V5 planner is deterministic for the same inputs and explicit date', () => {
  const input = {
    sessions: [
      completedSession({
        id: 'net-session',
        subjectId: 'net',
        minutes: 25,
        completedAt: '2026-09-29T09:00:00.000Z',
      }),
    ],
    subjects,
    weeklyGoal: 600,
    dailyGoal: 120,
    routineItems: [
      routine({
        id: 'ai-routine',
        subjectId: 'ai',
      }),
    ],
    advancedGoals: [
      goal({
        id: 'net-goal',
        subjectId: 'net',
        deadline: '2026-10-03T23:59:59.000Z',
      }),
    ],
    now: NOW,
  }

  assert.deepEqual(
    getStudyPlan(input),
    getStudyPlan(input),
  )
})

test('V5 planner returns no fake plan when no subjects exist', () => {
  const result = getStudyPlan({
    sessions: [],
    subjects: [],
    weeklyGoal: 600,
    dailyGoal: 120,
    routineItems: [],
    advancedGoals: [],
    now: NOW,
  })

  assert.deepEqual(result.items, [])
  assert.equal(result.mainPrioritySubjectId, undefined)
})
