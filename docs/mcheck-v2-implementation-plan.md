# McCheck — V2 implementation plan (check-in core)

**Audience:** McCheck mobile + MoveConcept backend coordination.  
**Depends on:** V1 complete ([mcheck-implementation-plan.md](./mcheck-implementation-plan.md)).  
**MoveConcept repo:** Read-only source of truth for behavior — [github.com/marek-mikula/moveconcept](https://github.com/marek-mikula/moveconcept); McCheck tracks contract in **`docs/api-docs.json`** and this document.

---

## 1. V2 scope (what ships)

**Goal:** The **authenticated organizer** (same as V1 — owner of the activity) can scan an **opaque server-issued ticket id** from a QR/barcode, **resolve** it to a registration for **that** activity, and **check in** once. Clear **success** vs **failure** UX; **no undo** in V2.

**In scope**

- Data: persisted **checked-in** state (e.g. `checked_in_at` on `activity_registrations` and/or **`check_ins`** table for idempotency and future history — pick one strategy in backend design).
- **Resolve** (read): payload → registration preview or structured error.
- **Check-in** (write): **idempotent** `POST`; **owner-only** policy (same trust line as `GET …/registrations`).
- **Mobile:** Scanner (camera, torch where supported), result screens, entry from event context; **online-only** (no offline queue).
- **Guest registrations** (non-user rows): **same** as user registrations for list + scan + check-in.

**Explicitly out of V2**

- **Undo** / reversal of check-in.
- **Co-worker** invites, scoped scanner tokens, second entry path → **V3** ([mcheck-implementation-plan.md](./mcheck-implementation-plan.md), [mcheck-design-vs-backend.md](./mcheck-design-vs-backend.md)).
- **Check-in history UI** / audit browsing → **V4** (audit data may still be written in V2 if the schema is `check_ins`).
- **Offline queue** → deferred (see §2.5).
- **Push / notification inbox** — not required for V2.

---

## 2. Locked product decisions (answered)

These are **binding** for API and mobile design.

| # | Topic | Decision | Engineering consequences |
|---|--------|----------|---------------------------|
| **2.1** | **Undo check-in** | **No undo in V2** — check-in is **final**. | No `DELETE`/`PATCH` undo route in V2. Prefer **append-only** `check_ins` + denormalized `checked_in_at`, or non-nullable `checked_in_at` once set; no “clear” path. |
| **2.2** | **QR / barcode payload** | **Opaque server-issued ticket id** — **lookup only** on resolve/check-in. | Server **mints** ids; QR encodes id string (or URL containing id). Resolver validates **activity ownership**, ticket exists, not cancelled. Forgery resistance = **id secrecy + HTTPS + rate limits**, not client-side signing. |
| **2.3** | **Guest rows (no MC user account)** | **Same as users:** on **guest list**, **scannable**, **same check-in rules**. | Registration list + resolve + check-in payloads must treat **guest** and **user** registrations uniformly where policy allows. |
| **2.4** | **Multiple phones at the door** | **Supported:** many devices may scan **different** tickets concurrently. **Same ticket:** **at most one** successful check-in globally; after success on **phone A**, **phone B** scanning the same ticket must **not** get a second success — response is **already checked in** (or equivalent stable code). | DB **unique** constraint (one check-in per registration/ticket) + transaction; duplicate `POST` returns **idempotent** “already in” outcome, **no** duplicate rows / clocks. |
| **2.5** | **Offline** | **Online-only:** if the network is unavailable, **block** check-in with a clear message; **no** local queue in V2. | No sync engine; optional “retry” is just user taps again when online. |
| **2.6** | **Who sees full guest list (names + search)** | **Same as V1:** **organizer-only** (`GET …/registrations` owner policy unchanged). Scanner is an **extra action** for the same role, not a new audience. **Wix-style staff + reduced list** → **V3** with scoped tokens. | No policy broadening on registrations for V2; co-worker flows wait for invite model. |

**Spec sentence (multi-device + single success)**

> Multiple organizer devices may operate concurrently; each **opaque ticket id** may produce **at most one** successful check-in; any subsequent scan from **any** device returns **already checked in** without mutating check-in state.

---

## 3. MoveConcept (backend) delivery

Coordinate via tickets and refreshed **`docs/api-docs.json`**; do not treat the upstream git repo as McCheck’s write surface.

| Track | Tasks | Done when |
|-------|--------|------------|
| **3.1 Ticket minting** | Issue opaque ticket id per scannable registration (user + guest); store mapping `ticket_id → activity_registration_id` (names illustrative); document length/charset for QR. | Staging creates tickets for test registrations; ids are unpredictable. |
| **3.2 Schema** | Add `checked_in_at` and/or `check_ins` with unique guard on registration/ticket; **no** undo API in V2. | Migrations applied on staging; constraint prevents double check-in. |
| **3.3 Resolve API** | Authenticated **owner** only: input raw scanned string → `{ ok: preview }` or error codes: unknown ticket, wrong activity, cancelled, already checked in (if resolve echoes state — product choice: resolve may return “already in” without writing). | OpenAPI + staging; McCheck can show confirm UI before POST if desired. |
| **3.4 Check-in API** | `POST` idempotent check-in by ticket id or registration id (agree one primary key); race-safe; second caller gets **already checked in**, HTTP shape stable. | Manual two-phone race on staging. |
| **3.5 List payloads** | `GET …/registrations` (and detail if needed) exposes **ticket id** (or flag “has ticket”) + **`checked_in_at`** for guest list UI. | McCheck list can show checked-in badge without extra round-trips. |
| **3.6 Security** | Rate-limit resolve + check-in; avoid logging raw attendee PII in debug; align with [mcheck-implementation-plan.md](./mcheck-implementation-plan.md) cross-cutting notes. | Staging headers / logs reviewed. |
| **3.7 Docs** | Export OpenAPI → copy to McCheck `docs/api-docs.json`; extend [staging-runbook.md](./staging-runbook.md) with check-in smoke; update [moveconcept-backend-handoff.md](./moveconcept-backend-handoff.md) if policy notes change. | CI + manual smoke pass documented. |

---

## 4. McCheck (mobile) delivery

| Track | Tasks | Done when |
|-------|--------|------------|
| **4.1 Native scanner** | Choose stack (e.g. `expo-camera` + barcode lib or `react-native-vision-camera` + code scanner); **EAS** builds only (same as Google Sign-In — not Expo Go). | iOS + Android physical device scan on staging. |
| **4.2 Permissions** | Camera (and torch); `Info.plist` / Android manifest strings; graceful denial UX. | Store / internal build checklist updated if needed. |
| **4.3 API module** | `resolveTicket(activityId, payload)`, `checkInTicket(...)` (names illustrative); types + `userFriendlyApiMessage` mapping for all V2 error codes. | Unit tests for mappers + error handling. |
| **4.4 Mocks** | Extend mock API + `EXPO_PUBLIC_MOCK_SCENARIO` rows: resolve OK, unknown ticket, wrong activity, already checked in, check-in duplicate, network failure. | Phase A–style regression without staging. |
| **4.5 Navigation** | Entry: **Event detail** and/or **Guest list** → Scanner → Result (success / failure / already in). Optional manual code entry for QA / broken camera. | Matches Stitch “Scanner Engine” intent ([mcheck-design-vs-backend.md](./mcheck-design-vs-backend.md)). |
| **4.6 Guest list** | Show **checked-in** state on row when API provides `checked_in_at` (or boolean). | Organizer sees door truth at a glance. |
| **4.7 Offline** | Detect no connectivity before POST; show **online-only** copy; no silent queue. | Matches §2.5. |

---

## 5. Vertical slices (suggested order)

| Slice | Content | Exit criteria |
|-------|---------|----------------|
| **V2-A** | Backend: ticket ids + list exposes `checked_in_at` (read-only, always null until V2-B). Mobile: guest list badge column (empty). | Contract visible on staging. |
| **V2-B** | Backend: check-in `POST` only (idempotent). Mobile: dev-only or integration path OR minimal “confirm check-in” without camera. | Two concurrent POSTs → one winner, one **already checked in**. |
| **V2-C** | Backend: resolve endpoint. Mobile: wire scanner → resolve → confirm → POST → success / errors. | End-to-end scan on **physical** devices. |
| **V2-D** | Polish: copy, haptics, torch, analytics/Sentry breadcrumbs; staging runbook check-in section. | Release candidate for “V2 check-in” internal tag. |

---

## 6. Testing checklist

- Organizer: **valid** ticket → first **success**; guest list shows checked-in after refresh.  
- **Same ticket, second phone** (or same phone): **already checked in**, **no** duplicate server state.  
- **Race:** two `POST`s milliseconds apart → still **one** check-in.  
- Invalid / unknown opaque id → error.  
- Ticket for **another** activity → wrong activity error.  
- **Cancelled** (or invalid state) registration → error.  
- **Non-owner** token → **403** on resolve and check-in.  
- **Offline** → blocked with explicit message.  
- **Camera denied** → clear UX; optional manual id entry for QA only.

---

## 7. Related documents

- [mcheck-implementation-plan.md](./mcheck-implementation-plan.md) — V1 status; V2 one-liner in “Below the line”.  
- [mcheck-design-vs-backend.md](./mcheck-design-vs-backend.md) — Stitch mapping, Phase B/C, open questions for later phases.  
- [moveconcept-backend-handoff.md](./moveconcept-backend-handoff.md) — OpenAPI snapshot + coordination.  
- [staging-runbook.md](./staging-runbook.md) — extend with check-in smoke when APIs exist.  
- [mcheck-phase-a.md](./mcheck-phase-a.md) — mock scenarios and CI for ongoing regression.

---

## Document control

| Version | Date | Notes |
|---------|------|--------|
| 1.0 | 2026-04-19 | Initial V2 plan: locked PM answers (undo, opaque ticket id, guests, multi-device idempotency, online-only, organizer-only list); backend + mobile tracks; slices + tests |
| 1.1 | 2026-04-19 | **McCheck mobile (partial V2-A/C):** mock opaque ticket ids on guest rows, `resolveTicket` / `checkInTicket` in mock + 501 stubs on real API, **Scan tickets** screen (`expo-camera` QR + manual entry), guest list badges + nav; see [mcheck-phase-a.md](./mcheck-phase-a.md) `checkin_unknown` |
