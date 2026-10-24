# FOCUS — Appearance continuation (24 October 2026)

This branch continues the supplied Astra Appearance implementation. It does not replace FOCUS or alter its existing study features.

## Delivered

- Added Original Green as the seventh selectable appearance using the previous calm leaf-green palette; existing Soft Light, Midnight, monochrome, System and Custom remain available.
- Midnight uses deep navy (#0c1426) with blue/teal accents, independently of green.
- Replaced barely-moving tiled stars with 26 deterministic, softly twinkling/drifting particles (15 on phone layouts), two independently drifting aurora-like radial lights and theme-specific intensity.
- Moved the shared background above the page root's opaque stacking layer and beneath interactive content. Controls remain clickable.
- Off/Subtle/Normal preferences are saved per device; reduced-motion disables animations, and page visibility pauses them.
- Kept the existing five-color Custom Theme editor, presets, live preview, Cancel/Save/Reset/Restore and protected JSON import/export.
- Kept the existing Supabase schema. Because its theme column does not allow a seventh name, Original Green is compatibly represented using the existing light value and validated metadata within the JSONB custom-theme field; any separate user custom palette survives selection changes.
- Updated PWA cache version and relevant regression tests without changing the timer, Advisor, League, routines, authentication or database migrations.

## Verification

Run `npm ci`, `npm run lint`, `npm test` and `npm run build`. The separate browser QA script is `tests/appearance-browser.mjs` (Playwright/Chromium required). This script includes Original Green and Midnight screenshots, responsive viewport checks, particle-motion observation and reduced-motion/visibility checks.

## Limitations

- Signed-in, multi-device Supabase synchronization and physical iPhone GPU/battery consumption require manual verification in the actual environment.
- Original Green cloud metadata is backward compatible with the current database schema; clients running older FOCUS versions cannot identify the new name and may display Soft Light until updated.
- The code uses CSS gradients and DOM particles; no canvas, WebGL or JavaScript animation loop.
