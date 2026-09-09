# FOCUS V2 API Boundary

Phase 20 defines the provider-neutral backend contract without adding a backend connection.

## Request flow

```text
React UI
  ↓
hooks / application logic
  ↓
Focus API contract
  ↓
backend implementation
  ↓
database
```

## Current state

- LocalStorage remains the active storage implementation.
- `FocusApi` defines future read/write operations.
- `UnconfiguredFocusApi` prevents accidental network calls before a backend is selected.
- No authentication or backend SDK is introduced yet.
