export type TimerMode = 'focus' | 'shortBreak' | 'longBreak'

export interface TimerSnapshot {
  version: 1
  subjectName: string
  sessionClientId?: string | null
  focusDuration: number
  duration: number
  timeRemaining: number
  mode: TimerMode
  completedFocusSessions: number
  isStudying: boolean
  isPaused: boolean
  timerEndAt: number | null
  sessionStartedAt: number | null
  pausedSeconds: number
  pauseStartedAt: number | null
  pauseBaseSeconds: number
  interruptionCount: number
}

export const TIMER_STORAGE_KEY = 'focus.activeTimer.v1'

// The clock, not the number of setInterval callbacks, determines elapsed time.
// Background tabs and installed PWAs may stop receiving timer callbacks.
export function remainingFromClock(
  endAt: number | null,
  fallbackSeconds: number,
  now: number = Date.now(),
): number {
  if (endAt === null) return fallbackSeconds
  return Math.max(0, Math.ceil((endAt - now) / 1000))
}

export function pausedFromClock(
  startedAt: number | null,
  previousSeconds: number,
  now: number = Date.now(),
): number {
  if (startedAt === null) return previousSeconds
  return previousSeconds + Math.max(0, Math.floor((now - startedAt) / 1000))
}

export function readTimerSnapshot(subjectName: string): TimerSnapshot | null {
  try {
    const raw = localStorage.getItem(TIMER_STORAGE_KEY)
    if (!raw) return null

    const value: unknown = JSON.parse(raw)
    if (!value || typeof value !== 'object') return null
    const snapshot = value as Partial<TimerSnapshot>
    const validSeconds = (n: unknown) =>
      typeof n === 'number' && Number.isInteger(n) && n >= 0 && n <= 86400
    const validTimestamp = (n: unknown) =>
      n === null || (typeof n === 'number' && Number.isFinite(n) && n > 0)

    if (
      snapshot.version !== 1 ||
      snapshot.subjectName !== subjectName ||
      (snapshot.sessionClientId != null && typeof snapshot.sessionClientId !== 'string') ||
      !['focus', 'shortBreak', 'longBreak'].includes(snapshot.mode ?? '') ||
      !validSeconds(snapshot.focusDuration) ||
      snapshot.focusDuration === 0 ||
      !validSeconds(snapshot.duration) ||
      snapshot.duration === 0 ||
      !validSeconds(snapshot.timeRemaining) ||
      (snapshot.timeRemaining ?? 0) > (snapshot.duration ?? 0) ||
      !validSeconds(snapshot.pausedSeconds) ||
      !validSeconds(snapshot.pauseBaseSeconds) ||
      !validSeconds(snapshot.interruptionCount) ||
      !validSeconds(snapshot.completedFocusSessions) ||
      typeof snapshot.isStudying !== 'boolean' ||
      typeof snapshot.isPaused !== 'boolean' ||
      !validTimestamp(snapshot.timerEndAt) ||
      !validTimestamp(snapshot.pauseStartedAt) ||
      !validTimestamp(snapshot.sessionStartedAt) ||
      (snapshot.isStudying && snapshot.timerEndAt === null) ||
      (snapshot.isPaused && snapshot.pauseStartedAt === null) ||
      (snapshot.isStudying && snapshot.isPaused)
    ) {
      return null
    }
    return snapshot as TimerSnapshot
  } catch {
    // Storage may be unavailable in private browsing or restricted environments.
    return null
  }
}

export function writeTimerSnapshot(snapshot: TimerSnapshot): void {
  try {
    localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(snapshot))
  } catch {
    // An unavailable storage API must never block the timer controls.
  }
}
