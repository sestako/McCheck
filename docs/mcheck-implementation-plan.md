# McCheck — implementation plan

## Current status snapshot (2026-04-16)

**Completed in mobile (`mobile/`):**

- Expo + TypeScript app; core V1 screens: **Login** (email + **Google**), **Active events**, **Event detail**, **Guest list**, **Profile**.
- API layer: **mock** and **real** clients behind `createActivitiesApi`; contract aligned with **`docs/api-docs.json`** (staging OpenAPI snapshot).
- **Auth:** `AuthContext` — email `POST /api/auth/login`; Google via `GoogleSignInButton` + `expo-auth-session`, then `POST /api/auth/login/social/google` with `accessToken` + `deviceName`; token in SecureStore; `/api/auth/me` for profile; logout `DELETE /api/auth/logout`.
- **Google / TestFlight:** OAuth flow waits for hook **response** after code exchange (fixes empty token on device builds). iOS **EAS production** builds submitted to TestFlight; env for staging API + Google client IDs in `mobile/eas.json` profiles.
- Stitch-inspired UI tokens and polish; **Retry** on event detail + guest list errors; mapper unit tests.
- **CI:** GitHub Actions — `npm run typecheck` + `npm test` on `mobile/`; `initObservability` placeholder for Sentry.
- **Staging (real data):** An activity **created on MoveConcept staging** by the signed-in organizer **appears in Active events** in the app (same account as web) — validated 2026-04-16.

### Active track: Phase A (mock-first quality)

**Do this first** before the next feature spike or wide TestFlight rollout: follow **[mcheck-phase-a.md](./mcheck-phase-a.md)** end-to-end — default **mock API** dev, **~5 min manual QA**, optional **`EXPO_PUBLIC_MOCK_SCENARIO`** matrix (one scenario at a time), keep **`npm test` / `npm run typecheck`** green. Phase A is UI/UX and client robustness **without** staging dependency.

**Still pending / next validation (after or parallel to Phase A):**

- Full **staging smoke** per [staging-runbook.md](./staging-runbook.md) on every release (detail, registrations **search**, owner **403** cases — **activities list** already validated with web-created event).
- **Backend / product:** confirm **owner-only** registrations access in production; resolve any drift between live staging and `api-docs.json`.
- **Android:** same Google OAuth + EAS path when you cut an Android build (SHA-1 / package — see [mcheck-android-google-oauth-setup.md](./mcheck-android-google-oauth-setup.md)).
- **V2 (later):** scanner / check-in — see **Below the line — V2** in this doc; do not start until Phase 2 kickoff steps **1–8** are green on staging (rule in Phase 2 section).

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
| **Guest list** | Paginated list + search, wired to registrations API **after** backend restricts access to **owner** (see prerequisites). |
| **Profile** | Read-only self profile + logout (minimal). |
| **Design** | Stitch as reference; implement natively (Forest Minimalist / tokens in `mcheck-design-vs-backend.md`). |

**Backend prerequisites for V1 (MoveConcept):**

- **New:** `GET` (or equivalent) **`activities I own`** with filters for **upcoming + ongoing**, pagination, fields needed for list rows.
- **Auth for mobile:** Token flow for **email** + **Google** social login → same user as web (mobile implemented; keep OpenAPI + staging in sync).
- **Harden:** **Registrations** endpoint authorized **only** for **activity owner** (replace or narrow current `ActivityPolicy::show`-style access for this route in production).

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
| 3 | McCheck | Organizer auth end-to-end (**email** + **Google** via `/api/auth/login/social/google`), persist token, logout | Verified on simulator + **TestFlight**; login survives app restart |
| 4 | McCheck | Integrate owner-scoped activities list API and map payload to list cards | Active events screen shows only owned upcoming/ongoing events |
| 5 | McCheck | Integrate event detail with 403/404 handling and user-facing fallback states | Detail screen works for owned events and fails safely otherwise |
| 6 | McCheck + MoveConcept | Integrate registrations with owner-only authorization verification | Owner loads registrations; non-owner test gets 403 |
| 7 | McCheck | Remove mock-first assumptions from runtime paths (keep mocks only for tests/dev fallback) | Normal app flow runs fully on real API |
| 8 | McCheck | Run staging QA pass (login → events → detail → guest list search/pagination → profile/logout) | No blocker regressions in primary path |
| 9 | McCheck | Freeze V1 release candidate scope and create Phase B backlog (scanner/check-in) | V1 integration milestone signed off |

**Suggested working rule:** do not start scanner/check-in work until steps 1-8 are green on staging.

---

## Below the line — later scopes

Everything below is **after V1** unless an item is explicitly pulled forward.

---

### V2 — Check-in core (still organizer-first)

- **Schema:** `checked_in_at` (and/or dedicated `check_ins` table for idempotency + history).
- **API:** Resolve ticket payload → registration; **POST** check-in (idempotent); error codes (invalid, wrong event, already checked in, cancelled).
- **Mobile:** Scanner UI (camera, torch), success/failure screens tied to real API.
- **Policies:** Only **owner** can check in (until V3 invites).

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
- Push notifications (optional).
- API versioning / contract tests / OpenAPI.
- App store release, analytics, crash reporting.

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
