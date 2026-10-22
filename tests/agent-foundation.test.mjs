import test from 'node:test'
import assert from 'node:assert/strict'

import {
  AGENT_READ_TOOL_NAMES,
  getAgentActiveGoals,
  getAgentRecentSessions,
  getAgentTodayPlan,
} from '../src/ai/agentTools.ts'
import {
  requiresUserConfirmation,
} from '../src/ai/agentPolicy.ts'

const NOW = new Date('2026-10-01T12:00:00.000Z')

function context(overrides = {}) {
  return {
    sessions: [],
    subjects: [
      {
        id: 'net',
        name: 'Networks',
        color: '#111111',
      },
      {
        id: 'ai',
        name: 'AI',
        color: '#222222',
      },
    ],
    dailyGoal: 120,
    weeklyGoal: 600,
    advancedGoals: [],
    routineItems: [],
    now: NOW,
    ...overrides,
  }
}

test('V5 agent exposes the planned read-only tool surface', () => {
  assert.deepEqual(
    AGENT_READ_TOOL_NAMES,
    [
      'get_today_plan',
      'get_subjects',
      'get_active_goals',
      'get_routines',
      'get_recent_sessions',
      'get_week_progress',
      'get_recoverable_routines',
    ],
  )
})

test('V5 agent today-plan tool uses the deterministic planner', () => {
  const result =
    getAgentTodayPlan(
      context({
        routineItems: [
          {
            id: 'net-routine',
            title: 'Networks',
            subjectId: 'net',
            targetMinutes: 50,
            mode: 'fixed',
            rotationOrder: 0,
            daysOfWeek: [4],
            recoveryDays: 1,
            enabled: true,
            createdAt: '2026-09-01T00:00:00.000Z',
          },
        ],
      }),
    )

  assert.equal(
    result.items[0].subjectId,
    'net',
  )
  assert.equal(
    result.items[0].reasonCode,
    'routine_due',
  )
})

test('V5 agent recent-session tool excludes private notes and subtasks', () => {
  const result =
    getAgentRecentSessions(
      context({
        sessions: [
          {
            id: 'session-1',
            subjectId: 'net',
            subjectName: 'Networks',
            subjectColor: '#111111',
            duration: 1500,
            actualDuration: 1500,
            completedAt: new Date(
              '2026-10-01T10:00:00.000Z',
            ),
            completed: true,
            interruptions: 1,
            totalPausedSeconds: 15,
            notes: 'private note',
            subtasks: [
              {
                id: 'secret-task',
                text: 'private subtask',
                completed: false,
              },
            ],
          },
        ],
      }),
    )

  assert.equal(
    result.length,
    1,
  )
  assert.equal(
    Object.hasOwn(
      result[0],
      'notes',
    ),
    false,
  )
  assert.equal(
    Object.hasOwn(
      result[0],
      'subtasks',
    ),
    false,
  )
})

test('V5 agent active-goal tool returns calculated progress', () => {
  const result =
    getAgentActiveGoals(
      context({
        sessions: [
          {
            id: 'session-1',
            subjectId: 'net',
            subjectName: 'Networks',
            subjectColor: '#111111',
            duration: 1800,
            actualDuration: 1800,
            completedAt: new Date(
              '2026-09-30T10:00:00.000Z',
            ),
            completed: true,
            interruptions: 0,
            totalPausedSeconds: 0,
          },
        ],
        advancedGoals: [
          {
            id: 'goal-1',
            title: 'Networks exam',
            subjectId: 'net',
            targetMinutes: 120,
            deadline: '2026-10-05T23:59:59.000Z',
            priority: 'high',
            status: 'active',
            createdAt: '2026-09-20T00:00:00.000Z',
          },
        ],
      }),
    )

  assert.equal(
    result[0].completedMinutes,
    30,
  )
  assert.equal(
    result[0].remainingMinutes,
    90,
  )
})

test('V5 agent requires confirmation for every write action', () => {
  assert.equal(
    requiresUserConfirmation({
      kind: 'read',
      tool: 'get_today_plan',
    }),
    false,
  )

  for (const tool of [
    'create_goal',
    'update_goal',
    'create_routine',
    'update_routine',
    'prepare_focus_session',
    'change_daily_goal',
  ]) {
    assert.equal(
      requiresUserConfirmation({
        kind: 'write',
        tool,
      }),
      true,
    )
  }
})
