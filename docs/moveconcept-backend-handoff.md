# MoveConcept API — McCheck coordination (OpenAPI snapshot)

**Audience:** McCheck mobile and anyone integrating with the MoveConcept REST API.

**Purpose:** `docs/api-docs.json` is a **checked-in OpenAPI 3.0 snapshot** of the MoveConcept public API (exported from **staging**, synced 2026-04-16). It is the canonical contract for the routes McCheck V1 targets.

**Bases:** See `servers` in the JSON — production `https://moveconcept.cz/api` and staging `https://staging.moveconcept.cz/api`.

---

## V1-relevant surface (summary)

| Area | Route / notes |
|------|----------------|
| Activity detail | `GET /activities/{activity}` → `data.activity` as **`ActivityResource`** (includes `owner`, `registrationsCount`, `attendingGuestsCount`) |
| Registrations | `GET /activities/{activity}/registrations` — query: `page`, `perPage`, optional **`search`** |
| Email login | `POST /auth/login` — `LoginRequest`: `email`, `password`, `deviceName` |
| Google (social) | `POST /auth/login/social/{provider}` — `provider` enum **`google`**; body **`LoginViaSocialRequest`**: required **`accessToken`**, **`deviceName`**; same success shape as email login (`UserWithTokenResponse`) |
| Session | `DELETE /auth/logout`, `GET /auth/me` |
| My activities | `GET /auth/users/me/activities` — optional `filter`: `draft` \| `upcoming` \| `ongoing`; pagination |
| List rows | **`MyActivityResource`** includes **`registrationsCount`** and **`attendingGuestsCount`** |

Implementers should read field-level detail in **`api-docs.json`** (`components.schemas`, `components.requestBodies`, `components.responses`).

---

## Outside the OpenAPI file

- **Authorization:** Owner-only access for organizer flows should be verified on staging against product rules (see [mcheck-design-vs-backend.md](./mcheck-design-vs-backend.md)).
- **Google mobile:** The documented exchange uses **`accessToken`** (token from the social provider as the API expects). Align the native client with that contract; do not assume a separate `POST /auth/google` or `idToken`-only body unless the server is changed and the spec updated.

---

## Historical note

Versions **1.0–2.0** of this document listed blocking backend requests before those capabilities appeared in our OpenAPI copy. As of **3.0**, those items are **documented in `api-docs.json`**; this file is retained as a short index and coordination pointer.

---

## Document control

| Version | Date | Notes |
|---------|------|--------|
| 1.0 | 2026-04-08 | Initial handoff — missing API items |
| 2.0 | 2026-04-13 | Missing-items list tied to OpenAPI only |
| 3.0 | 2026-04-16 | Coordination doc; OpenAPI synced to MoveConcept staging export |
