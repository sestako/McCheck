/**
 * Expo exposes env vars prefixed with EXPO_PUBLIC_ at build time.
 * Copy mobile/.env.example to mobile/.env and adjust.
 */
import { Platform } from 'react-native';
import { normalizeAuthPath } from './normalizeAuthPaths';

/** No trailing slash. Default matches MoveConcept staging when unset (e.g. local dev without .env). */
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? 'https://staging.moveconcept.cz';

/**
 * Parse mock mode explicitly:
 * - true/1 => always use mocks
 * - false/0 => always use real API
 * - unset/invalid => use mocks only in dev, real API in production builds
 */
const mockRaw = process.env.EXPO_PUBLIC_USE_MOCK_API?.trim().toLowerCase();
if (mockRaw && mockRaw !== 'true' && mockRaw !== '1' && mockRaw !== 'false' && mockRaw !== '0') {
  // eslint-disable-next-line no-console
  console.warn(
    `Invalid EXPO_PUBLIC_USE_MOCK_API="${process.env.EXPO_PUBLIC_USE_MOCK_API}". Falling back to ${
      __DEV__ ? 'mock' : 'real'
    } API mode.`
  );
}
export const USE_MOCK_API =
  mockRaw === 'true' || mockRaw === '1' ? true : mockRaw === 'false' || mockRaw === '0' ? false : __DEV__;

/** Auth endpoint paths are overridable to match backend naming. */
export const AUTH_LOGIN_PATH = normalizeAuthPath(
  process.env.EXPO_PUBLIC_AUTH_LOGIN_PATH,
  '/api/auth/login',
  ['/api/login']
);
export const AUTH_ME_PATH = normalizeAuthPath(process.env.EXPO_PUBLIC_AUTH_ME_PATH, '/api/auth/me', ['/api/me']);
export const AUTH_LOGOUT_PATH = normalizeAuthPath(
  process.env.EXPO_PUBLIC_AUTH_LOGOUT_PATH,
  '/api/auth/logout',
  ['/api/logout']
);

/** `POST` body uses `accessToken` + `deviceName` per OpenAPI `LoginViaSocialRequest`. */
export const AUTH_GOOGLE_SOCIAL_PATH = normalizeAuthPath(
  process.env.EXPO_PUBLIC_AUTH_GOOGLE_SOCIAL_PATH,
  '/api/auth/login/social/google',
  []
);

/**
 * Owner-scoped activities list. MoveConcept serves this under `/api/users/...`, not `/api/auth/users/...`
 * (the latter 404s on staging and production).
 */
export const MY_ACTIVITIES_LIST_PATH = normalizeAuthPath(
  process.env.EXPO_PUBLIC_MY_ACTIVITIES_LIST_PATH,
  '/api/users/me/activities',
  ['/api/auth/users/me/activities']
);

const googleWeb = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() ?? '';
const googleIos = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim() ?? '';
const googleAndroid = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?.trim() ?? '';

export const GOOGLE_WEB_CLIENT_ID = googleWeb;
export const GOOGLE_IOS_CLIENT_ID = googleIos;
export const GOOGLE_ANDROID_CLIENT_ID = googleAndroid;

/** Native Google Sign-In needs Web + iOS/Android OAuth client IDs in Google Cloud (see docs). */
export function isGoogleLoginConfigured(): boolean {
  if (!googleWeb) return false;
  if (Platform.OS === 'ios') return Boolean(googleIos);
  if (Platform.OS === 'android') return Boolean(googleAndroid);
  return Boolean(googleWeb);
}

/** Optional: when set, wire `@sentry/react-native` in `src/lib/observability.ts`. */
export const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN?.trim() ?? '';
