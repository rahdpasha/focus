import type { SyncChange } from './types'

export type ConflictResolution =
  | { strategy: 'keep-local'; change: SyncChange }
  | { strategy: 'accept-remote'; change: SyncChange }
  | { strategy: 'merge'; change: SyncChange }

/**
 * Default V2 policy.
 *
 * The server/client must not silently overwrite records with an older version.
 * Ties remain explicit so a future provider can apply domain-specific merging.
 */
export function resolveConflict(
  local: SyncChange,
  remote: SyncChange,
): ConflictResolution {
  if (remote.version > local.version) {
    return { strategy: 'accept-remote', change: remote }
  }

  if (local.version > remote.version) {
    return { strategy: 'keep-local', change: local }
  }

  if (remote.updatedAt > local.updatedAt) {
    return { strategy: 'accept-remote', change: remote }
  }

  if (local.updatedAt > remote.updatedAt) {
    return { strategy: 'keep-local', change: local }
  }

  return { strategy: 'merge', change: local }
}
