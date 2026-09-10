# FOCUS V2 — Cloud Sync Architecture

## Purpose

Cloud sync will eventually make one user's FOCUS data available across devices without coupling the UI to a specific cloud provider.

## Layers

```text
React / Pages
    ↓
useFocusData
    ↓
Data Repository
    ↓
Sync Engine
    ↓
API / Provider
    ↓
Database
```

Local storage remains the working cache. The sync engine is responsible for pushing local changes, pulling remote changes, tracking a cursor, and surfacing conflicts.

## Sync record requirements

Every remotely synchronized record should have:

- stable `id`
- `updatedAt`
- monotonic `version`
- optional `deletedAt` tombstone
- `entityType`

This gives the backend enough metadata to order changes and avoid silently replacing newer data.

## Sync cycle

1. Read the last sync cursor.
2. Pull remote changes after that cursor.
3. Apply remote changes to the local repository.
4. Push pending local changes.
5. Detect and surface conflicts.
6. Advance the cursor only after a successful cycle.
7. Persist the new sync state.

## Conflict policy

The default policy is deterministic:

- higher version wins
- if versions tie, newer `updatedAt` wins
- equal records are left as an explicit merge case

This is a transport-level default, not a replacement for domain-specific merges. Subject edits, settings, and study sessions may eventually require different merge rules.

## Offline behavior

When offline, writes stay local and enter a pending queue. A later sync attempts to push them. Failed sync must not discard local changes.

Deletes should eventually use tombstones so a deleted record is not recreated by an older offline copy.

## Provider boundary

The sync engine depends only on `SyncProvider` with `pull` and `push`. A future Supabase, custom REST API, or other backend implementation can satisfy this interface without changing page components.

## Not implemented in this phase

- no cloud provider SDK
- no network calls
- no authentication flow
- no database tables
- no automatic background synchronization
