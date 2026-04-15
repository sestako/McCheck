# McCheck

Check-in app for the MoveConcept platform (organizers at the door).

## Current state

- Mobile organizer V1 scaffold is implemented in `mobile/` and QA-validated on simulator.
- App currently runs with mock API by default.
- Next milestone is backend integration for auth + owner-scoped activities + hardened attendees access.

## Repository layout

| Path | Description |
|------|-------------|
| `mobile/` | **Expo (React Native)** app — start here for development |
| `docs/` | Design vs backend, implementation plan, MoveConcept handoff, staging runbook |
| `.github/workflows/` | CI for `mobile/` (typecheck + tests) |

## Quick start (mobile)

```bash
cd mobile
npm install
npm start
```

Mocks are **on by default** (no backend required). See `mobile/README.md` and `docs/mcheck-implementation-plan.md`.

**EAS (`eas build`, `eas submit`):** run from **`mobile/`** — that folder contains `eas.json`. Running from the repo root shows *Run this command inside a project directory.*

## Documentation

- [Implementation plan](docs/mcheck-implementation-plan.md) — V1 scope, parallel work, integration when backend is ready
- [Phase A (pre-backend)](docs/mcheck-phase-a.md) — mock-first dev, QA script, unit tests, store prep
- [Design vs backend](docs/mcheck-design-vs-backend.md) — Stitch, API gaps, co-workers (later)
- [Backend handoff](docs/moveconcept-backend-handoff.md) — what MoveConcept must add for V1
- [Staging runbook](docs/staging-runbook.md) — first live API integration
- [Google OAuth notes](docs/mcheck-google-oauth-notes.md) — native Google sign-in (design stub)
- [Store release checklist](docs/mcheck-store-release-checklist.md) — EAS / App Store / Play prep
