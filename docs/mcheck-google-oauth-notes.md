# McCheck — Google sign-in

**Android + EAS + Google Cloud setup:** [mcheck-android-google-oauth-setup.md](./mcheck-android-google-oauth-setup.md).

McCheck uses the **same MoveConcept user** as the web app. The server contract is in **`docs/api-docs.json`**: `POST /auth/login/social/{provider}` with `provider = google`, body **`accessToken`** + **`deviceName`** (`LoginViaSocialRequest`), response same as email login (`UserWithTokenResponse`).

## Implementation (mobile)

- **`mobile/src/auth/GoogleSignInButton.tsx`** — `expo-auth-session` `Google.useAuthRequest`; waits for the hook **response** (after OAuth code exchange) before reading tokens, then calls `exchangeGoogleAccessToken`.
- **`mobile/src/context/AuthContext.tsx`** — `exchangeGoogleAccessToken` posts to `${API_BASE_URL}${AUTH_GOOGLE_SOCIAL_PATH}` (default `/api/auth/login/social/google`), stores Sanctum token, loads profile via `EXPO_PUBLIC_AUTH_ME_PATH`.
- **Env:** `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`, `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`, `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` (see `mobile/.env.example` and `mobile/eas.json` for TestFlight/EAS builds).
- **Expo Go / dev:** Web OAuth client needs redirect URI `https://auth.expo.io/@ondrejsestak/mccheck` (match `app.json` owner + slug if your Expo account differs).

## Product goals

- One **Google identity** → one **`users` row** (same as web Google login).
- No separate “app-only” accounts.

## Backend alignment

Confirm with MoveConcept whether `accessToken` must be Google’s **OAuth access token**, **ID token**, or either — the app prefers `authentication.accessToken` from the token response and falls back to `id_token` in params when needed.

## Document control

| Version | Date | Notes |
|---------|------|--------|
| 1.0 | 2026-04-09 | Initial design stub |
| 1.1 | 2026-04-16 | Point to OpenAPI social login; remove obsolete handoff appendix link |
| 1.2 | 2026-04-16 | Document implemented flow (`GoogleSignInButton`, `AuthContext`); TestFlight verified |
