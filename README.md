# McCheck

Check-in app for the MoveConcept platform (organizers at the door).

## Current state

- Mobile organizer V1 is implemented in `mobile/`: **email + Google** sign-in against **MoveConcept staging**, activities → detail → guest list → profile.
- **Daily dev** still uses the **mock API** by default (`EXPO_PUBLIC_USE_MOCK_API` unset in dev); set `EXPO_PUBLIC_USE_MOCK_API=false` for live staging (see `mobile/.env.example`).
- **TestFlight:** iOS builds via EAS (`mobile/eas.json` production profile); submit with `npx eas-cli@latest submit --platform ios --profile production --latest` from `mobile/`.
- **Next focus:** **[Phase A](docs/mcheck-phase-a.md)** — mock-first manual QA + `EXPO_PUBLIC_MOCK_SCENARIO` pass, then staging smoke ([staging runbook](docs/staging-runbook.md)) before each release; Android / V2 scanner per [implementation plan](docs/mcheck-implementation-plan.md).

## Repository layout

| Path | Description |
|------|-------------|
| `mobile/` | **Expo (React Native)** app — start here for development |
| `docs/` | Design vs backend, implementation plan, OpenAPI snapshot + coordination, staging runbook |
| `.github/workflows/` | CI for `mobile/` (typecheck + tests) |

## Quick start (mobile)

```bash
cd mobile
npm install
npm start
```

Mocks are **on by default** (no backend required). **Phase A:** [docs/mcheck-phase-a.md](docs/mcheck-phase-a.md). See also `mobile/README.md` and `docs/mcheck-implementation-plan.md`.

**EAS (`eas build`, `eas submit`):** run from **`mobile/`** — that folder contains `eas.json`. Running from the repo root shows *Run this command inside a project directory.*

## Documentation

- [Implementation plan](docs/mcheck-implementation-plan.md) — V1 scope, staging status, Phase 2+ backlog
- [Phase A (pre-backend)](docs/mcheck-phase-a.md) — mock-first dev, QA script, unit tests, store prep
- [Design vs backend](docs/mcheck-design-vs-backend.md) — Stitch, API gaps, co-workers (later)
- [MoveConcept API snapshot](docs/moveconcept-backend-handoff.md) — OpenAPI sync + coordination (staging export)
- [Staging runbook](docs/staging-runbook.md) — first live API integration
- [Google OAuth notes](docs/mcheck-google-oauth-notes.md) — Google sign-in (Expo + MoveConcept social login)
- [Store release checklist](docs/mcheck-store-release-checklist.md) — EAS / App Store / Play prep
