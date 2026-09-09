import type {
  SyncChange,
  SyncClock,
  SyncProvider,
  SyncState,
} from './types'

export class SyncEngine {
  private pending: SyncChange[] = []
  private cursor = { value: null as string | null }
  private state: SyncState = {
    status: 'idle',
    lastSyncedAt: null,
    cursor: this.cursor,
    pendingChanges: 0,
    errorMessage: null,
  }

  private readonly provider: SyncProvider
  private readonly clock: SyncClock

  constructor(
    provider: SyncProvider,
    clock: SyncClock = { now: () => new Date().toISOString() },
  ) {
    this.provider = provider
    this.clock = clock
  }

  getState(): SyncState {
    return {
      ...this.state,
      cursor: { ...this.cursor },
    }
  }

  queue(change: SyncChange): void {
    this.pending.push(change)
    this.state.pendingChanges = this.pending.length
  }

  async sync(): Promise<SyncState> {
    this.state = {
      ...this.state,
      status: 'syncing',
      errorMessage: null,
      pendingChanges: this.pending.length,
    }

    try {
      const pulled = await this.provider.pull({ ...this.cursor })
      const pushed = this.pending.length
        ? await this.provider.push([...this.pending])
        : { acceptedIds: [], conflicts: [] }

      if (pushed.conflicts.length > 0) {
        this.state = {
          ...this.state,
          status: 'conflict',
          pendingChanges: this.pending.length,
        }
        return this.getState()
      }

      const accepted = new Set(pushed.acceptedIds)
      this.pending = this.pending.filter((change) => !accepted.has(change.id))
      this.cursor = pulled.cursor
      this.state = {
        ...this.state,
        status: 'synced',
        lastSyncedAt: this.clock.now(),
        cursor: { ...this.cursor },
        pendingChanges: this.pending.length,
      }

      return this.getState()
    } catch (error) {
      this.state = {
        ...this.state,
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Sync failed',
        pendingChanges: this.pending.length,
      }
      return this.getState()
    }
  }
}
