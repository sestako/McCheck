# McCheck — staging integration runbook

Use this when testing McCheck against **MoveConcept staging** (or after backend changes). The app supports **email + Google** auth and real activities/registrations when `EXPO_PUBLIC_USE_MOCK_API=false`.

**Validated (2026-04-16):** Create an activity on the **staging MoveConcept site** while signed in as the organizer; after signing into McCheck with the **same account**, the event appears under **Active events**.

**V1 iOS (2026-04-17):** Organizer smoke path **signed off on iOS** (TestFlight / device): auth → active events → detail → guest list → profile → logout. **Android:** run the same checklist on a device using an **EAS `preview` APK** (QR or download on the [Expo build page](https://expo.dev) — see [../mobile/README.md](../mobile/README.md) § *Install on a physical Android phone*) or **USB `adb install`**, or after Play **Internal testing** once the app is on a track. **Google sign-in** only works in those **native** binaries, not in **Expo Go** ([mcheck-android-google-oauth-setup.md](./mcheck-android-google-oauth-setup.md)).

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
- [ ] Optional: **User notifications** routes are deployed on staging (see [moveconcept-backend-handoff.md](./moveconcept-backend-handoff.md)); `api-docs.json` may not list them yet — confirm paths against staging or backend repo if McCheck inbox is in scope.
- [ ] Optional: **EXPO_PUBLIC_SENTRY_DSN** set on the EAS **production** environment so release builds report crashes (Sentry init runs only outside `__DEV__`).
- [x] **Registrations authorization (MoveConcept production, 2026-04-16):** `GET /activities/{id}/registrations` is **owner-only**; non-owner receives **403** (no guest-list enumeration across organizers).

## One-time client setup (`mobile/`)

1. Copy `.env.example` → `.env.local` (or `.env`).
2. Set `EXPO_PUBLIC_API_BASE_URL` to staging (no trailing slash).
3. Set `EXPO_PUBLIC_USE_MOCK_API=false`.
4. If auth paths differ from defaults, set `EXPO_PUBLIC_AUTH_*` paths.
5. For **live staging + Google** on a **phone**, install an **EAS `preview`/`development`/`production` Android build** (or iOS TestFlight / dev build); then point that binary at staging via the same `EXPO_PUBLIC_*` values baked into the build (see `eas.json` / EAS env). **`expo start` + Expo Go** is enough for **mock** email flows only — not full Google.
6. Restart Metro with cache clear when iterating in dev: `npx expo start --clear`.

## Endpoint smoke test (~20–30 minutes; +~10 if optional section **E**)

### A. Auth contract

1. **POST `/auth/login` success**
   - Use organizer credentials.
   - Confirm app reaches event list and session persists after app restart.
2. **POST `/auth/login` failure**
   - Wrong password.
   - Confirm user-friendly error copy is shown (no raw JSON dump).
3. **Google sign-in (`POST /auth/login/social/google`)**
   - With `EXPO_PUBLIC_GOOGLE_*` set (see `mobile/.env.example`), on an **EAS build** tap **Continue with Google**, complete native Google sign-in, confirm same organizer session as email path and token persists after restart.
4. **GET `/auth/me`**
   - Confirm profile identity matches logged-in organizer.
5. **DELETE `/auth/logout`**
   - Confirm session is cleared and protected screens are no longer accessible.

### B. Activities list contract

6. **GET `/users/me/activities` happy path** (full URL: `{base}/api/users/me/activities`; **`/api/auth/users/me/activities` is not deployed** — 404.)
   - McCheck loads **`filter=draft`**, **`filter=upcoming`**, and **`filter=ongoing`** (merged), then falls back to no filter if all buckets are empty — see `mobile/src/api/real/realActivitiesApi.ts`.
   - Confirm list renders and belongs to current organizer.
   - Confirm date/state formatting and no layout issues with real data.
7. **List edge checks**
   - Empty list account (if available) shows empty state.
   - Very long activity title does not break card layout.

### C. Registrations contract

8. **GET `/activities/{activity}/registrations` page 1**
   - Confirm rows render names and blocked badge logic.
9. **Pagination**
   - Scroll/load next page and verify no duplicate rows or crashes.
10. **Forbidden case**
   - Test non-owner activity if available; confirm expected `403` UX.

### D. OpenAPI parity (optional regression)

11. Compare a few responses to **`docs/api-docs.json`** (e.g. activity detail, registrations `search`, list counts). If staging drifts from the snapshot, refresh the JSON export and open a ticket.

### E. User notifications — organizer join/cancel (optional)

MoveConcept stores **database** notifications for the **activity owner** when someone **registers** or **cancels** on their activity. McCheck can use the same authenticated user-notification API as the web for an **in-app inbox** (see [mcheck-implementation-plan.md](./mcheck-implementation-plan.md) — *Organizer notifications — in-app first, push later*). This block is **optional** until McCheck ships that UI; you can still verify the backend with **Bearer token** from a successful login.

1. Note **`user.id`** from **`GET /auth/me`** (same session as steps A1–A4).
2. **`GET {base}/api/users/{userId}/notifications?page=1`**
   - Expect **200** and a paginated `notifications` payload (may be empty if nothing happened yet).
3. **`GET {base}/api/users/{userId}/notifications/unread-count`**
   - Expect **200** and an unread count consistent with the list.
4. **Trigger (staging web):** With a **second** test account (or guest flow if available), **join** or **cancel** on an activity **owned by the organizer** from step 1; repeat step 2 and confirm a new row appears (types such as join/cancel — compare with web notification list for the same organizer).
5. **Mark read:** **`PATCH …/notifications/{notification}/mark-read`** or **`POST …/notifications/mark-all-read`** — confirm unread count drops and list state matches web.

**When McCheck has a notification screen:** repeat steps 2–5 inside the app (pull-to-refresh or focus) instead of raw HTTP.

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
| 1.4 | 2026-04-16 | Google social login smoke step; removed obsolete “API gaps” section (OpenAPI now documents detail, search, counts) |
| 1.5 | 2026-04-16 | Note: web-created staging event visible in app Active events |
| 1.6 | 2026-04-16 | Document merged `filter=upcoming` + `ongoing` for my-activities (client fix for empty list) |
| 1.7 | 2026-04-16 | Correct my-activities URL: `GET /users/me/activities` (`/api/users/me/activities`); document `draft` merge; `/api/auth/users/me/activities` 404s on staging |
| 1.8 | 2026-04-16 | Optional precondition: `EXPO_PUBLIC_SENTRY_DSN` on EAS for release crash reporting |
| 1.9 | 2026-04-16 | Recorded MoveConcept **owner-only** registrations policy (production); staging re-check if policies diverge |
| 2.0 | 2026-04-16 | Optional precondition + section **E** — user notifications smoke (`/users/{id}/notifications*`), organizer join/cancel; pointer to implementation plan |
| 2.1 | 2026-04-17 | **V1 iOS** sign-off note; Android = repeat smoke when Play internal or APK QA |
| 2.2 | 2026-04-17 | Pointer to `mobile/README.md` — Android APK USB sideload (`preview` + `adb install`) |
| 2.3 | 2026-04-18 | EAS APK QR vs Expo Go; one-time setup steps for native Google on device |
