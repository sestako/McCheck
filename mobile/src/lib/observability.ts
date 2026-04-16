import * as Sentry from '@sentry/react-native';

import { SENTRY_DSN } from '../config/env';

let initAttempted = false;
let sentryReady = false;

/**
 * Crash reporting via Sentry. Runs when `EXPO_PUBLIC_SENTRY_DSN` is set.
 * Skips init in `__DEV__` to avoid noise during local `expo start`; use a **release** build (EAS / TestFlight) to verify events.
 */
export function initObservability(): void {
  if (!SENTRY_DSN || initAttempted) return;
  initAttempted = true;

  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.info(
      '[McCheck] Sentry: skipping init in __DEV__. Set EXPO_PUBLIC_SENTRY_DSN on EAS and ship a release build to capture crashes.'
    );
    return;
  }

  try {
    Sentry.init({
      dsn: SENTRY_DSN,
      tracesSampleRate: 0.15,
      enableAutoSessionTracking: true,
    });
    sentryReady = true;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[McCheck] Sentry init failed', e);
  }
}

export function isSentryReady(): boolean {
  return sentryReady;
}

/** Dev-only structured warning. */
export function logWarning(message: string, extra?: Record<string, unknown>): void {
  if (__DEV__) {
    console.warn(`[McCheck] ${message}`, extra ?? '');
  }
}

/**
 * Logs to console and sends to Sentry when init succeeded (release builds with DSN).
 */
export function reportError(message: string, error?: unknown, extra?: Record<string, unknown>): void {
  const err = error instanceof Error ? error : error != null ? new Error(String(error)) : undefined;
  // eslint-disable-next-line no-console
  console.error(`[McCheck] ${message}`, err ?? '', extra ?? '');

  if (!sentryReady) return;

  Sentry.withScope((scope) => {
    scope.setTag('mcheck', '1');
    scope.setExtra('message', message);
    if (extra && Object.keys(extra).length > 0) {
      scope.setExtras(extra);
    }
    Sentry.captureException(err ?? new Error(message));
  });
}
