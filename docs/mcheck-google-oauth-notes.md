# McCheck — Google sign-in (design notes, pre-backend)

McCheck must use the **same MoveConcept user** as the web app. Native Google sign-in is **not wired** in the client until backend + product confirm the flow. This document captures a typical shape so implementation stays aligned.

## Product goals

- One **Google identity** → one **`users` row** (same as web Google login).
- No separate “app-only” accounts.

## Typical native flow (high level)

1. User taps **Continue with Google** in the app.
2. App uses **Google Sign-In** (or `expo-auth-session` + Google OAuth) to obtain an **ID token** (or auth code, depending on strategy).
3. App **POST**s that credential to a **MoveConcept endpoint** (to be defined), e.g. `/api/auth/google` or Sanctum-compatible route.
4. Server **verifies** the token with Google, resolves/creates the user, returns the **same session/token** shape as email login (`Authorization: Bearer …`).
5. App stores the token (already handled via `AuthContext` + SecureStore) and loads profile via `EXPO_PUBLIC_AUTH_ME_PATH`.

## What MoveConcept should document (blocking for mobile)

- Exact **URL**, **request body** (field names for ID token / code), **response** (token fields per [handoff Appendix A](./moveconcept-backend-handoff.md#appendix-a--mcheck-v1-json-shapes-no-live-endpoint-required)).
- Error cases: invalid token, email mismatch, account disabled.

## McCheck code touchpoints (when ready)

- `AuthContext.signInWithGoogle` — replace `throw new Error('Google login not wired…')` with the exchange + token storage path used for email login.
- Optional: `EXPO_PUBLIC_AUTH_GOOGLE_PATH` if the route is configurable.

## Document control

| Version | Date | Notes |
|---------|------|--------|
| 1.0 | 2026-04-09 | Initial design stub |
