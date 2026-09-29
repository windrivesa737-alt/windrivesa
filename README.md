# WinDriveSA Reward Platform

GitHub-ready frontend scaffold for the WinDriveSA application. The approved Stitch screens are preserved in `stitch-reference/` and the implementation brief is in `AI_STUDIO_HANDOFF.md`.

## Source of truth
1. `DESIGN.md` — visual/design system.
2. `AI_STUDIO_HANDOFF.md` — product rules, routes, navigation architecture, states and implementation constraints.
3. `SCREEN_MANIFEST.json` — approved 22-screen mapping.
4. `stitch-reference/` — approved Stitch HTML and screenshots only; obsolete iterations were removed before handoff.

## Current scaffold
The Vite/React app contains all approved routes as placeholders. Google AI Studio should implement the real screens from the Stitch references and handoff documents, preserving the architecture.

## Important
- Do not add Supabase yet.
- Do not invent government, tax, regulatory, winner-statistic, testimonial, or payment claims.
- Light theme is the default; do not initialize theme from `prefers-color-scheme`.
- Public, authenticated-user, and admin navigation are separate layout contexts.
