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
