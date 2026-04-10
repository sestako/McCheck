# McCheck — staging integration runbook

Use this when MoveConcept exposes **staging** and McCheck switches from mocks to the real API.

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
- [ ] [moveconcept-backend-handoff.md](./moveconcept-backend-handoff.md) items **1–3** deployed: mobile auth, owner activities list, owner-only attendees.

## One-time client setup (`mobile/`)

1. Copy `.env.example` → `.env.local` (or `.env`).
2. Set `EXPO_PUBLIC_API_BASE_URL` to staging (no trailing slash).
3. Set `EXPO_PUBLIC_USE_MOCK_API=false`.
4. If auth paths differ from defaults, set `EXPO_PUBLIC_AUTH_*` paths.
5. Restart Expo with cache clear: `npx expo start --clear`.

## Smoke test (~10 minutes)

1. **Login** (email) — success, token stored (Profile → Token in session = Yes).
2. **Active events** — list matches organizer-only, upcoming/ongoing filter reasonable.
3. **Event detail** — loads; 404 on invalid id shows user-facing message + Retry.
4. **Guest list** — pagination + search; non-owner token gets **403** on attendees (backend check).
5. **Profile** — shows live hint; **Sign out** clears session.

**Pass:** primary path works; no unexpected red screens. **Fail:** open ticket with HTTP status, response snippet (no secrets), and screen.

## When something breaks

1. Confirm **base URL** and **mock flag** in Profile.
2. Compare JSON to [Appendix A](./moveconcept-backend-handoff.md) in the handoff doc.
3. Re-run `npm test` and `npm run typecheck` in `mobile/`.

## Document control

| Version | Date | Notes |
|---------|------|--------|
| 1.0 | 2026-04-09 | Initial runbook |
