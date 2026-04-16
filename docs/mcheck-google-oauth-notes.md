# McCheck — Google sign-in (design notes)

**Operational setup (Android + EAS + Google Cloud):** see [mcheck-android-google-oauth-setup.md](./mcheck-android-google-oauth-setup.md).

McCheck must use the **same MoveConcept user** as the web app. The **MoveConcept contract** for exchanging a Google credential for a Sanctum-style token is documented in **`docs/api-docs.json`**: `POST /auth/login/social/google` with body **`accessToken`** + **`deviceName`** (`LoginViaSocialRequest`). Native Google sign-in in the app remains **to be wired** to that endpoint. This document captures product intent and client flow.

## Product goals

- One **Google identity** → one **`users` row** (same as web Google login).
- No separate “app-only” accounts.

## Typical native flow (high level)

1. User taps **Continue with Google** in the app.
2. App uses **Google Sign-In** (or `expo-auth-session` + Google OAuth) to obtain an **ID token** (or auth code, depending on strategy).
3. App **POST**s to **`/auth/login/social/google`** (under the configured API base) with the **`accessToken`** the backend expects (see OpenAPI — often the provider access token; confirm with backend if an ID token is also accepted).
4. Server **verifies** the token with Google, resolves/creates the user, returns the **same session/token** shape as email login (`Authorization: Bearer …`).
5. App stores the token (already handled via `AuthContext` + SecureStore) and loads profile via `EXPO_PUBLIC_AUTH_ME_PATH`.

## What is documented today

- **URL:** `POST /auth/login/social/{provider}` with `provider = google` (see [api-docs.json](./api-docs.json)).
- **Body:** `accessToken`, `deviceName`. **Response:** `UserWithTokenResponse` (same shape as email login).
- **Still confirm with backend:** error codes for invalid token, account linking, and whether the server expects Google’s **access** token vs **ID** token for verification.

## McCheck code touchpoints (when ready)

- `AuthContext.signInWithGoogle` — replace `throw new Error('Google login not wired…')` with the exchange + token storage path used for email login.
- Optional: `EXPO_PUBLIC_AUTH_GOOGLE_PATH` if the route is configurable.

## Document control

| Version | Date | Notes |
|---------|------|--------|
| 1.0 | 2026-04-09 | Initial design stub |
| 1.1 | 2026-04-16 | Point to OpenAPI social login; remove obsolete handoff appendix link |
