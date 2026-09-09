export type SyncEntityType =
  | 'profile'
  | 'settings'
  | 'subject'
  | 'session'
  | 'goal'
  | 'weeklyGoal'

export type SyncOperation = 'create' | 'update' | 'delete'

export interface SyncRecordMetadata {
  id: string
  entityType: SyncEntityType
  updatedAt: string
  version: number
  deletedAt?: string | null
}

export interface SyncChange<T = unknown> extends SyncRecordMetadata {
  operation: SyncOperation
  data: T
}

export interface SyncCursor {
  value: string | null
}

export interface SyncState {
  status: 'idle' | 'syncing' | 'synced' | 'conflict' | 'error'
  lastSyncedAt: string | null
  cursor: SyncCursor
  pendingChanges: number
  errorMessage: string | null
}

export interface SyncPullResult {
  changes: SyncChange[]
  cursor: SyncCursor
}

export interface SyncPushResult {
  acceptedIds: string[]
  conflicts: SyncChange[]
}

export interface SyncProvider {
  pull(cursor: SyncCursor): Promise<SyncPullResult>
  push(changes: SyncChange[]): Promise<SyncPushResult>
}

export interface SyncClock {
  now(): string
}
