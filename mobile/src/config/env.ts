/**
 * Expo exposes env vars prefixed with EXPO_PUBLIC_ at build time.
 * Copy mobile/.env.example to mobile/.env and adjust.
 */
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? 'https://staging.example.invalid';

/** Default `true` so the app runs on mocks until MoveConcept is wired; set `EXPO_PUBLIC_USE_MOCK_API=false` for real API. */
const mockRaw = process.env.EXPO_PUBLIC_USE_MOCK_API;
export const USE_MOCK_API = mockRaw !== 'false' && mockRaw !== '0';

/** Auth endpoint paths are overridable to match backend naming. */
export const AUTH_LOGIN_PATH = process.env.EXPO_PUBLIC_AUTH_LOGIN_PATH ?? '/api/login';
export const AUTH_ME_PATH = process.env.EXPO_PUBLIC_AUTH_ME_PATH ?? '/api/user';
export const AUTH_LOGOUT_PATH = process.env.EXPO_PUBLIC_AUTH_LOGOUT_PATH ?? '/api/logout';

/** Optional: when set, wire `@sentry/react-native` in `src/lib/observability.ts`. */
export const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN?.trim() ?? '';
