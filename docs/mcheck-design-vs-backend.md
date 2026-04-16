# McCheck: Stitch design vs MoveConcept backend

**Purpose:** Align the Stitch project *McCheck Event Manager* with what **SourceOfTruth_MoveConcept** (MoveConcept) supports today, what the **mobile app can build now**, and what **requires backend (and often DB) work**. Includes an actionable checklist.

**References:**

- Stitch project: [7680784973734768791](https://stitch.withgoogle.com/projects/7680784973734768791)
- Web app repo: `moveconcept` (Laravel + Sanctum + JS `resources/js/http/endpoints.ts`)

---

## 1. Executive summary

**Build status (2026-04-09):**

- McCheck mobile UI scaffold for organizer V1 is implemented and QA-checked on simulator (login, active events, detail, guest list, profile).
- Stitch visual direction is translated into a native token system and polished screen layouts.
- Remaining delivery risk is primarily **backend contract + authorization**, not client UI readiness.

| Area | Mobile / UI | Backend today |
|------|-------------|----------------|
| **Visual design** (Forest Minimalist / tokens) | Fully implementable in the client | Not required |
| **Auth** | Login UI + token storage | **Available in OpenAPI:** `POST /api/auth/login`, `GET /api/auth/me`, `DELETE /api/auth/logout` (staging parity validation in progress) |
| **Event discovery / “my events”** | Lists, navigation | **Available in OpenAPI:** `GET /api/users/me/activities` (owner-scoped list) |
| **Guest list** | List + search UI | **Available in OpenAPI:** `GET /api/activities/{activity}/registrations` (guest/user polymorphic rows; check-in still out of scope) |
| **Scanner / check-in** | Camera + UX | **Missing:** no validate/mark-checked-in API; **no check-in fields** on `activity_registrations` |
| **History / audit** | Timeline UI | **Missing** |
| **Co-workers (Wix-style)** | Invite / scanner-only flows in UI | **Missing:** no **email invite → scoped scanner session** without a MoveConcept user account |

**Product rule (organizer):** A logged-in organizer sees **only events they created** (`owner_id`).

**Product rule (co-worker):** Co-workers **do not** have a MoveConcept web-app account. They are **invited by email**, open a link, and use McCheck **only to scan (and optionally view guest list)** for the **activity(ies) tied to that invite**—same idea as the **Wix Check-in app** model for door staff.

---

## 2. Stitch screens (reference set)

After duplicate cleanup, treat these as the **UX targets** (names from Stitch MCP):

1. Login
2. Event Hub
3. Upcoming Events
4. Guest List by Event
5. Scanner Engine (Success)
6. Scanner Engine (Failure)
7. Activity History by Event / Drawer
8. Profile & Staff
9. Add Co-worker
10. Settings
11. McCheck Project Requirements (internal spec—keep as doc, not shipped UI)

---

## 3. Backend surface (what we know exists)

**Activities (public API prefix `api/activities`):**

- `GET /api/activities/map` — map data
- `GET /api/activities/{id}` — activity detail (`ActivityResource`: id, uuid, state, name, dates, capacity, registration/guest counts, owner, …)
- `GET /api/activities/{activity}/registrations?page=&perPage=` — paginated registrations (guest/user polymorphic rows)
- Share: `GET /api/activities/{id}/share/card`

**Search:**

- `GET /api/search/activities` — public search (query params)
- `GET /api/search/users` — **Sanctum**

**User (Sanctum):**

- `GET /api/users/{id}`, followers/following, notifications, follow/block, etc.

**Auth pattern:**

- OpenAPI documents mobile token auth endpoints under `/api/auth/*`.
- Protected routes use auth middleware (`auth:sanctum` in web/backend implementation).

**Domain model note:**

- `ActivityRegistration`: `uuid`, `activity_id`, polymorphic `model` (User/Guest); **no timestamps / no checked-in flag** in the model inspected

**Authorization (McCheck / MoveConcept) — confirmed 2026-04-16:**

- **`GET /api/activities/{activity}/registrations`** is **owner-only** in **production**: only the **activity owner** may load the guest list; another authenticated organizer **cannot** enumerate registrations by guessing activity IDs (expects **403**).

---

## 3.1 Co-workers: target solution (Wix-style, mirror in backend design)

**Intent:** Match **Wix Check-in–style** door staff: **no MoveConcept user account**; **email invitation**; app access **scoped to scanning** (and related read-only views) for **specific activities**.

| Piece | Description |
|--------|-------------|
| **Invite entity** | Persist: target `activity_id`, invitee email, role (e.g. `scanner`), secret or hashed token, `expires_at`, `revoked_at`, optional label (“Entrance A”). |
| **Email** | Transactional email with **HTTPS and/or deep link** (`mccheck://…`) carrying a **one-time or signed** code (not long-lived secrets in URL if avoidable). |
| **Exchange** | `POST` e.g. **exchange invite code** → returns **scanner session** (JWT and/or **Sanctum personal access token** with **narrow abilities**: `activity:{id}:scan`, optionally `activity:{id}:attendees:read`). |
| **Visibility** | Scanner session **never** sees “all my events”—only **the activity (or list) bound to the invite**. Organizer flow remains **owner-only** event list. |
| **Check-in audit** | Log **invite id** or **scanner session id** (and/or email hash) when there is no `user_id`—so history is attributable without a full account. |
| **Revocation** | Owner can **revoke** an invite; tokens invalidated server-side. |

**McCheck app entry modes:**

1. **Organizer:** normal login → **only owned events**.
2. **Co-worker:** open **invite link** → exchange → **scanner session** → straight into **that event’s scan / guest list** (minimal or no “account” UI).

**Not in scope for co-workers (unless product changes):** creating/editing activities, seeing other organizers’ data, or full `User` profile APIs tied to a MoveConcept account.

---

## 4. Screen-by-screen: implementable vs backend gap

| # | Stitch screen | Client can build (UI + navigation) | Data / API today | Backend / schema needed |
|---|----------------|-------------------------------------|------------------|-------------------------|
| 1 | **Login** | Yes | OpenAPI includes mobile token login/logout/me endpoints | Integrate contract details (`deviceName`, error codes, token parsing) and verify staging parity |
| 2 | **Event Hub** | Yes | Partial: search + maybe compositing multiple calls | **“Hosted by me”** list API (upcoming/past) with filters; **owner-only** enforcement |
| 3 | **Upcoming Events** | Yes | Same as hub + `activity` detail | Same; **only owner’s** events |
| 4 | **Guest List** | Yes | `registrations` + pagination (`page`, `perPage`) | Add/confirm search support and policy: **owner OR scanner session for this `activity_id`** |
| 5 | **Scanner success** | Yes (animation, copy) | **None** for “valid ticket” | **Resolve code → registration**; idempotent **check-in**; allowed for **owner OR scanner session** |
| 6 | **Scanner failure** | Yes | **None** | Same resolver; explicit error codes (unknown, already checked in, wrong event, cancelled) |
| 7 | **Activity history** | Yes | **None** | **Check-in audit**; attribute rows to **user_id** (organizer) or **invite/session** (co-worker) |
| 8 | **Profile & Staff** | Yes | **User** APIs only for **organizer** profile | **List invites / status** for an activity; not “staff users” with accounts |
| 9 | **Add co-worker** | Yes | **None** | **Create invite** (email + activity + role), send mail, **revoke** endpoint; **no** requirement for invitee to exist in `users` table |
| 10 | **Settings** | Yes | Partial (client prefs) | Server-backed prefs if needed; push, locale, etc. |
| 11 | **Requirements doc** | N/A | N/A | Keep as internal traceability only |

---

## 5. Phased delivery (suggested)

**Phase A — Client-only / thin API**

- App shell, theme (Stitch tokens), navigation placeholders
- Login wired to **real** auth contract and staging parity-checked
- **Activity detail** from `GET /api/activities/{id}`
- **Guest list** read-only from current registrations API (knowing limitations)

**Phase B — Backend MVP for check-in**

- DB: `checked_in_at`, optional `checked_in_by_user_id` on `activity_registrations` (or separate `check_ins` table for history)
- `POST` check-in (by registration uuid); **policy: owner only** initially, then extend to scanner tokens
- Resolver: barcode payload → registration + event match

**Phase C — Co-workers + history**

- **Scanner invites** table + email + exchange endpoint + **scoped tokens**
- **Revocation** + optional invite list UI on web + “staff” section in McCheck for **organizer only**
- History API + UI; audit dimension for **invite/session**

---

## 6. Extended checklist

Use this as a living checklist (copy into Issues/Projects as needed).

### 6.1 Product & UX

- [ ] **Organizer:** sees **only events they own**
- [ ] **Co-worker:** **no** MoveConcept account; **email invite** → **scan-only** (Wix-style) for **bound activity**
- [ ] Confirm whether **guest registrations** (non-user) must appear on guest list + scannable
- [ ] Define **offline** behavior (queue check-ins vs online-only v1)
- [ ] Map each Stitch screen to **one** nav route in the mobile app
- [ ] **Two entry paths** in McCheck: organizer login vs **deep link / invite code** flow
- [ ] Export / pin **latest** Stitch screens after duplicate cleanup (reference only)

### 6.2 Auth (mobile)

- [ ] **Organizer:** token API (or agreed alternative) + Keychain / Keystore
- [ ] **Co-worker:** **exchange invite code** → **scoped scanner token**; expiry + refresh rules (if any)
- [ ] Align with **Sanctum** abilities / JWT claims for **per-activity** scope
- [ ] Rate-limit exchange and login endpoints

### 6.3 Events list (“Event hub” / “Upcoming”)

- [ ] API: **list my activities** where **owner = current user** (upcoming/past) via `/api/users/me/activities`
- [ ] Pagination, filters (state, date range)
- [ ] Co-worker flow: **skip** global hub or show **single event** from invite scope only

### 6.4 Activity detail

- [ ] Consume `GET /api/activities/{id}` where policy allows (**owner or scanner for that id**)
- [ ] Show capacity vs counts; confirm semantics with backend
- [ ] Handle `state` for organizer; scanner may be blocked if event cancelled (product rule)

### 6.5 Guest list

- [ ] Wire attendees + search; **policy: owner OR scanner session**
- [ ] Backend: **registration uuid**, guest/user, check-in flags when Phase B exists
- [ ] Remove reliance on **`ActivityPolicy::show`** for sensitive attendee data in production

### 6.6 Scanner

- [ ] Payload: QR content (registration uuid vs signed token)
- [ ] Camera, torch, idempotent **POST** check-in
- [ ] Errors: invalid / wrong event / already checked in
- [ ] **Co-worker** sessions allowed **only** if invite includes scan permission

### 6.7 Activity history

- [ ] Audit schema: timestamp, registration, **actor** (`user_id` **or** `invite_id` / session)
- [ ] `GET` history for activity; **owner** full view; **scanner** optional restricted view (product decision)

### 6.8 Co-workers (invites)

- [ ] DB: **scanner_invites** (or equivalent): `activity_id`, email, token/hash, `expires_at`, `revoked_at`, role
- [ ] **POST** create invite (organizer-only); transactional **email** with link/code
- [ ] **POST** exchange code → scanner access token
- [ ] **DELETE** / revoke invite
- [ ] **GET** list invites for activity (organizer dashboard / McCheck “Staff” screen)
- [ ] Deep link handling in McCheck (iOS / Android)

### 6.9 Settings

- [ ] Local: theme, haptics, language
- [ ] Remote: only if product needs sync

### 6.10 Security & compliance

- [ ] Rate-limit check-in, exchange, and resolve endpoints
- [ ] No attendee list leakage to **non-owner / non-invited scanner**
- [ ] GDPR / retention for check-in logs and **invitee email**
- [ ] Rotate secrets; avoid long-lived raw tokens in URLs where possible

### 6.11 Release engineering

- [ ] Staging base URL + env config in McCheck
- [ ] API versioning if breaking changes expected
- [ ] Contract tests or OpenAPI for new endpoints

---

## 7. Open questions for backend / PM

1. Should **check-in** be reversible (undo) and who can undo?
2. Are **tickets** always tied to logged-in users, or also **Guest** rows?
3. Do we need **multi-device** concurrent scanning for one event?
4. **Invite:** single-use vs multi-use, default **TTL**, max active invites per event?
5. Can one email receive **multiple** invites (different events) simultaneously—how does the app disambiguate?
6. Should **scanner** see **full** guest list or only **search-by-code** without full list (privacy)?

---

## 8. Document control

| Version | Date | Notes |
|---------|------|--------|
| 1.0 | 2026-04-08 | Initial mapping from MoveConcept codebase review + Stitch MCP summary |
| 1.1 | 2026-04-08 | Co-workers: Wix-style email invite, no web account; §3.1, summary, phases, checklist, open questions |
| 1.2 | 2026-04-09 | Added build status after mobile UI implementation and QA validation |
| 1.3 | 2026-04-14 | Refreshed API status/endpoint references to current OpenAPI contract (`/api/auth/*`, `/api/users/me/activities`, registrations) |
| 1.4 | 2026-04-16 | Corrected my-activities path: `/api/users/me/activities` (not under `/api/auth/users/…`) |
| 1.5 | 2026-04-14 | Removed stale web-login/attendees assumptions; clarified staging parity and registrations wording |
| 1.6 | 2026-04-16 | **Confirmed:** registrations list endpoint is **owner-only** in production (403 for non-owner) |
