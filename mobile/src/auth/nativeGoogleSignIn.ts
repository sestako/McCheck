import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';
import { GOOGLE_IOS_CLIENT_ID, GOOGLE_WEB_CLIENT_ID } from '../config/env';

/** Thrown when the user dismisses the Google sign-in UI (no `Alert`). */
export class GoogleSignInCancelled extends Error {
  constructor() {
    super('Sign in cancelled');
    this.name = 'GoogleSignInCancelled';
  }
}

let configured = false;

function ensureGoogleConfigured(): void {
  if (configured) return;
  if (!GOOGLE_WEB_CLIENT_ID) {
    throw new Error('Missing EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID.');
  }
  GoogleSignin.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    ...(GOOGLE_IOS_CLIENT_ID ? { iosClientId: GOOGLE_IOS_CLIENT_ID } : {}),
    scopes: [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ],
  });
  configured = true;
}

function isUserCancelled(e: unknown): boolean {
  if (e instanceof GoogleSignInCancelled) return true;
  if (e && typeof e === 'object' && 'code' in e) {
    return (e as { code: string }).code === statusCodes.SIGN_IN_CANCELLED;
  }
  return false;
}

/**
 * Clears the SDK’s cached Google account for this app so the next `signIn()` shows
 * the account picker (Android otherwise often reuses the last account silently).
 */
export async function signOutGoogleSession(): Promise<void> {
  if (!GOOGLE_WEB_CLIENT_ID) return;
  try {
    ensureGoogleConfigured();
    await GoogleSignin.signOut();
  } catch {
    // No prior Google session, Play Services edge cases, etc.
  }
}

/**
 * Native Google Sign-In (iOS + Android). Returns a token string for MoveConcept
 * `POST .../login/social/google` body field `accessToken` (OAuth access token, or id token if access is empty).
 */
export async function getGoogleCredentialForMoveConcept(): Promise<string> {
  ensureGoogleConfigured();

  if (Platform.OS === 'android') {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  }

  await signOutGoogleSession();

  try {
    const result = await GoogleSignin.signIn();
    if (result.type === 'cancelled') {
      throw new GoogleSignInCancelled();
    }
  } catch (e: unknown) {
    if (isUserCancelled(e)) {
      throw new GoogleSignInCancelled();
    }
    throw e;
  }

  let tokens: { accessToken: string; idToken: string };
  try {
    tokens = await GoogleSignin.getTokens();
  } catch (e: unknown) {
    if (isUserCancelled(e)) {
      throw new GoogleSignInCancelled();
    }
    throw e;
  }

  const credential = tokens.accessToken?.trim() || tokens.idToken?.trim();
  if (!credential) {
    throw new Error('No Google token returned from getTokens().');
  }
  return credential;
}
