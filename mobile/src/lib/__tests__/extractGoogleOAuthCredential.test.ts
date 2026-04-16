import type { AuthSessionResult } from 'expo-auth-session';
import { extractGoogleCredentialForMoveConcept } from '../extractGoogleOAuthCredential';

describe('extractGoogleCredentialForMoveConcept', () => {
  it('returns null for cancel', () => {
    const r: AuthSessionResult = { type: 'cancel' };
    expect(extractGoogleCredentialForMoveConcept(r)).toBeNull();
  });

  it('prefers authentication accessToken', () => {
    const r = {
      type: 'success' as const,
      errorCode: null,
      params: {},
      authentication: { accessToken: 'at-1', tokenType: 'Bearer' },
      url: 'https://example.com',
    };
    expect(extractGoogleCredentialForMoveConcept(r as AuthSessionResult)).toBe('at-1');
  });

  it('falls back to id_token in params', () => {
    const r = {
      type: 'success' as const,
      errorCode: null,
      params: { id_token: 'id-99' },
      authentication: null,
      url: 'https://example.com',
    };
    expect(extractGoogleCredentialForMoveConcept(r as AuthSessionResult)).toBe('id-99');
  });
});
