# MoveConcept backend — requests for McCheck mobile (V1)

**Audience:** Developer maintaining the **MoveConcept** web application (`moveconcept` / SourceOfTruth).

**Purpose:** McCheck is a **separate mobile app** for **event organizers** at the door: see **their** upcoming/ongoing events, **activity detail**, and **guest list**. This document lists **gaps in the current API and authorization** that block or risk that V1. Please implement or confirm alternatives.

**Related:** [mcheck-implementation-plan.md](./mcheck-implementation-plan.md), [mcheck-design-vs-backend.md](./mcheck-design-vs-backend.md).

**Canonical JSON + field mapping (share with backend):** [Appendix A](#appendix-a--mcheck-v1-json-shapes-no-live-endpoint-required) and [Appendix B](#appendix-b--field-mapping-api--app--ui) below — aligned with `mobile/src/api` mocks and mappers, no live server required.

---

## Context (product)

- **User:** Organizer = MoveConcept user who **created** the activity (`owner_id`).
- **Login:** Same identities as web — **email** and **Google** — **no** separate “app-only” account.
- **“Active events”:** Activities **owned by the user** that are **upcoming or ongoing** (exact date rules = product decision; please align with mobile).

## Current integration status (2026-04-09)

- McCheck mobile app has completed organizer-side V1 UI scaffold and internal QA with mock API.
- Mobile is ready to integrate immediately once the three blocking backend items below are available on staging.
- This handoff remains valid and unchanged in scope: auth contract, owner-scoped activities list, owner-only attendees authorization.

---

## 1. Mobile authentication API (blocking)

**Status:** API routes use `auth:sanctum`, but there is **no dedicated API login flow** visible for a native client (email/password → token, and Google → same `users` row).

**Request:**

- **Email (and password):** Expose an endpoint (or documented Sanctum flow) that returns a **token** the mobile app can send as `Authorization: Bearer …` (or cookie strategy if you standardize on that — native apps usually prefer tokens).
- **Google:** Flow that matches web: verify Google credential on server and issue the **same** session/token as for that user in `users` (same linking as existing web Google login).

**Acceptance criteria:**

- Document **URL**, **request/response JSON**, **error codes** (invalid credentials, unverified email, etc.).
- Mobile can call authenticated endpoints with the issued credential.
- **Logout / revoke** token if applicable.

---

## 2. List “activities I own” — upcoming & ongoing (blocking)

**Status:** `src/Activity/Infrastructure/Routes/api.php` exposes `GET /api/activities/map`, `GET /api/activities/{id}`, attendees, share — **no** `GET` list for **owner’s activities**. Account activity listing exists for **web** (`AccountActivityController`), not as a **JSON API** for mobile.

**Request:**

- New endpoint, e.g. `GET /api/activities/mine` (name up to you), **`auth:sanctum`**, returns **only** activities where `owner_id = auth()->id()`.
- Query params: filter **upcoming + ongoing** (define semantics: e.g. `end > now` and `state` in allowed set; exclude draft if product says so).
- Pagination; response fields sufficient for a **list row** (id, name, start, end, state, registration counts, optional teaser/image if available).

**Acceptance criteria:**

- Authenticated organizer sees **only** their activities; another user cannot list someone else’s.
- Document contract for McCheck (query params + JSON shape).

---

## 3. Attendees endpoint — authorize owner (or stricter) for production (blocking)

**Status:** `ActivityAttendeesRequest` authorizes with **`ActivityPolicy::PolicyShow`**, i.e. anyone who can **view** a **public** activity (subject to block rules) may access **`GET /api/activities/{id}/attendees`**. That is **wider** than “door staff / organizer only” and is risky for McCheck.

**File reference:** `src/Activity/Infrastructure/Http/Api/Request/ActivityAttendeesRequest.php` (authorize uses `PolicyShow`).

**Request:**

- For **`GET /api/activities/{id}/attendees`**, require **`auth()->id() === $activity->owner_id`** for V1 (or a dedicated policy method e.g. `manageAttendees`).
- Later, same route can also allow **scanner invite tokens** (separate scope); not required for V1 if McCheck is organizer-only.

**Acceptance criteria:**

- Non-owner cannot read attendees, even if they can “show” the public activity page.
- Owner can still read attendees as today (plus any fields you add later).

---

## 4. Optional V1 improvements (not strictly blocking UI)

- **Guest list payload:** Today `ActivityAttendeeResource` exposes **`user`** + **`isBlocked`** only. For future scanner/check-in you will need **registration `uuid`**, guest vs user, check-in flags — **out of scope for McCheck V1 read-only list** unless product wants them early.
- **OpenAPI / short doc** for the three areas above once implemented.

---

## 5. Staging environment (ops)

Not a code gap, but McCheck team needs:

- **HTTPS base URL** for staging, test **organizer** account, at least one **owned** activity with **registrations** so guest list is non-empty.

---

## Summary checklist for MoveConcept developer

| # | Item | Priority |
|---|------|----------|
| 1 | Mobile auth: email + Google → same user, token (or agreed) API + docs | **Blocking** |
| 2 | `GET` (or equivalent) **my activities** — upcoming/ongoing, owner-scoped, paginated | **Blocking** |
| 3 | **Attendees** route: authorize **owner** (not `PolicyShow` only) | **Blocking** |
| 4 | Staging + test data | **Ops** |
| 5 | Richer attendee JSON / check-in later | **Later** |

---

## Appendix A — McCheck V1 JSON shapes (no live endpoint required)

This section **locks the contract on paper**: sample payloads match the mobile **mock fixtures** and the **mapped** types the UI consumes. MoveConcept can implement **snake_case** in Laravel resources; McCheck maps to the shapes below in `mobile/src/api/real/mappers.ts` (`mapActivity`, `mapAttendee`, `pickDisplayName`), used by `realActivitiesApi.ts`.

**Code references (source of truth):**

| Concern | Location |
|--------|----------|
| TypeScript models | `mobile/src/api/types.ts` |
| Mock data | `mobile/src/api/mock/fixtures.ts` |
| List response normalization | `mobile/src/api/real/extractActivitiesList.ts` |
| HTTP + mapping | `mobile/src/api/real/realActivitiesApi.ts` + `mobile/src/api/real/mappers.ts` |
| Login token parsing | `mobile/src/lib/authToken.ts` |
| Env defaults | `mobile/src/config/env.ts` |

### A.1 Authentication (expected client behavior — finalize URLs with backend)

McCheck uses configurable paths (defaults below). **POST** JSON body for email sign-in: `{ "email": "…", "password": "…" }`.

| Env / default | Value |
|---------------|--------|
| `EXPO_PUBLIC_API_BASE_URL` + `EXPO_PUBLIC_AUTH_LOGIN_PATH` | default path `/api/login` |
| `EXPO_PUBLIC_AUTH_ME_PATH` | default `/api/user` |
| `EXPO_PUBLIC_AUTH_LOGOUT_PATH` | default `/api/logout` |

**Token extraction** from a successful login JSON body tries, in order: `data.token`, `data.access_token`, `data.plainTextToken`, `data.authorization.token` (see `extractAuthTokenFromBody`). Backend should return **one** stable string field McCheck can document after the first staging response.

**Illustrative 200 shape** (field names are examples — align staging to one of the supported token keys above):

```json
{
  "data": {
    "token": "plain-text-token-or-bearer-value",
    "token_type": "Bearer"
  }
}
```

**Errors:** Client surfaces Laravel-style `message` or first value in `errors` object (`parseApiErrorBody`).

### A.2 Activity (single resource)

After mapping, each **activity** matches this **canonical** shape (camelCase). Backend may send **`registrations_count`**, **`attending_guests_count`**, **`owner_id`**, nested **`owner`**, etc.; the mapper fills `Activity`.

```json
{
  "id": 101,
  "uuid": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeee101",
  "state": "PUBLIC",
  "name": "Spring 5K — Packet pickup",
  "teaser": "Evening pickup at the community center.",
  "capacity": 200,
  "start": "2026-04-11T12:00:00.000Z",
  "end": "2026-04-11T14:00:00.000Z",
  "registrationsCount": 142,
  "attendingGuestsCount": 8,
  "owner": {
    "id": 1,
    "displayName": "Alex Organizer"
  }
}
```

- **`start` / `end`:** ISO 8601 strings; screens format with `toLocaleString` / device locale.
- **`state`:** Raw API value; list/detail show a **badge** via `state.replace(/_/g, ' ')` + uppercase (e.g. `PUBLIC` → “PUBLIC”).

### A.3 `GET` “my activities” — list wrapper

McCheck normalizes several wrappers in `extractActivitiesList`. **Preferred for staging** (pick one and stick to it):

1. **Top-level array** under `data`: `{ "data": [ { …activity… }, … ] }`
2. **Named array:** `{ "data": { "activities": [ … ] } }` or `{ "activities": [ … ] }`
3. **Items array:** `{ "data": { "items": [ … ] } }`

Each element is mapped with the same rules as **A.2**.

### A.4 `GET /api/activities/{id}` — detail

`fetchActivity` reads **`activity` from `(body.data ?? body)`** — the nested **`activity` key is required** (a bare activity object at the JSON root without that key is **not** accepted).

Valid shapes include:

- `{ "data": { "activity": { … } } }`
- `{ "activity": { … } }` (root-level `activity`)

The `activity` object is then passed through `mapActivity` and must contain the fields in **A.2** (possibly snake_case before mapping).

### A.5 `GET /api/activities/{id}/attendees`

Query: `page` (1-based), optional `search` (guest name filter).

**Pagination + rows** — `fetchAttendees` uses `(body.data ?? body).attendees`, so **`attendees`** may sit under **`data`** or at the **root**, next to a Laravel-style paginator:

**Example (nested under `data`):**

```json
{
  "data": {
    "attendees": {
      "data": [
        {
          "user": {
            "id": 10001,
            "public_name": "Jordan Lee"
          },
          "is_blocked": false
        }
      ],
      "current_page": 1,
      "last_page": 3
    }
  }
}
```

**Guest display name (`pickDisplayName`):** `publicName`, `public_name`, `displayName`, `display_name`, `name`, or `firstname` / `lastname` (and `first_name` / `last_name`). **Blocked flag:** `isBlocked` or `is_blocked`.

**Canonical row after mapping:**

```json
{
  "user": { "id": 10001, "displayName": "Jordan Lee" },
  "isBlocked": false
}
```

---

## Appendix B — Field mapping (API → app → UI)

| API / resource field (typical) | Internal (`types.ts`) | Where it appears in UI |
|-------------------------------|------------------------|-------------------------|
| `id` | `Activity.id` | Navigation params; detail |
| `uuid` | `Activity.uuid` | Event detail → row **“UUID”** |
| `name` | `Activity.name` | List title; detail title; nav title |
| `state` | `Activity.state` | List + detail **badge**; detail **“State”** row |
| `teaser` | `Activity.teaser` | Detail **“About”** (if present) |
| `capacity` | `Activity.capacity` | List meta “capacity N”; detail stat **“capacity”** |
| `start`, `end` | `Activity.start`, `Activity.end` | List “when”; detail **date range** |
| `registrations_count` / `registrationsCount` | `registrationsCount` | Hero **“registrations”**; list row “N registrations”; detail stat |
| `attending_guests_count` / `attendingGuestsCount` | `attendingGuestsCount` | List row “guests N”; detail stat **“guests”** (shown when count is positive) |
| `owner` / owner user fields | `Activity.owner.displayName` | Detail **“Owner”** |
| Attendee `user.*` name fields | `AttendeeRow.user.displayName` | Guest row **name**; avatar initial |
| `is_blocked` / `isBlocked` | `AttendeeRow.isBlocked` | Guest row **“Blocked”** chip |
| *(auth)* user email / name | `AuthUser` in context | Profile **“Signed in as”** |

**Ambiguous / product:**

- **`state` values** (e.g. `PUBLIC` vs draft): list filter is **`isActiveEvent`** in app + backend “upcoming/ongoing” filter — keep enums aligned when backend documents them.
- **“Guest”** subline on guest rows is **static copy** in V1, not an API field.

---

## Contact / questions

McCheck mobile team can clarify **“ongoing”** definition and list row fields once this is in progress. **Appendix A–B** are the preferred baseline for staging JSON reviews.

**Document control**

| Version | Date | Notes |
|---------|------|--------|
| 1.0 | 2026-04-08 | Initial handoff from McCheck planning |
| 1.1 | 2026-04-09 | Added integration status note after mobile scaffold + QA completion |
| 1.2 | 2026-04-09 | Appendix A (canonical JSON + auth/token expectations) and Appendix B (field mapping); code pointers for McCheck repo |
| 1.3 | 2026-04-09 | Appendix A.4/A.5 aligned with `realActivitiesApi` (detail requires `activity` key; attendees wrapper); attendee `display_name` in mapper |
| 1.4 | 2026-04-09 | Code pointers: mapping lives in `mappers.ts` (not only `realActivitiesApi.ts`) |
