# McCheck — staging integration runbook

Use this when MoveConcept exposes **staging** and McCheck switches from mocks to the real API.

## Roles (fill in for your org)

| Role | Name / channel | Responsibility |
|------|----------------|------------------|
| Mobile owner | | Env, app releases, McCheck PRs |
| Backend owner | | Staging URLs, credentials, API changes |
| QA | | Smoke pass after each deploy |

## Preconditions

- [ ] Staging **HTTPS base URL** documented and reachable from office/VPN.
- [ ] Test **organizer** account (email + password or agreed auth).
- [ ] At least one **owned** activity with **registrations** (non-empty guest list).
- [ ] Backend confirms currently available endpoints in OpenAPI are deployed to staging.
- [ ] Any gaps between live staging and [api-docs.json](./api-docs.json) are tracked as tickets (policy-only items may still live in [moveconcept-backend-handoff.md](./moveconcept-backend-handoff.md)).

## One-time client setup (`mobile/`)

1. Copy `.env.example` → `.env.local` (or `.env`).
2. Set `EXPO_PUBLIC_API_BASE_URL` to staging (no trailing slash).
3. Set `EXPO_PUBLIC_USE_MOCK_API=false`.
4. If auth paths differ from defaults, set `EXPO_PUBLIC_AUTH_*` paths.
5. Restart Expo with cache clear: `npx expo start --clear`.

## Endpoint smoke test (~20-30 minutes)

### A. Auth contract

1. **POST `/auth/login` success**
   - Use organizer credentials.
   - Confirm app reaches event list and session persists after app restart.
2. **POST `/auth/login` failure**
   - Wrong password.
   - Confirm user-friendly error copy is shown (no raw JSON dump).
3. **GET `/auth/me`**
   - Confirm profile identity matches logged-in organizer.
4. **DELETE `/auth/logout`**
   - Confirm session is cleared and protected screens are no longer accessible.

### B. Activities list contract

5. **GET `/auth/users/me/activities` happy path**
   - Confirm list renders and belongs to current organizer.
   - Confirm date/state formatting and no layout issues with real data.
6. **List edge checks**
   - Empty list account (if available) shows empty state.
   - Very long activity title does not break card layout.

### C. Registrations contract

7. **GET `/activities/{activity}/registrations` page 1**
   - Confirm rows render names and blocked badge logic.
8. **Pagination**
   - Scroll/load next page and verify no duplicate rows or crashes.
9. **Forbidden case**
   - Test non-owner activity if available; confirm expected `403` UX.

### D. Known gaps handling (expected for now)

10. **No single-detail endpoint**
    - Detail screen should fail gracefully or use list payload fallback without crash.
11. **No server search param**
    - Search behavior should be clearly marked as temporary/client-side fallback.
12. **No counts in `MyActivityResource`**
    - Count UI should degrade gracefully (hidden/placeholder), never show broken values.

**Pass:** primary path works; no unexpected red screens. **Fail:** open ticket with HTTP status, response snippet (no secrets), and screen.

## When something breaks

1. Confirm **base URL** and **mock flag** in Profile.
2. Compare payload with current app mappers in `mobile/src/api/real/`.
3. Re-run `npm test` and `npm run typecheck` in `mobile/`.

## Document control

| Version | Date | Notes |
|---------|------|--------|
| 1.0 | 2026-04-09 | Initial runbook |
| 1.1 | 2026-04-13 | Replaced generic smoke list with endpoint-by-endpoint 20-30 min checklist; aligned with current missing-items handoff doc |
| 1.2 | 2026-04-14 | Updated auth/logout and my-activities endpoint names to current API contract |
| 1.3 | 2026-04-16 | Preconditions reference `api-docs.json` vs live staging drift |
