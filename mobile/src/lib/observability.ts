import { SENTRY_DSN } from '../config/env';

/**
 * Crash / analytics hook. Add `@sentry/react-native` (or similar) and call `Sentry.init`
 * from `initObservability` when `EXPO_PUBLIC_SENTRY_DSN` is set.
 */
export function initObservability(): void {
  if (SENTRY_DSN && __DEV__) {
    console.info(
      '[McCheck] EXPO_PUBLIC_SENTRY_DSN is set — bundle Sentry (or another SDK) in initObservability to capture production crashes.'
    );
  }
}

/** Dev-only structured warning; no-op in production unless you forward to Sentry. */
export function logWarning(message: string, extra?: Record<string, unknown>): void {
  if (__DEV__) {
    console.warn(`[McCheck] ${message}`, extra ?? '');
  }
}
