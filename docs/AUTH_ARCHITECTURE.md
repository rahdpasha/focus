# FOCUS V2 Authentication Architecture

Phase 21 defines authentication as a provider-neutral boundary.

The React application should depend on `AuthProvider`, `AuthSession`, and `AuthState` rather than a vendor SDK.

Future flow:

React UI -> auth hook/application layer -> AuthProvider -> authentication service

This phase intentionally does not add credentials, passwords, OAuth configuration, tokens in localStorage, or a third-party SDK.

User identity remains separate from profile/productivity data so the database and API can use a stable user id later.
