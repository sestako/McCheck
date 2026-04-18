# MoveConcept API — McCheck coordination (OpenAPI snapshot)

**Audience:** McCheck mobile and anyone integrating with the MoveConcept REST API.

**Purpose:** `docs/api-docs.json` is a **checked-in OpenAPI 3.0 snapshot** of the MoveConcept public API (exported from **staging**, synced 2026-04-16). It is the canonical contract for the routes McCheck V1 targets. **McCheck iOS** exercises this contract on staging and TestFlight; **V1 iOS organizer path signed off 2026-04-17**. **Android:** use **EAS `preview` APK** (QR on the Expo build page) or Play **Internal testing** for the same smoke; **Expo Go** does not run native Google Sign-In.

**Bases:** See `servers` in the JSON — production `https://moveconcept.cz/api` and staging `https://staging.moveconcept.cz/api`.

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
