# McCheck — Phase A (pre-backend) checklist

Phase A locks the mobile client for daily development and first staging integration, **before** real MoveConcept endpoints are confirmed.

## Defaults

- **Daily development:** use **mock API** (`EXPO_PUBLIC_USE_MOCK_API` not `false`, or omit). No network required.
- **Staging integration:** set real `EXPO_PUBLIC_API_BASE_URL`, `EXPO_PUBLIC_USE_MOCK_API=false`, restart Expo with cache clear. See [mcheck-implementation-plan.md](./mcheck-implementation-plan.md) Phase 2 kickoff.

## Manual QA script (~5 minutes)

Run on simulator with **mock API** unless you are explicitly testing live staging.

1. **Login:** open app → sign in with email (or Google mock) → lands on Active events.
2. **Active events:** list shows mock events → pull to refresh → no crash.
3. **Event detail:** tap an event → title, dates, stats, detail rows → **View guest list**.
4. **Guest list:** search → scroll loads more → pull to refresh.
5. **Profile:** open from header → **Integration readiness** shows **Mock API** → **Sign out** → back to Login.

**Pass:** no red screen; primary path completes. **Fail:** crash, stuck spinner, or navigation loop.

## Automated tests

From `mobile/`:

```bash
npm test
```

Covers: active-event helper, activities list JSON shapes, activity/attendee **mappers**, auth token parsing, user-facing API error messages.

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
- [mcheck-google-oauth-notes.md](./mcheck-google-oauth-notes.md) — Google sign-in design stub.
- [mcheck-store-release-checklist.md](./mcheck-store-release-checklist.md) — TestFlight / Play internal / store prep.

**CI:** on push/PR touching `mobile/`, GitHub Actions runs `npm run typecheck` and `npm test` (see `.github/workflows/mobile-ci.yml`).

## Document control

| Version | Date | Notes |
|---------|------|--------|
| 1.0 | 2026-04-09 | Initial Phase A checklist |
| 1.1 | 2026-04-09 | QA + bundle ID notes aligned with current `app.json` and guest list UI |
| 1.2 | 2026-04-09 | Mock scenarios (`EXPO_PUBLIC_MOCK_SCENARIO`), mapper tests, error/retry UX notes |
| 1.3 | 2026-04-09 | Links to staging runbook, OAuth stub, store checklist; CI note |
