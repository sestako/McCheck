import type { AuthSessionResult } from 'expo-auth-session';

/**
 * MoveConcept `LoginViaSocialRequest` expects `accessToken` (often the Google OAuth access token;
 * some backends accept an ID token in the same field — server decides).
 */
export function extractGoogleCredentialForMoveConcept(result: AuthSessionResult): string | null {
  if (result.type !== 'success') return null;
  const auth = result.authentication;
  const fromAuth = auth?.accessToken ?? auth?.idToken;
  if (typeof fromAuth === 'string' && fromAuth.trim()) return fromAuth.trim();
  const at = result.params.access_token;
  if (typeof at === 'string' && at.trim()) return at.trim();
  const id = result.params.id_token;
  if (typeof id === 'string' && id.trim()) return id.trim();
  return null;
}
