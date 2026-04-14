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

1. **Build** (store distribution, auto-increments iOS build number):

   ```bash
   cd mobile
   npx eas-cli@latest build --platform ios --profile production
   ```

2. **Submit** the finished build to App Store Connect / TestFlight (interactive — picks the app and credentials):

   ```bash
   npx eas-cli@latest submit --platform ios --profile production --id <EAS_BUILD_ID>
   ```

   Example: after a build completes, copy the build ID from the Expo dashboard URL (`.../builds/<id>`).

3. **Non-interactive / CI:** `eas.json` → `submit.production.ios.ascAppId` is set for this app. To change apps, update it (Apple ID is under App Store Connect → *App Information* → **Apple ID**). See [Configure EAS Submit](https://docs.expo.dev/submit/eas-json/).

4. **EAS environment variables:** the `preview` and `production` profiles in `eas.json` embed staging `EXPO_PUBLIC_*` values; you can override via the Expo dashboard **Environment variables** (account- or project-wide) if needed.

## Phase A (pre-backend)

See [../docs/mcheck-phase-a.md](../docs/mcheck-phase-a.md): default **mock API** for daily dev, manual QA script, and release hygiene notes.

## Configuration

- Copy `.env.example` to `.env` (or prefer `.env.local`) and set `EXPO_PUBLIC_API_BASE_URL` when using the real API.
- Set `EXPO_PUBLIC_USE_MOCK_API=false` to switch off mocks (requires working auth + `/api/auth/users/me/activities` + token login).
- If your backend auth routes differ, set:
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
