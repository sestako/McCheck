# MoveConcept backend — missing API items for McCheck mobile (V1)

**Audience:** Developer maintaining the **MoveConcept** web application.

**Purpose:** After reviewing `api-docs.json` (OpenAPI 3.0), these are the **only items missing** from the documented API that McCheck V1 needs. Everything else (login, logout, me, my activities list, registrations) is already documented and sufficient.

**API base:** `https://moveconcept.cz/api`

---

## 1. Single activity detail endpoint (blocking)

**What's missing:** No `GET /activities/{id}` (or equivalent) in the API docs.

**Why McCheck needs it:** The **Event detail** screen loads a single activity by id after the user taps a list row. Without this, we'd have to carry the full payload from the list — fragile and doesn't support deep links.

**Request:** Document (and expose if not yet live) a route like:

```
GET /activities/{activity}
```

Returning the same fields as `MyActivityResource` (or richer), wrapped in `{ "code": "SUCCESS", "data": { "activity": { … } } }`.

---

## 2. Google sign-in endpoint (blocking)

**What's missing:** Only `POST /auth/login` (email + password + deviceName) is documented. No Google OAuth route.

**Why McCheck needs it:** Product requires **"same account as web"** including Google sign-in. The mobile app obtains a Google ID token (or auth code) and needs a server endpoint to exchange it for a MoveConcept bearer token.

**Request:** Document a route, e.g.:

```
POST /auth/google
```

Body: `{ "idToken": "…", "deviceName": "…" }` (or agreed field names).
Response: same shape as `/auth/login` — `{ "code": "SUCCESS", "data": { "token": "…", "user": { … } } }`.

---

## 3. Search / filter param on registrations (needed for V1)

**What's missing:** `GET /activities/{activity}/registrations` supports `page` and `perPage` but **no `search` query parameter**.

**Why McCheck needs it:** The **Guest list** screen has a search bar for filtering attendees by name. Without server-side search, we'd have to load all pages client-side — impractical for large events.

**Request:** Add an optional query parameter, e.g.:

```
GET /activities/{activity}/registrations?search=Jordan&page=1&perPage=10
```

Filtering on guest/user name fields.

---

## 4. `registrationsCount` and `attendingGuestsCount` on `MyActivityResource` (needed for V1)

**What's missing:** `MyActivityResource` includes id, uuid, state, name, slug, teaser, category, description, address, lat, lon, isSpecial, capacity, start, end, createdAt, updatedAt — but **not** registration or guest counts.

**Why McCheck needs it:** The **Active events** list and hero show stats like **"142 registrations"** and **"8 guests"** per activity. Without these fields, we'd need a separate call per activity.

**Request:** Add to `MyActivityResource`:

```json
{
  "registrationsCount": 142,
  "attendingGuestsCount": 8
}
```

---

## Summary

| # | Item | Priority |
|---|------|----------|
| 1 | `GET /activities/{id}` — single activity detail | **Blocking** |
| 2 | Google sign-in endpoint | **Blocking** |
| 3 | `search` param on registrations | **Needed for V1** |
| 4 | `registrationsCount` + `attendingGuestsCount` on `MyActivityResource` | **Needed for V1** |

Everything else in `api-docs.json` (login, logout, me, my activities, registrations structure) is sufficient for McCheck V1.

---

## Document control

| Version | Date | Notes |
|---------|------|--------|
| 1.0 | 2026-04-08 | Initial handoff from McCheck planning |
| 2.0 | 2026-04-13 | Rewritten: only items missing from `api-docs.json` (OpenAPI); prior appendices moved to code references in `mobile/src/api/` |
