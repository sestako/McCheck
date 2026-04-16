# McCheck — Phase A (pre-backend) checklist

Phase A locks the mobile client for **daily development with mocks** and optional **staging** runs when `EXPO_PUBLIC_USE_MOCK_API=false`. Staging endpoints are now used successfully for auth and organizer flows; keep mocks for offline UI work.

## Current team focus

We are **prioritizing Phase A** next: ship small UI/client fixes from **mock-mode** QA before expanding scope. Practically:

1. In `mobile/`, use **mocks** for daily work: omit `EXPO_PUBLIC_USE_MOCK_API` or set it to `true` in `.env.local` (staging `false` is for explicit integration / TestFlight).
2. Run the **Manual QA script** below on simulator.
3. Run each **`EXPO_PUBLIC_MOCK_SCENARIO`** row once; fix regressions.
4. Keep CI green (`npm test`, `npm run typecheck` from `mobile/`).

When Phase A is stable, run **staging smoke** ([staging-runbook.md](./staging-runbook.md)) before tagging a release build.

## Defaults

- **Daily development:** use **mock API** (`EXPO_PUBLIC_USE_MOCK_API` not `false`, or omit). No network required.
- **Staging integration:** set real `EXPO_PUBLIC_API_BASE_URL`, `EXPO_PUBLIC_USE_MOCK_API=false`, restart Expo with cache clear. See [mcheck-implementation-plan.md](./mcheck-implementation-plan.md) Phase 2 kickoff.

## Manual QA script (~5 minutes)

Run on simulator with **mock API** unless you are explicitly testing live staging.

1. **Login:** open app → sign in with email (or Google mock) → lands on Active events.
2. **Active events:** list shows mock events → pull to refresh → no crash.
3. **Event detail:** tap an event → title, dates, stats, detail rows → **View guest list**.
4. **Guest list:** search → scroll loads more → pull to refresh; on **`EXPO_PUBLIC_MOCK_SCENARIO=guests_403`**, initial failure shows **Retry** (not a misleading empty search state); use **`edge_layout`** and scroll to the end to confirm pagination footer **Try again** if a page fails.
5. **Profile:** open from header → **Integration readiness** shows **Mock API**; on live API, optional rows (user id, username, …) fill after **`/auth/me`** on cold start or login → **Sign out** → back to Login.

**Pass:** no red screen; primary path completes. **Fail:** crash, stuck spinner, or navigation loop.

## Automated tests

From `mobile/`:

```bash
npm test
```

Covers: active-event helper, activities list JSON shapes, activity/attendee **mappers**, **`/me` session user** parsing, auth token parsing, user-facing API error messages.

## Mock-only QA scenarios (no backend)

With **mock API** enabled, set **`EXPO_PUBLIC_MOCK_SCENARIO`** in `.env` / `.env.local` (see `mobile/.env.example`), restart Expo. Use one value at a time; remove or comment out to return to normal mocks.

| Value | What it exercises |
|-------|-------------------|
| `login_fail` | Email sign-in fails after a short delay (user-facing message from `userFriendlyApiMessage`). |
| `activities_fail` | Active events list fails (banner + **Retry** on that screen). |
| `detail_404` | Every event **detail** load returns 404 (**Retry** on detail). |
| `guests_403` | Guest list fails with 403 (**Retry** next to error). |
| `edge_layout` | Extra mock activities: very long titles, `+14:00` date range, empty guest list, 60-name pagination stress. |

**UI:** Login uses friendly API messages in mock mode; **Event detail** and **Guest list** show **Retry** on error; list/detail/guest rows clamp long text.

## Release hygiene (before store)

- **Display name / slug:** `app.json` — `name` / `slug` (McCheck).
- **Bundle ID:** iOS `bundleIdentifier` and Android `package` in `app.json` (already `com.moveconcept.mccheck`); change only if your org requires a different id.
- **Icons / splash:** `mobile/assets/` — replace defaults before marketing builds.

## Related (pre-staging)

- [staging-runbook.md](./staging-runbook.md) — first live API integration and smoke test.
- [mcheck-google-oauth-notes.md](./mcheck-google-oauth-notes.md) — Google sign-in (Expo + MoveConcept).
- [mcheck-store-release-checklist.md](./mcheck-store-release-checklist.md) — TestFlight / Play internal / store prep.

**CI:** on push/PR touching `mobile/`, GitHub Actions runs `npm run typecheck` and `npm test` (see `.github/workflows/mobile-ci.yml`).

## Document control

| Version | Date | Notes |
|---------|------|--------|
| 1.0 | 2026-04-09 | Initial Phase A checklist |
| 1.1 | 2026-04-09 | QA + bundle ID notes aligned with current `app.json` and guest list UI |
| 1.2 | 2026-04-09 | Mock scenarios (`EXPO_PUBLIC_MOCK_SCENARIO`), mapper tests, error/retry UX notes |
| 1.3 | 2026-04-09 | Links to staging runbook, OAuth stub, store checklist; CI note |
| 1.4 | 2026-04-16 | Clarify mocks vs staging; OAuth doc is implementation guide |
| 1.5 | 2026-04-16 | **Current team focus** — prioritize Phase A before next release spike |
| 1.6 | 2026-04-16 | Profile `/me` field parity + cold-start refresh; guest list empty vs error UX; optional Sentry init when DSN + non-dev + SDK installed; EAS production `android.buildType` |
