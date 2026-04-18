# MoveConcept API — McCheck coordination (OpenAPI snapshot)

**Audience:** McCheck mobile and anyone integrating with the MoveConcept REST API.

**Purpose:** `docs/api-docs.json` is a **checked-in OpenAPI 3.0 snapshot** of the MoveConcept public API, last replaced **2026-04-19** from a current MoveConcept export (same JSON as `app:generate-api-docs`, supplied as `api-docs-spec.html`). **Regenerate** whenever you pull backend changes (see **Source repository & refreshing OpenAPI** below). **McCheck V1** is verified on **physical iOS and Android** devices against **staging** (organizer path: auth, active events, detail, guest list, profile, logout) — **iOS** signed off 2026-04-17 (TestFlight / device); **Android** signed off 2026-04-19 (EAS native APK). **Expo Go** does not run native Google Sign-In; use **EAS builds** for full smoke.

**Bases:** See `servers` in the JSON — production `https://moveconcept.cz/api` and staging `https://staging.moveconcept.cz/api`.

---

## Source repository & refreshing OpenAPI

**Canonical backend source:** [github.com/marek-mikula/moveconcept](https://github.com/marek-mikula/moveconcept) (`master` unless you agree on another branch, e.g. `staging`).

**Update the local checkout** (same machine as McCheck, or your usual dev clone):

```bash
git clone https://github.com/marek-mikula/moveconcept.git   # once
cd moveconcept
git pull --ff-only origin master
```

**Generate OpenAPI JSON** (from MoveConcept root, with [Laravel Sail](https://laravel.com/docs/sail) and dependencies installed):

```bash
./vendor/bin/sail artisan app:generate-api-docs
```

The command scans `src/` with `zircote/swagger-php` and writes:

`storage/app/private/api-docs.json`

(Laravel `local` disk; see `MoveConcept\Core\Infrastructure\Console\Command\AppGenerateApiDocsCommand`.)

**Copy into McCheck** (adjust paths if your repos live elsewhere):

```bash
cp /path/to/moveconcept/storage/app/private/api-docs.json /path/to/McCheck/docs/api-docs.json
```

Then run McCheck **typecheck/tests** and a **staging smoke** if any paths or schemas changed. Update the **Document control** row in this file and the “last synced” wording in the purpose paragraph above.

**McCheck workspace mirror:** `SourceOfTruth_MoveConcept` is configured with `origin` = this URL; keep it on `master` (or document here if you track `staging`).

---

## V1-relevant surface (summary)

| Area | Route / notes |
|------|----------------|
| Activity detail | `GET /activities/{activity}` → `data.activity` as **`ActivityResource`** (includes `owner`, `registrationsCount`, `attendingGuestsCount`) |
| Registrations | `GET /activities/{activity}/registrations` — query: `page`, `perPage`, optional **`search`** — **owner-only** in production (confirmed 2026-04-16; non-owner **403**) |
| Email login | `POST /auth/login` — `LoginRequest`: `email`, `password`, `deviceName` |
| Google (social) | `POST /auth/login/social/{provider}` — `provider` enum **`google`**; body **`LoginViaSocialRequest`**: required **`accessToken`**, **`deviceName`**; same success shape as email login (`UserWithTokenResponse`) |
| Session | `DELETE /auth/logout`, `GET /auth/me` |
| My activities | `GET /users/me/activities` — optional `filter`: `draft` \| `upcoming` \| `ongoing`; pagination |
| List rows | **`MyActivityResource`** includes **`registrationsCount`** and **`attendingGuestsCount`** |

Implementers should read field-level detail in **`api-docs.json`** (`components.schemas`, `components.requestBodies`, `components.responses`).

**OpenAPI vs live routes:** Some exports list **“my activities”** under the path **`/auth/users/me/activities`**. The Laravel API serves the same feature at **`GET /users/me/activities`** relative to `servers[].url` (same as **`GET /api/users/me/activities`** absolute on staging/production). McCheck defaults and **`normalizeAuthPaths`** in `mobile/src/config/normalizeAuthPaths.ts` target the correct URL; fix MoveConcept OA attributes on the next backend regen if the JSON still shows the `/auth/users/…` path.

---

## Outside the OpenAPI file

- **Authorization:** **`GET …/registrations`** is **owner-only** in **production** (MoveConcept, confirmed 2026-04-16). Re-verify on **staging** after backend deploys if policies diverge (see [mcheck-design-vs-backend.md](./mcheck-design-vs-backend.md)).
- **Google mobile:** McCheck uses **`@react-native-google-signin/google-signin`** and **`POST …/login/social/google`** with body field **`accessToken`** (string from **`getTokens()`** — OAuth access token first, **id token** fallback). Align server verification with that; do not assume a separate `POST /auth/google` unless the server is changed and the spec updated.
- **User notifications (organizer join/cancel):** MoveConcept exposes **`GET /users/{user}/notifications`** (paginated), **`GET …/notifications/unread-count`**, **`POST …/notifications/mark-all-read`**, **`PATCH …/notifications/{notification}/mark-read`** (Sanctum). The web uses these for in-app alerts when someone registers or cancels on **your** activity. **These paths may not appear in every `api-docs.json` export** — confirm in staging or refresh the snapshot when McCheck implements an inbox. **Delivery channel today is `database` only** (not FCM/APNs); McCheck can still use the same API for **in-app** notifications, which is good preparation for **push** once the backend adds device tokens and a push channel. See [mcheck-implementation-plan.md](./mcheck-implementation-plan.md) (section *Organizer notifications — in-app first, push later*).

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
| 3.1 | 2026-04-16 | Note: mobile staging + TestFlight auth (email + Google) verified against live API |
| 3.2 | 2026-04-16 | **Recorded:** `GET …/registrations` is **owner-only** in production (403 for non-owner) |
| 3.3 | 2026-04-16 | **User notifications API:** index / unread / mark-read; OpenAPI may omit; `database` channel vs push; pointer to implementation plan |
| 3.4 | 2026-04-17 | **V1 iOS** sign-off called out; Android smoke pending Play |
| 3.5 | 2026-04-18 | Android: EAS preview APK / QR; native Google client; Expo Go caveat |
| 3.6 | 2026-04-19 | V1 iOS + Android physical staging verification called out in purpose |
| 3.7 | 2026-04-19 | Source repo URL, `git pull`, `sail artisan app:generate-api-docs`, copy path for `api-docs.json`; purpose notes snapshot may lag until refresh |
| 3.8 | 2026-04-19 | `api-docs.json` refreshed from supplied export; note OA `/auth/users/me/activities` vs live `/users/me/activities` |
