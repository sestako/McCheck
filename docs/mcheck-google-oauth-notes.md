# McCheck — Google sign-in

**Google Cloud + EAS (Android SHA-1, iOS scheme):** [mcheck-android-google-oauth-setup.md](./mcheck-android-google-oauth-setup.md).

McCheck uses the **same MoveConcept user** as the web app. The server contract is in **`docs/api-docs.json`**: `POST /auth/login/social/{provider}` with `provider = google`, body **`accessToken`** + **`deviceName`** (`LoginViaSocialRequest`), response same as email login (`UserWithTokenResponse`).

## Implementation (mobile)

- **`@react-native-google-signin/google-signin`** — native sign-in on **iOS and Android** (requires EAS/dev build, not Expo Go).
- **`mobile/src/auth/nativeGoogleSignIn.ts`** — `GoogleSignin.configure`; **`signOut()`** before **`signIn()`** so Android shows the **account picker** (otherwise the last account is often reused silently); **`getTokens()`**; returns OAuth **access token** when present, else **id token**, for the `accessToken` JSON field. **`signOutGoogleSession()`** is also invoked from **`AuthContext.signOut`** so logging out of McCheck clears the Google session for the next login.
- **`mobile/src/auth/GoogleSignInButton.tsx`** — calls `getGoogleCredentialForMoveConcept()` then `exchangeGoogleAccessToken`.
- **`mobile/src/context/AuthContext.tsx`** — `exchangeGoogleAccessToken` posts to `${API_BASE_URL}${AUTH_GOOGLE_SOCIAL_PATH}` (default `/api/auth/login/social/google`), stores Sanctum token, loads profile via `EXPO_PUBLIC_AUTH_ME_PATH`.
- **Env:** `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`, `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`, `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` (see `mobile/.env.example` and `mobile/eas.json`).

## Product goals

- One **Google identity** → one **`users` row** (same as web Google login).
- No separate “app-only” accounts.

## Backend alignment

Confirm with MoveConcept whether the `accessToken` field must be Google’s **OAuth access token**, **ID token**, or either — the app sends **`getTokens().accessToken`** first, then **`idToken`**, as the string in `accessToken`.

## Document control

| Version | Date | Notes |
|---------|------|--------|
| 1.0 | 2026-04-09 | Initial design stub |
| 1.1 | 2026-04-16 | Point to OpenAPI social login; remove obsolete handoff appendix link |
| 1.2 | 2026-04-16 | Document implemented flow (`GoogleSignInButton`, `AuthContext`); TestFlight verified |
| 1.3 | 2026-04-18 | **Native Google Sign-In**; remove `expo-auth-session` / `auth.expo.io` |
| 1.4 | 2026-04-18 | Document `signOut` before `signIn` + logout clearing Google session |
