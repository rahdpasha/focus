/**
 * Count only real focused wall-clock seconds when a user finishes a session early.
 * Paused time (including time while a PWA is suspended) never counts.
 */
export function getEarlyFinishSeconds(
  startedAtMs: number,
  nowMs: number,
  pausedSeconds: number,
  plannedSeconds: number,
): number {
  if (
    !Number.isFinite(startedAtMs) ||
    !Number.isFinite(nowMs) ||
    !Number.isFinite(pausedSeconds) ||
    !Number.isFinite(plannedSeconds) ||
    plannedSeconds <= 0
  ) {
    return 0
  }

  const elapsed = Math.max(0, Math.floor((nowMs - startedAtMs) / 1000))
  const focused = Math.max(0, elapsed - Math.max(0, Math.floor(pausedSeconds)))
  return Math.min(Math.floor(plannedSeconds), focused)
}

/** Read wall time only in the user-triggered finish handler, never during render. */
export function readFinishTimestamp(): number {
  return Date.now()
}
