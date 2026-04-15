# McCheck mobile (Expo)

React Native app for **organizers**: active events → detail → guest list. Uses **mock API by default** until MoveConcept endpoints from `docs/moveconcept-backend-handoff.md` are ready.

## Current state (2026-04-09)

- V1 organizer flow is implemented and QA-validated:
  - Login
  - Active events
  - Event detail
  - Guest list (search, pagination, pull-to-refresh)
  - Profile + logout
- UI has a Stitch-inspired polish pass (tokens + spacing + typography + copy consistency).

## Run

```bash
cd mobile
npm install
npm start
```

Then press `i` (iOS simulator), `a` (Android), or scan the QR code with Expo Go.

If **`npx expo start`** asks to install a different major (e.g. `expo@55`), answer **no**: run **`npm install`** in `mobile` first, then **`npm start`** so the CLI matches **SDK 54** (`expo` in `package.json`). You can also use **`npx --no-install expo start`** after `npm install` to force the local CLI.

## Tests & typecheck

```bash
npm test
npm run typecheck
```

CI (GitHub Actions) runs both on changes under `mobile/` — see `../.github/workflows/mobile-ci.yml`.

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

4. **Non-interactive / CI:** `eas.json` → `submit.production.ios.ascAppId` is set for this app. To change apps, update it (Apple ID is under App Store Connect → *App Information* → **Apple ID**). See [Configure EAS Submit](https://docs.expo.dev/submit/eas-json/).

5. **EAS environment variables:** the `preview` and `production` profiles in `eas.json` embed staging `EXPO_PUBLIC_*` values; you can override via the Expo dashboard **Environment variables** (account- or project-wide) if needed.

## Phase A (pre-backend)

See [../docs/mcheck-phase-a.md](../docs/mcheck-phase-a.md): default **mock API** for daily dev, manual QA script, and release hygiene notes.

## Configuration

- Copy `.env.example` to **`.env`** or **`.env.local`** (gitignored; good for machine-specific overrides) in `mobile/`, then set `EXPO_PUBLIC_*` as needed.
- **`EXPO_PUBLIC_*` is inlined when Metro bundles the app.** After changing env files, restart the dev server; if values look stuck, run `npx expo start --clear`.
- **Local env vs EAS builds:** Variables in `.env` / `.env.local` apply when you run **`expo start`** from this folder. **EAS cloud builds** do not read those files unless you explicitly load them in CI; they use **`eas.json`** `env` and any **Expo dashboard → Environment variables** for the profile. If TestFlight shows a different API URL or login path than your simulator, compare Profile in the app with your `eas.json` / dashboard values.
- For **staging / real MoveConcept**, set `EXPO_PUBLIC_USE_MOCK_API=false` and `EXPO_PUBLIC_API_BASE_URL` (no trailing slash). Auth defaults are **`/api/auth/login`**, **`/api/auth/me`**, **`/api/auth/logout`**. Do not use **`/api/login`** — that path returns **404** on MoveConcept. (`src/config/env.ts` maps the legacy `/api/login` value to `/api/auth/login` if it slips in from an old env.)
- If your backend auth routes genuinely differ, override:
  - `EXPO_PUBLIC_AUTH_LOGIN_PATH`
  - `EXPO_PUBLIC_AUTH_ME_PATH`
  - `EXPO_PUBLIC_AUTH_LOGOUT_PATH`
- **Mock-only QA:** `EXPO_PUBLIC_MOCK_SCENARIO` (`login_fail`, `activities_fail`, `detail_404`, `guests_403`, `edge_layout`) — see [../docs/mcheck-phase-a.md](../docs/mcheck-phase-a.md).

## Layout

| Path | Role |
|------|------|
| `src/api/` | Types, mock + real clients (`createActivitiesApi`), `real/mappers.ts` |
| `src/config/env.ts` | `EXPO_PUBLIC_*` flags |
| `src/context/AuthContext.tsx` | Token storage (SecureStore), mock sign-in |
| `src/lib/isActiveEvent.ts` | Upcoming / ongoing filter |
| `src/navigation/` | Stack navigator |
| `src/screens/` | Login, Active events, Detail, Guest list, Profile |
| `src/theme/tokens.ts` | Forest Minimalist colors (Stitch) |
| `src/lib/observability.ts` | Sentry placeholder / `initObservability` |

See `../docs/mcheck-implementation-plan.md` for phases and integration checklist.

**Pre-staging docs:** [staging-runbook.md](../docs/staging-runbook.md), [mcheck-google-oauth-notes.md](../docs/mcheck-google-oauth-notes.md), [mcheck-store-release-checklist.md](../docs/mcheck-store-release-checklist.md).
