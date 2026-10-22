import test from 'node:test'
import assert from 'node:assert/strict'

import {
  extractStudyTimeBudget,
} from '../src/ai/timeBudget.ts'
import {
  getStudyPlan,
} from '../src/utils/studyPlan.ts'

const subjects = [
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
]

const now =
  new Date(
    '2026-10-01T12:00:00.000Z',
  )

test('V5 parses English minute and hour budgets', () => {
  assert.equal(
    extractStudyTimeBudget(
      'I have 45 minutes tonight',
    ),
    45,
  )

  assert.equal(
    extractStudyTimeBudget(
      'I have 2 hours',
    ),
    120,
  )

  assert.equal(
    extractStudyTimeBudget(
      'I have 1 hour 30 minutes',
    ),
    90,
  )
})

test('V5 parses Sorani time budgets with Arabic digits', () => {
  assert.equal(
    extractStudyTimeBudget(
      'تەنها ٤٥ خولەکم هەیە',
    ),
    45,
  )

  assert.equal(
    extractStudyTimeBudget(
      '٢ کاتژمێرم هەیە',
    ),
    120,
  )
})

test('V5 planner never exceeds an explicit available-time budget', () => {
  const result =
    getStudyPlan({
      sessions: [],
      subjects,
      dailyGoal: 120,
      weeklyGoal: 600,
      availableMinutes: 45,
      now,
      advancedGoals: [],
      routineItems: [
        {
          id: 'net-routine',
          title: 'Networks',
          subjectId: 'net',
          targetMinutes: 60,
          mode: 'fixed',
          rotationOrder: 0,
          daysOfWeek: [4],
          recoveryDays: 1,
          enabled: true,
          createdAt:
            '2026-09-01T00:00:00.000Z',
        },
        {
          id: 'ai-routine',
          title: 'AI',
          subjectId: 'ai',
          targetMinutes: 45,
          mode: 'fixed',
          rotationOrder: 1,
          daysOfWeek: [4],
          recoveryDays: 1,
          enabled: true,
          createdAt:
            '2026-09-01T00:00:00.000Z',
        },
      ],
    })

  assert.equal(
    result.totalPlannedTodayMinutes,
    45,
  )

  assert.equal(
    result.items[0].minutes,
    45,
  )
})
