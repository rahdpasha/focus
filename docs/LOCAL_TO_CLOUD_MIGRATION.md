# Local-to-cloud migration

Phase 23 adds a deterministic migration boundary from the current `FocusDataSnapshot` shape to the V2 database record shape.

## Safety rules

- Existing localStorage data remains the source until a cloud provider is explicitly configured.
- Migration is read-only with respect to localStorage; it creates a cloud-ready representation without deleting local data.
- Existing subject and session IDs are preserved so references remain stable.
- Missing historical `startedAt` values fall back to `completedAt` and then to the migration timestamp.
- Duration values are converted from minutes to integer seconds for the database model.
- Current goals/settings are represented as owned records for the authenticated user.

## Usage

Call `migrateLocalDataToRecords(snapshot, { userId })` from a future migration command or sync bootstrap. The function returns database-ready records but does not perform network I/O.
