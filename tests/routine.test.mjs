import test from 'node:test'
import assert from 'node:assert/strict'

import {
  getRotationItemForDate,
  getRoutineItemsForDate,
  getRoutineMinutesForDate,
  getRoutineStatus,
} from '../src/utils/routine.ts'

const fixed = {
  id: 'fixed-cs',
  title: 'CS',
  subjectId: 'cs',
  targetMinutes: 25,
  mode: 'fixed',
  rotationOrder: 0,
  enabled: true,
  createdAt: '2026-09-25T08:00:00.000Z',
}

const psychology = {
  id: 'rotation-psychology',
  title: 'Psychology',
  subjectId: 'psychology',
  targetMinutes: 25,
  mode: 'rotation',
  rotationOrder: 0,
  enabled: true,
  createdAt: '2026-09-25T08:00:00.000Z',
}

const history = {
  id: 'rotation-history',
  title: 'History',
  subjectId: 'history',
  targetMinutes: 25,
  mode: 'rotation',
  rotationOrder: 1,
  enabled: true,
  createdAt: '2026-09-25T08:00:00.000Z',
}

test('fixed routines appear daily while rotation advances one item per local calendar day', () => {
  const items = [
    fixed,
    psychology,
    history,
  ]

  const dayOne =
    new Date(2026, 8, 25, 12)
  const dayTwo =
    new Date(2026, 8, 26, 12)

  const rotationOne =
    getRotationItemForDate(
      items,
      dayOne,
    )
  const rotationTwo =
    getRotationItemForDate(
      items,
      dayTwo,
    )

  assert.equal(
    rotationOne?.id,
    'rotation-psychology',
  )
  assert.equal(
    rotationTwo?.id,
    'rotation-history',
  )

  assert.deepEqual(
    getRoutineItemsForDate(
      items,
      dayOne,
    ).map((item) => item.id),
    [
      'fixed-cs',
      'rotation-psychology',
    ],
  )
})

test('routine completion aggregates real completed focus time for the linked subject', () => {
  const date =
    new Date(2026, 8, 25, 12)

  const sessions = [
    {
      id: 'one',
      subjectId: 'cs',
      subjectName: 'CS',
      subjectColor: '#111111',
      duration: 15 * 60,
      actualDuration: 15 * 60,
      completedAt:
        new Date(2026, 8, 25, 9),
      completed: true,
      interruptions: 0,
      totalPausedSeconds: 0,
    },
    {
      id: 'two',
      subjectId: 'cs',
      subjectName: 'CS',
      subjectColor: '#111111',
      duration: 10 * 60,
      actualDuration: 10 * 60,
      completedAt:
        new Date(2026, 8, 25, 10),
      completed: true,
      interruptions: 0,
      totalPausedSeconds: 0,
    },
    {
      id: 'wrong-subject',
      subjectId: 'history',
      subjectName: 'History',
      subjectColor: '#222222',
      duration: 60 * 60,
      actualDuration: 60 * 60,
      completedAt:
        new Date(2026, 8, 25, 11),
      completed: true,
      interruptions: 0,
      totalPausedSeconds: 0,
    },
    {
      id: 'incomplete',
      subjectId: 'cs',
      subjectName: 'CS',
      subjectColor: '#111111',
      duration: 25 * 60,
      actualDuration: 20 * 60,
      completedAt:
        new Date(2026, 8, 25, 11, 30),
      completed: false,
      interruptions: 1,
      totalPausedSeconds: 0,
    },
  ]

  assert.equal(
    getRoutineMinutesForDate(
      fixed,
      sessions,
      date,
    ),
    25,
  )

  assert.equal(
    getRoutineStatus(
      fixed,
      [fixed],
      sessions,
      date,
      date,
    ),
    'done',
  )
})

test('unfinished past routine becomes missed instead of pending', () => {
  const yesterday =
    new Date(2026, 8, 24, 12)
  const today =
    new Date(2026, 8, 25, 12)

  assert.equal(
    getRoutineStatus(
      fixed,
      [fixed],
      [],
      yesterday,
      today,
    ),
    'missed',
  )

  assert.equal(
    getRoutineStatus(
      fixed,
      [fixed],
      [],
      today,
      today,
    ),
    'pending',
  )
})
