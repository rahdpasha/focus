import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { getEarlyFinishSeconds } from '../src/utils/earlyFinish.ts'

test('finishing a 25-minute timer at 10 minutes counts 10 minutes, not 25', () => {
  const start = 1_800_000_000_000
  assert.equal(getEarlyFinishSeconds(start, start + 600_000, 0, 1500), 600)
})

test('pauses never count toward early finish, including backgrounded pauses', () => {
  const start = 1_800_000_000_000
  assert.equal(getEarlyFinishSeconds(start, start + 900_000, 300, 1500), 600)
  assert.equal(getEarlyFinishSeconds(start, start + 600_000, 700, 1500), 0)
})

test('early finish cannot record negative time, future time, or more than planned', () => {
  const start = 1_800_000_000_000
  assert.equal(getEarlyFinishSeconds(start, start - 1_000, 0, 1500), 0)
  assert.equal(getEarlyFinishSeconds(start, start + 3_000_000, 0, 1500), 1500)
  assert.equal(getEarlyFinishSeconds(start, start + 3_000_000, Number.NaN, 1500), 0)
})

test('early finish is confirmed and does not advance full Pomodoro sequence', () => {
  const source = readFileSync('src/components/timer/Timer.tsx', 'utf-8')
  assert.match(source, /Finish early/)
  assert.match(source, /Finish & save/)
  assert.match(source, /Keep studying/)
  const early = source.slice(source.indexOf('const finishEarly = () =>'), source.indexOf('const finishBreak = '))
  assert.match(early, /onSessionEnd\(\s*focusDuration,\s*actualDuration,\s*true,/)
  assert.match(early, /onSessionCompleted\?\.\(sessionClientId\)/)
  assert.doesNotMatch(early, /setCompletedFocusSessions/)
  assert.doesNotMatch(early, /sendCompletionNotification\(false\)/)
  assert.match(source, /!autoStartBreak \|\| completedEarly/)
})

test('early finish button is only shown during an active or paused focus session', () => {
  const source = readFileSync('src/components/timer/Timer.tsx', 'utf-8')
  assert.match(source, /isFocus && \(isStudying \|\| isPaused\) && !showEarlyFinishConfirm/)
  assert.match(source, /showEarlyFinishConfirm && \(/)
  assert.match(source, /sessionClientIdRef\.current && !isCompleted && !showComplete/)
})
