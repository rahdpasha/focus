import test from 'node:test'
import assert from 'node:assert/strict'

import {
  executeAgentProposal,
  parseAgentProposal,
} from '../src/ai/agentProposal.ts'

const subjects = [
  {
    id: 'se',
    name: 'Software Engineering',
    color: '#111111',
  },
  {
    id: 'history',
    name: 'History',
    color: '#222222',
  },
]

test('unknown proposals are dropped', () => {
  assert.equal(
    parseAgentProposal(
      {
        tool: 'delete_everything',
      },
      subjects,
    ),
    undefined,
  )
})

test('invalid subject proposals are dropped', () => {
  assert.equal(
    parseAgentProposal(
      {
        tool: 'prepare_focus_session',
        subjectId: 'missing',
        minutes: 45,
      },
      subjects,
    ),
    undefined,
  )
})

test('focus proposal minutes are clamped', () => {
  const proposal =
    parseAgentProposal(
      {
        tool: 'prepare_focus_session',
        subjectId: 'se',
        minutes: 999,
      },
      subjects,
    )

  assert.equal(
    proposal?.tool,
    'prepare_focus_session',
  )
  assert.equal(
    proposal?.minutes,
    120,
  )
})

test('daily-goal proposal is bounded', () => {
  const proposal =
    parseAgentProposal(
      {
        tool: 'change_daily_goal',
        minutes: 900,
      },
      subjects,
    )

  assert.deepEqual(
    proposal,
    {
      tool: 'change_daily_goal',
      minutes: 720,
    },
  )
})

test('create-goal proposal validates deadline and subject', () => {
  const proposal =
    parseAgentProposal(
      {
        tool: 'create_goal',
        title: 'Finish SE review',
        subjectId: 'se',
        targetMinutes: 180,
        deadline:
          '2026-10-10T18:00:00.000Z',
        priority: 'high',
      },
      subjects,
    )

  assert.equal(
    proposal?.tool,
    'create_goal',
  )
  assert.equal(
    proposal?.subjectId,
    'se',
  )
  assert.equal(
    proposal?.priority,
    'high',
  )
})

test('routine proposal normalizes days and recovery', () => {
  const proposal =
    parseAgentProposal(
      {
        tool: 'create_routine',
        title: 'History review',
        subjectId: 'history',
        targetMinutes: 30,
        mode: 'fixed',
        daysOfWeek: [
          1,
          1,
          3,
          9,
        ],
        recoveryDays: 8,
      },
      subjects,
    )

  assert.equal(
    proposal?.tool,
    'create_routine',
  )

  if (
    proposal?.tool !==
    'create_routine'
  ) {
    assert.fail(
      'Expected routine proposal',
    )
  }

  assert.deepEqual(
    proposal.daysOfWeek,
    [1, 3],
  )
  assert.equal(
    proposal.recoveryDays,
    3,
  )
})

test('proposal executes only through the supplied confirmation handler', () => {
  let calls = 0
  let received = 0

  const proposal =
    parseAgentProposal(
      {
        tool: 'change_daily_goal',
        minutes: 180,
      },
      subjects,
    )

  assert.ok(proposal)
  assert.equal(calls, 0)

  executeAgentProposal(
    proposal,
    {
      onStartSession() {
        assert.fail(
          'Unexpected session handler',
        )
      },
      onDailyGoalChange(
        minutes,
      ) {
        calls += 1
        received = minutes
      },
      onAddAdvancedGoal() {
        assert.fail(
          'Unexpected goal handler',
        )
      },
      onAddRoutineItem() {
        assert.fail(
          'Unexpected routine handler',
        )
      },
    },
  )

  assert.equal(calls, 1)
  assert.equal(received, 180)
})
