import test from 'node:test'
import assert from 'node:assert/strict'
import {
  TIMER_STORAGE_KEY,
  pausedFromClock,
  readTimerSnapshot,
  remainingFromClock,
  writeTimerSnapshot,
} from '../src/utils/timerPersistence.ts'

test('the focus countdown follows wall time when the app is backgrounded', () => {
  const start = 1_800_000_000_000
  const end = start + 25 * 60_000
  assert.equal(remainingFromClock(end, 1500, start + 10 * 60_000), 900)
  assert.equal(remainingFromClock(end, 1500, end + 30_000), 0)
  assert.equal(remainingFromClock(null, 250), 250)
})

test('pause duration follows wall time even when interval callbacks stop', () => {
  assert.equal(pausedFromClock(100_000, 30, 160_000), 90)
  assert.equal(pausedFromClock(null, 45), 45)
})

test('a running timer can be reloaded for its matching subject', () => {
  const items = new Map()
  const original = globalThis.localStorage
  globalThis.localStorage = {
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => { items.set(key, value) },
  }
  try {
    const snapshot = {
      version: 1,
      subjectName: 'Networking',
      focusDuration: 1500,
      duration: 1500,
      timeRemaining: 1400,
      mode: 'focus',
      completedFocusSessions: 2,
      isStudying: true,
      isPaused: false,
      timerEndAt: Date.now() + 600_000,
      sessionStartedAt: Date.now() - 900_000,
      pausedSeconds: 0,
      pauseStartedAt: null,
      pauseBaseSeconds: 0,
      interruptionCount: 0,
    }
    writeTimerSnapshot(snapshot)
    assert.ok(items.has(TIMER_STORAGE_KEY))
    assert.deepEqual(readTimerSnapshot('Networking'), snapshot)
    assert.equal(readTimerSnapshot('Other subject'), null)
    items.set(TIMER_STORAGE_KEY, '{not-json')
    assert.equal(readTimerSnapshot('Networking'), null)
  } finally {
    globalThis.localStorage = original
  }
})

test('timer snapshots are isolated by account storage key', () => {
  const values = new Map()
  const previous = globalThis.localStorage
  globalThis.localStorage = { getItem:key=>values.get(key)??null, setItem:(key,value)=>values.set(key,value) }
  try {
    const snapshot = {version:1,subjectName:'OS',focusDuration:60,duration:60,timeRemaining:60,mode:'focus',completedFocusSessions:0,isStudying:false,isPaused:false,timerEndAt:null,sessionStartedAt:null,pausedSeconds:0,pauseStartedAt:null,pauseBaseSeconds:0,interruptionCount:0}
    writeTimerSnapshot(snapshot,'user-a')
    assert.equal(readTimerSnapshot('OS','user-b'),null)
    assert.equal(readTimerSnapshot('OS','user-a')?.duration,60)
  } finally { globalThis.localStorage = previous }
})

test('timer recovers a still-running subject even if the selected subject changed', () => {
  const values = new Map()
  const previous = globalThis.localStorage
  globalThis.localStorage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value) },
  }
  try {
    const now = 1_900_000_000_000
    const start = now - 10 * 60_000
    const snapshot = {
      version: 1, subjectName: 'Operating Systems',
      sessionClientId: 's-restore-me',
      focusDuration: 1500, duration: 1500, timeRemaining: 1500,
      mode: 'focus', completedFocusSessions: 1,
      isStudying: true, isPaused: false,
      timerEndAt: start + 1500 * 1000, sessionStartedAt: start,
      pausedSeconds: 0, pauseStartedAt: null, pauseBaseSeconds: 0,
      interruptionCount: 0,
    }
    writeTimerSnapshot(snapshot)
    assert.equal(readTimerSnapshot()?.subjectName, 'Operating Systems')
    assert.equal(remainingFromClock(readTimerSnapshot().timerEndAt, 1500, now), 900)
    assert.equal(remainingFromClock(readTimerSnapshot().timerEndAt, 1500, now + 20 * 60_000), 0)
    assert.equal(readTimerSnapshot('English'), null, 'Explicit subject lookup remains strict')
  } finally {
    globalThis.localStorage = previous
  }
})

test('paused sessions survive shutdowns longer than a day without being discarded', () => {
  const values = new Map()
  const previous = globalThis.localStorage
  globalThis.localStorage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value) },
  }
  try {
    const pausedAt = 1_900_000_000_000
    const snapshot = {
      version: 1, subjectName: 'English', focusDuration: 1500, duration: 1500,
      timeRemaining: 600, mode: 'focus', completedFocusSessions: 0,
      isStudying: false, isPaused: true, timerEndAt: null,
      sessionStartedAt: pausedAt - 900_000, pausedSeconds: 172800,
      pauseStartedAt: pausedAt, pauseBaseSeconds: 172800, interruptionCount: 1,
    }
    writeTimerSnapshot(snapshot)
    assert.equal(readTimerSnapshot('English').isPaused, true)
    assert.equal(pausedFromClock(pausedAt, 172800, pausedAt + 3 * 86400_000), 5 * 86400)
  } finally {
    globalThis.localStorage = previous
  }
})

test('finished sessions carry a completed marker and do not reload as a frozen active timer', () => {
  const values = new Map()
  const previous = globalThis.localStorage
  globalThis.localStorage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value) },
  }
  try {
    writeTimerSnapshot({
      version: 1, subjectName: 'OS', focusDuration: 1500, duration: 1500,
      timeRemaining: 0, mode: 'focus', completedFocusSessions: 1,
      isStudying: false, isPaused: false, isCompleted: true,
      lastCompletedSeconds: 1500, timerEndAt: null,
      sessionStartedAt: 1_900_000_000_000, pausedSeconds: 0,
      pauseStartedAt: null, pauseBaseSeconds: 0, interruptionCount: 0,
    })
    const saved = readTimerSnapshot('OS')
    assert.equal(saved.isCompleted, true)
    assert.equal(saved.isStudying, false)
    assert.equal(saved.lastCompletedSeconds, 1500)
  } finally {
    globalThis.localStorage = previous
  }
})
