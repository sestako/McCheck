# McCheck mobile (Expo)

React Native app for **organizers**: active events → detail → guest list. Uses **mock API by default** in local dev; **live** behavior matches `docs/api-docs.json` (see `docs/moveconcept-backend-handoff.md`).

## Current state (2026-04-18)

- **Phase A (active):** use **mock API** for daily dev — run the checklist in [../docs/mcheck-phase-a.md](../docs/mcheck-phase-a.md) (manual QA + optional `EXPO_PUBLIC_MOCK_SCENARIO`). Use `EXPO_PUBLIC_USE_MOCK_API=false` only when intentionally testing staging or shipping a build with staging env.
- V1 organizer flow is implemented and was exercised on **staging** + **TestFlight** (iOS) and **EAS Android** (preview APK / production AAB):
  - **Login:** email/password and **Google** (native `@react-native-google-signin/google-signin` → `POST /api/auth/login/social/google`). **Not available in Expo Go** — native modules require an **EAS build** or **`expo run:android` / `expo run:ios`**.
  - Active events, event detail, guest list (search, pagination, pull-to-refresh), profile + logout
- UI: Stitch-inspired polish (tokens, spacing, typography, copy).

## Run

```bash
cd mobile
npm install
npm start
```

Then press **`i`** (iOS simulator) or **`a`** (Android emulator). You can open the project in **Expo Go** from the dev-server QR for **quick JS-only checks** (e.g. mock login), but **Expo Go does not include McCheck’s native modules** (Google Sign-In, etc.) — use an **EAS `preview` / `development` / `production` binary** or **`npx expo run:android` / `npx expo run:ios`** for the full app.

If **`npx expo start`** asks to install a different major (e.g. `expo@55`), answer **no**: run **`npm install`** in `mobile` first, then **`npm start`** so the CLI matches **SDK 54** (`expo` in `package.json`). You can also use **`npx --no-install expo start`** after `npm install` to force the local CLI.

## Tests & typecheck

```bash
npm test
npm run typecheck
```

CI (GitHub Actions) runs both on changes under `mobile/` — see `../.github/workflows/mobile-ci.yml`.

## Install on a physical Android phone (QR, no Play Store)

McCheck is a **native** app. The QR shown by **`npx expo start`** opens **Expo Go**, which **cannot** run Google Sign-In and other native pieces.

1. From `mobile/`, run an **APK** profile (e.g. **`preview`** — see `eas.json`).
2. When the build finishes, open the **Expo dashboard** URL printed by the CLI (same as the build page).
3. On your phone, open that URL — the page shows a **QR code** that installs the **McCheck APK** (not Expo Go loading your project).

For USB sideload instead, see **Android USB install** below.

## EAS builds (optional)

From `mobile/`, with [Expo Application Services](https://docs.expo.dev/build/introduction/) configured:

```bash
npx eas-cli build --profile preview --platform ios
```

Profiles are defined in `eas.json` (`development`, `preview`, `production`). Link an EAS project once (no global install needed):

```bash
npx eas-cli@latest init
```

Or install the CLI globally: `npm install -g eas-cli`, then `eas init`.

### TestFlight (iOS production)

1. **Version:** Bump `expo.version` in `app.json` when you want a new **marketing version** shown in TestFlight (e.g. `1.0.1`). **`eas.json`** uses `appVersionSource: "remote"` and **`production.autoIncrement`**, so EAS still **auto-increments the iOS build number** on each production build.

2. **Build** (store distribution):

   ```bash
   cd mobile
   npx eas-cli@latest build --platform ios --profile production
   ```

3. **Submit** to App Store Connect / TestFlight:

   ```bash
   npx eas-cli@latest submit --platform ios --profile production --latest
   ```

   Or submit a specific build: `--id <EAS_BUILD_ID>` (from the Expo dashboard URL `.../builds/<id>`).

   **Shell tip:** If your prompt already ends with `mobile` (you are inside `mobile/`), **do not** run `cd mobile` again — it will error (`no such file or directory`). Run `npx eas-cli@latest submit …` only.

   **Submit failed after an earlier success?** `--latest` reuses the same finished build. **Apple usually accepts each binary only once.** Open the submission URL from the CLI output (Expo dashboard → that submission) for the exact Transporter / ASC error. To ship again, run a **new** `eas build` first, then `submit --latest` (or `--id` of the new build).

4. **Non-interactive / CI:** `eas.json` → `submit.production.ios.ascAppId` is set for this app. To change apps, update it (Apple ID is under App Store Connect → *App Information* → **Apple ID**). See [Configure EAS Submit](https://docs.expo.dev/submit/eas-json/).

5. **EAS environment variables:** the `preview` and `production` profiles in `eas.json` embed staging `EXPO_PUBLIC_*` values; you can override via the Expo dashboard **Environment variables** (account- or project-wide) if needed.

## Phase A (pre-backend)

See [../docs/mcheck-phase-a.md](../docs/mcheck-phase-a.md): default **mock API** for daily dev, manual QA script, and release hygiene notes.

## Configuration

- Copy `.env.example` to **`.env`** or **`.env.local`** (gitignored; good for machine-specific overrides) in `mobile/`, then set `EXPO_PUBLIC_*` as needed.
- **`EXPO_PUBLIC_*` is inlined when Metro bundles the app.** After changing env files, restart the dev server; if values look stuck, run `npx expo start --clear`.
- **Local env vs EAS builds:** Variables in `.env` / `.env.local` apply when you run **`expo start`** from this folder. **EAS cloud builds** do not read those files unless you explicitly load them in CI; they use **`eas.json`** `env` and any **Expo dashboard → Environment variables** for the profile. If TestFlight shows a different API URL or login path than your simulator, compare Profile in the app with your `eas.json` / dashboard values.
- For **staging / real MoveConcept**, set `EXPO_PUBLIC_USE_MOCK_API=false` and `EXPO_PUBLIC_API_BASE_URL` (no trailing slash). Auth defaults are **`/api/auth/login`**, **`/api/auth/me`**, **`/api/auth/logout`**. The **owner activities list** defaults to **`/api/users/me/activities`** — **`/api/auth/users/me/activities`** returns **404** on MoveConcept; do not use **`/api/login`** for email auth (404); `src/config/env.ts` normalizes legacy `/api/login` to `/api/auth/login`.
- **Google sign-in (live API):** set `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` plus **`EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`** and **`EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`**. Uses **`@react-native-google-signin/google-signin`** (not Expo Go — use an **EAS `preview` / `development` / `production` build**). **POST**s the token to **`/api/auth/login/social/google`** as `accessToken` (see OpenAPI `LoginViaSocialRequest`). **Setup:** [../docs/mcheck-android-google-oauth-setup.md](../docs/mcheck-android-google-oauth-setup.md) (Android SHA-1, iOS `iosUrlScheme` in `app.json`).
- If your backend auth routes genuinely differ, override:
  - `EXPO_PUBLIC_AUTH_LOGIN_PATH`
  - `EXPO_PUBLIC_AUTH_ME_PATH`
  - `EXPO_PUBLIC_AUTH_LOGOUT_PATH`
  - `EXPO_PUBLIC_MY_ACTIVITIES_LIST_PATH` (only if a non-default list URL is required)
- **Mock-only QA:** `EXPO_PUBLIC_MOCK_SCENARIO` (`login_fail`, `activities_fail`, `detail_404`, `guests_403`, `edge_layout`) — see [../docs/mcheck-phase-a.md](../docs/mcheck-phase-a.md).
- **Crash reporting:** `@sentry/react-native` is installed; `app.json` includes the Sentry config plugin. Set **`EXPO_PUBLIC_SENTRY_DSN`** (EAS env for release builds). `initObservability()` calls **`Sentry.init`** only outside **`__DEV__`**; the root component is **`Sentry.wrap(App)`** for React error reporting. **`reportError`** forwards to **`Sentry.captureException`** after init.
- **EAS builds:** `eas.json` sets **`SENTRY_DISABLE_AUTO_UPLOAD=true`** so cloud builds do not require `sentry-cli` org/auth (source map upload is off; runtime crash reporting via DSN still works). To enable upload later, remove that flag and add Sentry **org**, **project**, and **`SENTRY_AUTH_TOKEN`** as EAS secrets, or set **`SENTRY_ALLOW_FAILURE=true`** if uploads may fail without failing the build.
- **Android release builds:** `eas.json` production profile sets `android.buildType` to **`app-bundle`** for Play Console. Run `eas build --platform android --profile production` when ready (same env vars as iOS; see [../docs/mcheck-android-google-oauth-setup.md](../docs/mcheck-android-google-oauth-setup.md)).

### Android USB install (APK, no Play Store)

`production` Android builds are **`.aab`** (Play). To **`adb install`** over USB you need an **`.apk`** from **`preview`** or **`development`** (both set `android.buildType: "apk"` in `eas.json`).

1. On the phone: **Developer options** → **USB debugging** ON; connect USB; accept the RSA prompt; use a **data** cable.
2. On your Mac:

   ```bash
   cd mobile
   npx eas-cli@latest build --platform android --profile preview
   ```

3. When the build finishes, open the **Expo dashboard** link from the CLI. Either **scan the install QR** on that page on your phone, or **Download** the **`.apk`** (e.g. to `~/Downloads/`) and install with `adb` below.
4. If using `adb`, install with the **real** path to the downloaded file (not a placeholder):

   ```bash
   adb devices
   adb install -r "/Users/YOU/Downloads/whatever-the-file-is-called.apk"
   ```

   **Tip:** In Finder, select the `.apk` → **Option**-right-click → **Copy “… ” as Pathname**, then paste after `adb install -r `.

   If `adb` says **no devices**, fix USB/cable first. If **`failed to stat`**, you used a fake path or the file is not there — list APKs with:

   ```bash
   find "$HOME/Downloads" -maxdepth 1 -iname "*.apk" -print
   ```

   (Install [Google Platform Tools](https://developer.android.com/tools/releases/platform-tools) if `adb` is not found.)

   **EAS upload failed** with `git config core.ignorecase` or tarball errors? Run the same `eas build` command **on your Mac terminal** (outside restricted CI sandboxes); ensure the repo is a normal git checkout.

## Layout

| Path | Role |
|------|------|
| `src/api/` | Types, mock + real clients (`createActivitiesApi`), `real/mappers.ts` |
| `src/config/env.ts` | `EXPO_PUBLIC_*` flags |
| `src/context/AuthContext.tsx` | Token storage (SecureStore), email + Google exchange |
| `src/auth/GoogleSignInButton.tsx` | Native Google Sign-In + MoveConcept social login |
| `src/auth/nativeGoogleSignIn.ts` | `GoogleSignin.configure` / `signIn` / `getTokens` |
| `src/lib/isActiveEvent.ts` | Upcoming / ongoing filter |
| `src/navigation/` | Stack navigator |
| `src/screens/` | Login, Active events, Detail, Guest list, Profile |
| `src/theme/tokens.ts` | Forest Minimalist colors (Stitch) |
| `src/lib/observability.ts` | Sentry placeholder / `initObservability` |

See `../docs/mcheck-implementation-plan.md` for phases and integration checklist.

**Pre-staging docs:** [staging-runbook.md](../docs/staging-runbook.md), [mcheck-google-oauth-notes.md](../docs/mcheck-google-oauth-notes.md), [mcheck-store-release-checklist.md](../docs/mcheck-store-release-checklist.md).
