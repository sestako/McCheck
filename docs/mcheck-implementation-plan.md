# McCheck — implementation plan

## Current status snapshot (2026-04-19)

**Completed in mobile (`mobile/`):**

- Expo + TypeScript app; core V1 screens: **Login** (email + **Google**), **Active events**, **Event detail**, **Guest list**, **Profile**.
- API layer: **mock** and **real** clients behind `createActivitiesApi`; contract aligned with **`docs/api-docs.json`** (staging OpenAPI snapshot).
- **Auth:** `AuthContext` — email `POST /api/auth/login`; Google via `GoogleSignInButton` + `@react-native-google-signin/google-signin`, then `POST /api/auth/login/social/google` with `accessToken` + `deviceName`; token in SecureStore; `/api/auth/me` for profile; logout `DELETE /api/auth/logout`.
- **Google / devices:** **`@react-native-google-signin/google-signin`** (not Expo Go). Before each interactive sign-in the app calls **`GoogleSignin.signOut()`** so Android shows the **account picker**; **`signOut()`** in `AuthContext` also clears the Google SDK session. iOS **EAS production** → TestFlight; Android **EAS `preview` APK** (QR on build page) or **production AAB**; env in `mobile/eas.json` / EAS dashboard.
- **V1 iOS:** Primary organizer path verified on **iOS** (TestFlight / device): login → active events → detail → guest list → profile (scrollable) → logout — **signed off 2026-04-17**.
- **V1 Android:** Same organizer smoke path verified on a **physical device** against **MoveConcept staging** (EAS native build; email + Google) — **signed off 2026-04-19**.
- Stitch-inspired UI tokens and polish; **Retry** on event detail + guest list errors; mapper unit tests.
- **CI:** GitHub Actions — `npm run typecheck` + `npm test` on `mobile/`; `initObservability` placeholder for Sentry.
- **Staging (real data):** An activity **created on MoveConcept staging** by the signed-in organizer **appears in Active events** in the app (same account as web) — validated 2026-04-16.

### After V1 sign-off (iOS + Android)

- **Regression hygiene:** Keep **[mcheck-phase-a.md](./mcheck-phase-a.md)** (mock script + `EXPO_PUBLIC_MOCK_SCENARIO` matrix + CI) for day-to-day work; run **[staging-runbook.md](./staging-runbook.md)** before each tagged release.
- **Android (store track):** **EAS `production`** builds **`.aab`** for Play. **Play Console** org verification and **`eas submit --platform android`** (service account JSON on first submit) remain the path to **Internal / production** tracks; device QA on staging is already done via **`preview` APK**. Native Google + SHA-1: [mcheck-android-google-oauth-setup.md](./mcheck-android-google-oauth-setup.md).
- **V2 (later):** scanner / check-in — see **Below the line — V2**. Phase 2 steps **1–8** are **green on iOS and Android** against staging; start V2 when product/backend **explicitly prioritize** it.

**Still pending / next validation:**

- **Store ops (optional):** Play **`eas submit`** and store listing when you move beyond APK/sideload testers.
- **Backend / product:** Continue to resolve any drift between live staging and `api-docs.json` (policy notes may still live in [moveconcept-backend-handoff.md](./moveconcept-backend-handoff.md)).
- **V2:** Phase B backlog when you explicitly kick off scanner/check-in.

## V1 — organizer app at the door (read-focused)

**Audience:** Users who **created the event on the website** and need to **manage entrance** (see who’s coming, event context).

**Login:** **Same account as web only** — **email** and **Google**. No separate app-only login.

**“Open events” (terminology):** Events **created by the user** that are **upcoming or ongoing** (product definition of “active”). Prefer user-facing copy such as **“Active events”** or **“My upcoming & live events”** to avoid confusion with API `state: public`.

**In scope (ship in V1):**

| Area | Deliverable |
|------|-------------|
| **Auth** | Email + Google → **same `users` as web**; store session/token securely on device; logout. |
| **My events** | List **activities I own** that are **upcoming / ongoing** (exact filter = product + API contract). |
| **Event detail** | Screen from `GET /api/activities/{id}` (or fields from list if the list endpoint is enriched). |
| **Guest list** | Paginated list + search, wired to registrations API; **owner-only** access **confirmed** on MoveConcept production (2026-04-16). |
| **Profile** | Read-only self profile + logout (minimal). |
| **Design** | Stitch as reference; implement natively (Forest Minimalist / tokens in `mcheck-design-vs-backend.md`). |

**Backend prerequisites for V1 (MoveConcept):**

- **My activities (done):** **`GET /users/me/activities`** — optional `filter`: `draft` \| `upcoming` \| `ongoing`; pagination; list rows include **`registrationsCount`** and **`attendingGuestsCount`** (McCheck merges filters client-side as in [staging-runbook.md](./staging-runbook.md)).
- **Auth for mobile:** Token flow for **email** + **Google** social login → same user as web (mobile implemented; keep OpenAPI + staging in sync).
- **Registrations (done):** **`GET /activities/{activity}/registrations`** is **owner-only** in production (confirmed MoveConcept 2026-04-16); non-owner receives **403**.

**Explicitly out of V1:**

- QR / **scanner**, **check-in**, **check-in history**
- **Co-worker** email invites and scanner-only sessions
- Editing events, refunds, messaging, full social graph

---

## While MoveConcept gaps are open (parallel work)

McCheck development can start **before** staging parity is finalized. Use **typed API interfaces + mocks** (fixtures or e.g. MSW) behind a flag such as `EXPO_PUBLIC_USE_MOCK_API` (omit or not `false` = mocks) so screens and navigation are real; swap the implementation when backend staging is ready.

| Track | What to do |
|-------|------------|
| **Repo / tooling** | Bootstrap app (e.g. Expo + TypeScript or chosen stack), lint/format, folder layout (`features/`, `api/`, `screens/`). |
| **Config** | `.env.example`: `EXPO_PUBLIC_API_BASE_URL`, `EXPO_PUBLIC_USE_MOCK_API`, optional auth path overrides; no secrets in git. |
| **Navigation** | Stack/tab shell: login → active events → detail → guest list → profile. |
| **Design system** | Theme from Stitch (colors, type, spacing); shared components (buttons, lists, app bar, empty/error/loading). |
| **API layer** | TypeScript types + functions: `getMyActivities()`, `getActivity(id)`, `getAttendees(id, page, search)` — **mock + real** implementations behind one interface. |
| **Screens (UI)** | Login layout (email + Google); active events list; event detail; guest list + search + pagination UX; profile + logout (clears local session in mock mode). |
| **Product guard** | Central helper e.g. `isActiveEvent(activity)` for “upcoming or ongoing” — adjust in **one place** when backend contract is final. |
| **Coordination** | Share **mock JSON shapes** with MoveConcept so live API responses stay aligned; treat **`docs/api-docs.json`** as the OpenAPI contract and file tickets for any drift from staging. See [moveconcept-backend-handoff.md](./moveconcept-backend-handoff.md) for a short index and policy notes. |

**Avoid:** hard-coding URLs or response shapes only inside screens — keep them in the **API module** so the swap is trivial.

---

## When MoveConcept gaps are filled (integration checklist)

Do this **once** staging (or prod) matches the contract in **`docs/api-docs.json`** (refresh that file when the backend export changes).

| Step | Action |
|------|--------|
| 1 | Set `EXPO_PUBLIC_API_BASE_URL` to **staging**; set `EXPO_PUBLIC_USE_MOCK_API=false`. |
| 2 | **Auth:** Email + Google flows to real endpoints (done); store token securely; verify `Authorization` on a smoke request after each release. |
| 3 | **My activities:** Replace mock `getMyActivities()` with real `GET` (owner, upcoming/ongoing); fix list mapping if field names differ from mocks. |
| 4 | **Activity detail:** Confirm `GET /api/activities/{id}` matches types; handle 403/404. |
| 5 | **Guest list:** Wire registrations route; confirm **only owner** can load (retest with non-owner token — expect 403). |
| 6 | **Profile:** User from `EXPO_PUBLIC_AUTH_ME_PATH` (default `/api/auth/me`) after login — align response with `extractUser` in `AuthContext` (or agreed alternative). |
| 7 | **Remove / narrow mocks** — keep fixtures for **tests** only if useful. |
| 8 | **E2E pass** on staging: login → list → detail → search attendees → logout. |
| 9 | Update docs if response shapes or query params differ from what McCheck assumed. |

---

## Phase 2 kickoff (execution order)

Use this as the first working sequence once staging API pieces are delivered.

| Order | Owner | Task | Done when |
|------|-------|------|-----------|
| 1 | MoveConcept | Confirm staging URLs + test organizer credentials + sample owned activity with registrations | Mobile can authenticate and load non-empty test data |
| 2 | McCheck | Switch env to staging (`EXPO_PUBLIC_API_BASE_URL`) and disable mocks (`EXPO_PUBLIC_USE_MOCK_API=false`) | App boots against real backend without mock fallback |
| 3 | McCheck | Organizer auth end-to-end (**email** + **Google** via `/api/auth/login/social/google`), persist token, logout | Verified on **TestFlight** (iOS) + **physical Android** (EAS APK) against **staging**; login survives app restart |
| 4 | McCheck | Integrate owner-scoped activities list API and map payload to list cards | Active events screen shows only owned upcoming/ongoing events |
| 5 | McCheck | Integrate event detail with 403/404 handling and user-facing fallback states | Detail screen works for owned events and fails safely otherwise |
| 6 | McCheck + MoveConcept | Integrate registrations with owner-only authorization verification | Owner loads registrations; non-owner gets **403** — **policy confirmed production 2026-04-16** |
| 7 | McCheck | Remove mock-first assumptions from runtime paths (keep mocks only for tests/dev fallback) | Normal app flow runs fully on real API |
| 8 | McCheck | Run staging QA pass (login → events → detail → guest list search/pagination → profile/logout) | No blocker regressions in primary path |
| 9 | McCheck | Freeze V1 release candidate scope and create Phase B backlog (scanner/check-in) | **iOS:** V1 signed off 2026-04-17 (TestFlight / device). **Android:** V1 signed off 2026-04-19 (**physical device**, staging, EAS native build). |

**Platform note (2026-04-19):** Phase 2 steps **1–8** are **done on staging for both iOS and Android** (including organizer smoke on **physical** hardware). **Play Console** `eas submit` / internal testing track is **store distribution**, not a blocker for V1 functional sign-off.

**Suggested working rule:** do not start scanner/check-in (V2) until product/backend explicitly prioritize it; V1 staging validation is complete on **both** platforms.

---

## Below the line — later scopes

Everything below is **after V1** unless an item is explicitly pulled forward.

---

### V2 — Check-in core (still organizer-first)

- **Schema:** `checked_in_at` (and/or dedicated `check_ins` table for idempotency + history).
- **API:** Resolve ticket payload → registration; **POST** check-in (idempotent); error codes (invalid, wrong event, already checked in, cancelled).
- **Mobile:** Scanner UI (camera, torch), success/failure screens tied to real API.
- **Policies:** Only **owner** can check in (until V3 invites).
- **Detail:** [mcheck-v2-implementation-plan.md](./mcheck-v2-implementation-plan.md) — agreed product decisions and delivery plan.

---

### V3 — Co-workers (Wix-style, no web account)

- **Invite model:** email, `activity_id`, token/hash, expiry, revoke.
- **Email** + deep link / code; **exchange** → **scoped scanner token** (narrow abilities).
- **API:** Same attendees / check-in routes, authorized by **owner OR valid scanner invite**.
- **Audit:** Attribute check-ins to **invite/session** when no `user_id`.
- **Mobile:** Second entry path — **open invite link** → scanner flow without organizer login.

---

### V4 — History & operations

- **GET** check-in history per activity (pagination); **Activity history** / drawer UI.
- **Organizer** vs **scanner** visibility rules (e.g. scanner sees limited history).
- Rate limits, monitoring, abuse controls.

---

### V5 — Polish & scale (as needed)

- Offline queue for check-ins (conflict rules).
- Push notifications (optional); see **Organizer notifications** below — **in-app first** is the recommended stepping stone.
- API versioning / contract tests / OpenAPI.
- App store release, analytics, crash reporting.

---

### Organizer notifications — in-app first, push later

**MoveConcept today:** When an attendee **joins** or **cancels**, the **activity owner** gets Laravel **database** notifications (types such as `activityUserRegistered` and `activityUserCanceled`). The web reads them over authenticated **`/api/users/{user}/notifications…`** routes (list, unread count, mark read). Those routes may be **missing from the checked-in `docs/api-docs.json` snapshot** — refresh the OpenAPI export from staging (or document the paths in the handoff doc) before McCheck ships this feature.

**Why in-app first:** McCheck can ship a **notification inbox** and **unread badge** by polling or refreshing on app focus (same contract as web). That validates auth, pagination, payloads, deep links to an activity, and **organizer-only** semantics without waiting on push infrastructure. **It is deliberate preparation for push:** push later adds **device token registration** and a **server-side delivery channel** (FCM/APNs/Expo); database notifications alone do not wake the OS.

**Client shape:** Prefer a small **notification domain layer** (fetch list, map to UI, mark read, refresh unread) so a future push handler can produce the **same UI models** and navigation targets.

**Product alignment:** Organizer-only matches the server; **upcoming / ongoing** behavior follows **registration and cancel rules** on the backend rather than a separate flag inside each notification row.

---

### Cross-cutting (all scopes)

- Staging + prod base URLs; secrets not in git; HTTPS only.
- Align naming in app (**“Active events”** vs internal `state` values).
- Privacy: minimize logging of PII from attendee payloads.

---

## Related documents

- [mcheck-phase-a.md](./mcheck-phase-a.md) — Phase A (pre-backend): defaults, manual QA, tests, release hygiene.
- [mcheck-design-vs-backend.md](./mcheck-design-vs-backend.md) — Stitch vs API gaps, co-worker model, checklist.
- [moveconcept-backend-handoff.md](./moveconcept-backend-handoff.md) — OpenAPI snapshot index + coordination (policy, drift).
- [staging-runbook.md](./staging-runbook.md) — first staging integration steps and smoke test.
- [mcheck-google-oauth-notes.md](./mcheck-google-oauth-notes.md) — Google sign-in (implemented; contract in **`api-docs.json`** `LoginViaSocialRequest`).
- [mcheck-store-release-checklist.md](./mcheck-store-release-checklist.md) — store / EAS / assets checklist.
- [mcheck-v2-implementation-plan.md](./mcheck-v2-implementation-plan.md) — V2 check-in: locked decisions and delivery plan.

## Document control

| Version | Date | Notes |
|---------|------|--------|
| 1.0 | 2026-04-08 | Initial plan: V1 vs V2–V5 |
| 1.1 | 2026-04-08 | Parallel work before backend gaps; integration checklist when gaps are filled |
| 1.2 | 2026-04-09 | Added current status snapshot after UI polish + QA pass; clarified backend-dependent blockers |
| 1.3 | 2026-04-09 | Added Phase 2 kickoff execution order for staging integration |
| 1.4 | 2026-04-09 | Linked Phase A doc (pre-backend QA, tests, release notes) |
| 1.5 | 2026-04-09 | Env var names aligned with Expo (`EXPO_PUBLIC_*`); profile integration step matches `AuthContext`; Google live caveat in Phase 2 |
| 1.6 | 2026-04-09 | Snapshot: mock scenarios + error/retry hardening; pointer to Phase A mock QA table |
| 1.7 | 2026-04-09 | CI (typecheck + tests), EAS `eas.json`, staging runbook, OAuth notes, store checklist, observability stub |
| 1.8 | 2026-04-14 | Updated profile default endpoint reference to `/api/auth/me` |
| 1.9 | 2026-04-14 | Replaced stale attendees/my-activities wording with current registrations and staging-parity status |
| 2.0 | 2026-04-16 | OpenAPI in `api-docs.json` is canonical contract; handoff doc is coordination index; Phase 2 Google path aligned with spec |
| 2.1 | 2026-04-16 | Status snapshot: email + Google on staging/TestFlight; Phase 2 row 3 marked verified |
| 2.2 | 2026-04-16 | Active track: Phase A (mock-first QA) before next release spike; fix V2 vs Phase 2 wording |
| 2.3 | 2026-04-16 | Staging: web-created organizer event visible in app Active events |
| 2.4 | 2026-04-16 | **Recorded:** MoveConcept production — registrations endpoint is **owner-only** (no cross-organizer guest list enumeration) |
| 2.5 | 2026-04-16 | **Organizer notifications:** in-app (user notifications API) as preparation for push; OpenAPI snapshot may omit those routes |
| 2.6 | 2026-04-17 | **V1 iOS signed off;** Android pending Play verification + submit; backend prerequisites table aligned with `GET /users/me/activities`; Phase 2 platform note |
| 2.7 | 2026-04-18 | Snapshot: native Google Sign-In, sign-out before sign-in, EAS APK QR vs Expo Go |
| 2.8 | 2026-04-19 | V1 Android physical + staging sign-off; Phase 2 note; pending = store ops not device QA |
| 2.9 | 2026-04-19 | Link V2 section to [mcheck-v2-implementation-plan.md](./mcheck-v2-implementation-plan.md) |
