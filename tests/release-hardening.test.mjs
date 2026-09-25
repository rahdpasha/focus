import test from 'node:test'
import assert from 'node:assert/strict'

import {
  getAdvancedGoalProgress,
} from '../src/utils/advancedGoals.ts'
import {
  createOfflineMutationState,
  mergeOfflineMutations,
} from '../src/storage/offlineSync.ts'

const settings = {
  theme: 'system',
  language: 'en',
  shortBreak: 5,
  longBreak: 15,
  sessionsBeforeLongBreak: 4,
  autoStartBreak: false,
  soundEnabled: true,
  soundVolume: 70,
  notificationsEnabled: true,
}

function snapshot(overrides = {}) {
  return {
    sessions: [],
    subjects: [],
    dailyGoal: 120,
    weeklyGoal: 600,
    weeklyGoalsHistory: {},
    advancedGoals: [],
    routineItems: [],
    activeSubjectId: null,
    settings,
    workspacePreferencesVersion: 1,
    ...overrides,
  }
}

function session({
  id,
  subjectId,
  subjectName,
  subjectColor = '#111111',
  actualDuration,
  completedAt,
}) {
  return {
    id,
    subjectId,
    subjectName,
    subjectColor,
    duration: actualDuration,
    actualDuration,
    completedAt: new Date(completedAt),
    completed: true,
    interruptions: 0,
    totalPausedSeconds: 0,
  }
}

test('subject-scoped goals count only matching sessions inside the goal window', () => {
  const sessions = [
    session({
      id: 'math-in-window',
      subjectId: 'math',
      subjectName: 'Math',
      actualDuration: 30 * 60,
      completedAt: '2026-01-02T10:00:00.000Z',
    }),
    session({
      id: 'english-in-window',
      subjectId: 'english',
      subjectName: 'English',
      actualDuration: 40 * 60,
      completedAt: '2026-01-02T11:00:00.000Z',
    }),
    session({
      id: 'math-before-goal',
      subjectId: 'math',
      subjectName: 'Math',
      actualDuration: 20 * 60,
      completedAt: '2025-12-31T10:00:00.000Z',
    }),
    session({
      id: 'math-after-deadline',
      subjectId: 'math',
      subjectName: 'Math',
      actualDuration: 50 * 60,
      completedAt: '2026-01-06T10:00:00.000Z',
    }),
  ]

  const scoped = getAdvancedGoalProgress(
    {
      id: 'goal-math',
      title: 'Math deadline',
      subjectId: 'math',
      targetMinutes: 60,
      deadline: '2026-01-05T23:59:59.000Z',
      priority: 'high',
      status: 'active',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    sessions,
    new Date('2026-01-03T00:00:00.000Z'),
  )

  assert.equal(scoped.minutes, 30)
  assert.equal(scoped.remainingMinutes, 30)
  assert.equal(scoped.percent, 50)
  assert.equal(scoped.overdue, false)

  const allSubjects = getAdvancedGoalProgress(
    {
      id: 'goal-all',
      title: 'All study',
      targetMinutes: 100,
      deadline: '2026-01-05T23:59:59.000Z',
      priority: 'medium',
      status: 'active',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    sessions,
    new Date('2026-01-03T00:00:00.000Z'),
  )

  assert.equal(allSubjects.minutes, 70)
  assert.equal(allSubjects.remainingMinutes, 30)
  assert.equal(allSubjects.percent, 70)
})

test('offline duplicate subject names reconcile to the cloud subject identity', () => {
  const cloud = snapshot({
    subjects: [
      {
        id: 'cloud-math',
        name: 'Math',
        color: '#123456',
      },
    ],
    activeSubjectId: 'cloud-math',
  })

  const local = snapshot({
    subjects: [
      {
        id: 'local-math',
        name: ' math ',
        color: '#999999',
      },
    ],
    sessions: [
      session({
        id: 'session-1',
        subjectId: 'local-math',
        subjectName: ' math ',
        subjectColor: '#999999',
        actualDuration: 25 * 60,
        completedAt: '2026-01-02T10:00:00.000Z',
      }),
    ],
    advancedGoals: [
      {
        id: 'goal-1',
        title: 'Math goal',
        subjectId: 'local-math',
        targetMinutes: 120,
        deadline: '2026-01-10T00:00:00.000Z',
        priority: 'high',
        status: 'active',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ],
    activeSubjectId: 'local-math',
  })

  const changes = createOfflineMutationState()
  changes.subjectIds.push('local-math')
  changes.sessionIds.push('session-1')
  changes.advancedGoalIds.push('goal-1')

  const merged = mergeOfflineMutations(
    cloud,
    local,
    changes,
  )

  assert.deepEqual(
    merged.subjects.map((subject) => subject.id),
    ['cloud-math'],
  )
  assert.equal(
    merged.sessions[0].subjectId,
    'cloud-math',
  )
  assert.equal(
    merged.sessions[0].subjectName,
    'Math',
  )
  assert.equal(
    merged.sessions[0].subjectColor,
    '#123456',
  )
  assert.equal(
    merged.advancedGoals[0].subjectId,
    'cloud-math',
  )
  assert.equal(
    merged.activeSubjectId,
    'cloud-math',
  )
})

test('offline deletion markers win over stale cloud rows', () => {
  const cloud = snapshot({
    sessions: [
      session({
        id: 'session-delete',
        subjectId: 'math',
        subjectName: 'Math',
        actualDuration: 25 * 60,
        completedAt: '2026-01-02T10:00:00.000Z',
      }),
    ],
    advancedGoals: [
      {
        id: 'goal-delete',
        title: 'Delete me',
        targetMinutes: 60,
        deadline: '2026-01-10T00:00:00.000Z',
        priority: 'low',
        status: 'active',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ],
  })

  const changes = createOfflineMutationState()
  changes.deletedSessionIds.push(
    'session-delete',
  )
  changes.deletedAdvancedGoalIds.push(
    'goal-delete',
  )

  const merged = mergeOfflineMutations(
    cloud,
    snapshot(),
    changes,
  )

  assert.equal(merged.sessions.length, 0)
  assert.equal(merged.advancedGoals.length, 0)
})

test('mutation merge preserves unrelated newer cloud fields', () => {
  const cloud = snapshot({
    dailyGoal: 180,
    settings: {
      ...settings,
      theme: 'dark',
      soundVolume: 90,
    },
    advancedGoals: [
      {
        id: 'goal-cloud',
        title: 'Newer cloud title',
        targetMinutes: 120,
        deadline: '2026-02-01T00:00:00.000Z',
        priority: 'high',
        status: 'active',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ],
  })

  const local = snapshot({
    dailyGoal: 60,
    settings: {
      ...settings,
      theme: 'light',
      soundVolume: 35,
    },
    advancedGoals: [
      {
        id: 'goal-cloud',
        title: 'Stale local title',
        targetMinutes: 120,
        deadline: '2026-02-01T00:00:00.000Z',
        priority: 'high',
        status: 'active',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ],
  })

  const changes =
    createOfflineMutationState()
  changes.settingsKeys.push(
    'soundVolume',
  )

  const merged = mergeOfflineMutations(
    cloud,
    local,
    changes,
  )

  assert.equal(
    merged.settings.theme,
    'dark',
  )
  assert.equal(
    merged.settings.soundVolume,
    35,
  )
  assert.equal(
    merged.dailyGoal,
    180,
  )
  assert.equal(
    merged.advancedGoals[0].title,
    'Newer cloud title',
  )
})

