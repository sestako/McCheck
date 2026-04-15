import { ApiError } from '../api/types';

/** Shown in Profile (live mode) and docs — single place for connection hints. */
export function liveApiTroubleshootingHint(): string {
  return 'Check EXPO_PUBLIC_API_BASE_URL, VPN or firewall, and that this device can reach the API host.';
}

/**
 * User-facing copy for API and network failures (avoid raw dev messages in banners).
 */
export function userFriendlyApiMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const m = error.message.trim();
    if (error.status === 401) {
      // Login failure is 401 too — prefer server-parsed message (e.g. invalid credentials).
      if (m) return m;
      return 'Session expired. Please sign in again.';
    }
    if (error.status === 403) return "You don't have permission to view this.";
    if (error.status === 404) return 'Not found.';
    if (m) return m;
    return 'Something went wrong. Please try again.';
  }
  if (error instanceof Error) {
    const m = error.message;
    if (/network request failed/i.test(m)) {
      return "Can't reach the server. Check your connection and API address.";
    }
    if (/aborted|timeout/i.test(m)) {
      return 'Request timed out. Try again.';
    }
    return m;
  }
  return 'Something went wrong. Please try again.';
}
