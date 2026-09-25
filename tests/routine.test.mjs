import test from 'node:test'
import assert from 'node:assert/strict'

import {
  getRecoverableRoutineOccurrences,
  getRotationItemForDate,
  getRoutineItemsForDate,
  getRoutineMinutesForDate,
  getRoutineStatus,
  getRoutineStreakStats,
} from '../src/utils/routine.ts'

const fixed = {
  id: 'fixed-cs',
  title: 'CS',
  subjectId: 'cs',
  targetMinutes: 25,
  mode: 'fixed',
  rotationOrder: 0,
  daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
  recoveryDays: 0,
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
  daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
  recoveryDays: 0,
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
    new Date(2026, 8, 25, 12)
  const today =
    new Date(2026, 8, 26, 12)

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

test('routine history does not mark days before an item was created', () => {
  const beforeCreation =
    new Date(2026, 8, 24, 12)
  const afterCreation =
    new Date(2026, 8, 25, 12)

  assert.equal(
    getRoutineStatus(
      fixed,
      [fixed],
      [],
      beforeCreation,
      afterCreation,
    ),
    'off',
  )
})

test('fixed routine rules honor selected weekdays', () => {
  const weekdaysOnly = {
    ...fixed,
    daysOfWeek: [1, 3, 5],
    recoveryDays: 1,
  }

  const friday =
    new Date(2026, 8, 25, 12)
  const saturday =
    new Date(2026, 8, 26, 12)
  const monday =
    new Date(2026, 8, 28, 12)

  assert.deepEqual(
    getRoutineItemsForDate(
      [weekdaysOnly],
      friday,
    ).map((item) => item.id),
    ['fixed-cs'],
  )

  assert.equal(
    getRoutineItemsForDate(
      [weekdaysOnly],
      saturday,
    ).length,
    0,
  )

  assert.deepEqual(
    getRoutineItemsForDate(
      [weekdaysOnly],
      monday,
    ).map((item) => item.id),
    ['fixed-cs'],
  )
})

test('missed routine can be recovered by a tagged later session', () => {
  const recoverableItem = {
    ...fixed,
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    recoveryDays: 1,
  }

  const missedDate =
    new Date(2026, 8, 25, 12)
  const nextDay =
    new Date(2026, 8, 26, 12)

  assert.equal(
    getRoutineStatus(
      recoverableItem,
      [recoverableItem],
      [],
      missedDate,
      nextDay,
    ),
    'recoverable',
  )

  const queue =
    getRecoverableRoutineOccurrences(
      [recoverableItem],
      [],
      nextDay,
    )

  assert.equal(queue.length, 1)
  assert.equal(
    queue[0].dateKey,
    '2026-09-25',
  )
  assert.equal(
    queue[0].remainingMinutes,
    25,
  )

  const recoverySession = {
    id: 'recovery-session',
    subjectId: 'cs',
    subjectName: 'CS',
    subjectColor: '#111111',
    duration: 25 * 60,
    actualDuration: 25 * 60,
    completedAt:
      new Date(2026, 8, 26, 10),
    completed: true,
    interruptions: 0,
    totalPausedSeconds: 0,
    routineItemId: 'fixed-cs',
    routineDate: '2026-09-25',
  }

  assert.equal(
    getRoutineStatus(
      recoverableItem,
      [recoverableItem],
      [recoverySession],
      missedDate,
      nextDay,
    ),
    'recovered',
  )

  const streak =
    getRoutineStreakStats(
      [recoverableItem],
      [recoverySession],
      nextDay,
    )

  assert.equal(streak.current, 1)
  assert.equal(streak.recovered, 1)
  assert.equal(streak.atRisk, false)
})

test('expired recovery window becomes a real miss', () => {
  const recoverableItem = {
    ...fixed,
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    recoveryDays: 1,
  }

  assert.equal(
    getRoutineStatus(
      recoverableItem,
      [recoverableItem],
      [],
      new Date(2026, 8, 25, 12),
      new Date(2026, 8, 27, 12),
    ),
    'missed',
  )
})



test('rotation advances only across scheduled rotation days', () => {
  const rotationDays = [1, 3, 5]
  const items = [
    {
      ...psychology,
      daysOfWeek: rotationDays,
      recoveryDays: 1,
      createdAt: '2026-09-28T08:00:00.000Z',
    },
    {
      ...history,
      daysOfWeek: rotationDays,
      recoveryDays: 1,
      createdAt: '2026-09-28T08:00:00.000Z',
    },
    {
      ...history,
      id: 'rotation-philosophy',
      title: 'Philosophy',
      subjectId: 'philosophy',
      rotationOrder: 2,
      daysOfWeek: rotationDays,
      recoveryDays: 1,
      createdAt: '2026-09-28T08:00:00.000Z',
    },
  ]

  const monday = new Date(2026, 8, 28, 12)
  const tuesday = new Date(2026, 8, 29, 12)
  const wednesday = new Date(2026, 8, 30, 12)
  const friday = new Date(2026, 9, 2, 12)

  assert.equal(getRotationItemForDate(items, monday)?.title, 'Psychology')
  assert.equal(getRotationItemForDate(items, tuesday), null)
  assert.equal(getRotationItemForDate(items, wednesday)?.title, 'History')
  assert.equal(getRotationItemForDate(items, friday)?.title, 'Philosophy')
})

test('legacy routine items without schedule fields default to every day', () => {
  const legacy = {
    ...psychology,
    createdAt: '2026-09-25T08:00:00.000Z',
  }

  assert.equal(
    getRoutineItemsForDate([legacy], new Date(2026, 8, 26, 12))[0]?.id,
    legacy.id,
  )
  assert.equal(
    getRoutineItemsForDate([legacy], new Date(2026, 8, 27, 12))[0]?.id,
    legacy.id,
  )
})

test('recovery minutes stay attached to the original routine date', () => {
  const item = {
    ...fixed,
    recoveryDays: 1,
  }
  const yesterday = new Date(2026, 8, 25, 12)
  const today = new Date(2026, 8, 26, 12)
  const recoverySession = {
    id: 'recovery-isolated',
    subjectId: 'cs',
    subjectName: 'CS',
    subjectColor: '#111111',
    duration: 25 * 60,
    actualDuration: 25 * 60,
    completedAt: new Date(2026, 8, 26, 10),
    completed: true,
    interruptions: 0,
    totalPausedSeconds: 0,
    routineItemId: item.id,
    routineDate: '2026-09-25',
  }

  assert.equal(getRoutineMinutesForDate(item, [recoverySession], yesterday), 25)
  assert.equal(getRoutineMinutesForDate(item, [recoverySession], today), 0)
  assert.equal(
    getRoutineStatus(item, [item], [recoverySession], yesterday, today),
    'recovered',
  )
  assert.equal(
    getRoutineStatus(item, [item], [recoverySession], today, today),
    'pending',
  )
})

test('streaks skip off days and include recovered successful days', () => {
  const item = {
    ...fixed,
    daysOfWeek: [1, 3, 5],
    recoveryDays: 2,
    createdAt: '2026-09-28T08:00:00.000Z',
  }

  const sessions = [
    {
      id: 'monday',
      subjectId: 'cs',
      subjectName: 'CS',
      subjectColor: '#111111',
      duration: 25 * 60,
      actualDuration: 25 * 60,
      completedAt: new Date(2026, 8, 28, 10),
      completed: true,
      interruptions: 0,
      totalPausedSeconds: 0,
    },
    {
      id: 'wednesday-recovery',
      subjectId: 'cs',
      subjectName: 'CS',
      subjectColor: '#111111',
      duration: 25 * 60,
      actualDuration: 25 * 60,
      completedAt: new Date(2026, 9, 1, 10),
      completed: true,
      interruptions: 0,
      totalPausedSeconds: 0,
      routineItemId: item.id,
      routineDate: '2026-09-30',
    },
    {
      id: 'friday',
      subjectId: 'cs',
      subjectName: 'CS',
      subjectColor: '#111111',
      duration: 25 * 60,
      actualDuration: 25 * 60,
      completedAt: new Date(2026, 9, 2, 10),
      completed: true,
      interruptions: 0,
      totalPausedSeconds: 0,
    },
  ]

  const streak = getRoutineStreakStats(
    [item],
    sessions,
    new Date(2026, 9, 2, 12),
  )

  assert.equal(streak.current, 3)
  assert.equal(streak.best, 3)
  assert.equal(streak.recovered, 1)
})
