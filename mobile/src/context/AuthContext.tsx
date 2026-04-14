import * as SecureStore from 'expo-secure-store';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Platform } from 'react-native';
import { createActivitiesApi } from '../api/createActivitiesApi';
import { ApiError } from '../api/types';
import type { ActivitiesApi } from '../api/types';
import { extractAuthTokenFromBody, parseApiErrorBody } from '../lib/authToken';
import {
  API_BASE_URL,
  AUTH_LOGIN_PATH,
  AUTH_LOGOUT_PATH,
  AUTH_ME_PATH,
  USE_MOCK_API,
} from '../config/env';
import { getMockScenario } from '../config/mockScenario';

const TOKEN_KEY = 'mcheck_auth_token';
const USER_EMAIL_KEY = 'mcheck_user_email';

export type AuthUser = {
  email: string;
  displayName: string;
};

type AuthContextValue = {
  ready: boolean;
  token: string | null;
  user: AuthUser | null;
  activitiesApi: ActivitiesApi;
  signInWithEmail: (email: string, _password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [t, email] = await Promise.all([
          SecureStore.getItemAsync(TOKEN_KEY),
          SecureStore.getItemAsync(USER_EMAIL_KEY),
        ]);
        if (cancelled) return;
        setToken(t);
        if (email) setUser({ email, displayName: email.split('@')[0] ?? 'Organizer' });
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const getToken = useCallback(async () => token, [token]);

  const activitiesApi = useMemo(() => createActivitiesApi(getToken), [getToken]);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    if (USE_MOCK_API) {
      if (getMockScenario() === 'login_fail') {
        await new Promise<void>((r) => setTimeout(r, 800));
        throw new ApiError('Invalid credentials', 401);
      }
      const mockToken = 'mock-token';
      await SecureStore.setItemAsync(TOKEN_KEY, mockToken);
      await SecureStore.setItemAsync(USER_EMAIL_KEY, normalizedEmail);
      setToken(mockToken);
      setUser({
        email: normalizedEmail,
        displayName: normalizedEmail.split('@')[0] ?? 'Organizer',
      });
      return;
    }

    const res = await fetch(`${API_BASE_URL}${AUTH_LOGIN_PATH}`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: normalizedEmail,
        password,
        deviceName: `McCheck-${Platform.OS}-${String(Platform.Version)}`,
      }),
    });
    const body = await parseJson(res);
    if (!res.ok) {
      throw new ApiError(parseApiErrorBody(body, 'Sign in failed'), res.status);
    }

    const tokenFromLogin = extractAuthTokenFromBody(body);
    const meUser =
      tokenFromLogin != null
        ? await fetchMeWithToken(tokenFromLogin).catch(() => null)
        : await fetchMeWithToken(null).catch(() => null);
    const finalEmail = meUser?.email ?? normalizedEmail;
    const finalDisplay = meUser?.displayName ?? finalEmail.split('@')[0] ?? 'Organizer';
    const finalToken = tokenFromLogin ?? (await SecureStore.getItemAsync(TOKEN_KEY)) ?? '';
    if (!finalToken) {
      throw new Error('Login succeeded but no API token was returned.');
    }

    await SecureStore.setItemAsync(TOKEN_KEY, finalToken);
    await SecureStore.setItemAsync(USER_EMAIL_KEY, finalEmail);
    setToken(finalToken);
    setUser({ email: finalEmail, displayName: finalDisplay });
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (USE_MOCK_API) {
      const mockToken = 'mock-google-token';
      const email = 'organizer@example.com';
      await SecureStore.setItemAsync(TOKEN_KEY, mockToken);
      await SecureStore.setItemAsync(USER_EMAIL_KEY, email);
      setToken(mockToken);
      setUser({ email, displayName: 'Organizer' });
      return;
    }
    throw new Error('Google login not wired — implement OAuth exchange on MoveConcept.');
  }, []);

  const signOut = useCallback(async () => {
    if (!USE_MOCK_API && token) {
      try {
        await fetch(`${API_BASE_URL}${AUTH_LOGOUT_PATH}`, {
          method: 'DELETE',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
      } catch {
        // Always clear local state even if revoke fails.
      }
    }
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_EMAIL_KEY);
    setToken(null);
    setUser(null);
  }, [token]);

  const value = useMemo(
    () => ({
      ready,
      token,
      user,
      activitiesApi,
      signInWithEmail,
      signInWithGoogle,
      signOut,
    }),
    [
      ready,
      token,
      user,
      activitiesApi,
      signInWithEmail,
      signInWithGoogle,
      signOut,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

async function parseJson(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

async function fetchMeWithToken(token: string | null): Promise<AuthUser> {
  const headers: HeadersInit = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE_URL}${AUTH_ME_PATH}`, { headers });
  const body = await parseJson(res);
  if (!res.ok) {
    throw new ApiError(parseApiErrorBody(body, 'Failed to fetch profile'), res.status);
  }
  const user = extractUser(body);
  if (!user) throw new Error('Profile response is missing user payload.');
  return user;
}

function extractUser(body: unknown): AuthUser | null {
  const r = body as Record<string, unknown> | null;
  const data = (r?.data as Record<string, unknown> | undefined) ?? r;
  const u =
    (data?.user as Record<string, unknown> | undefined) ??
    (data?.me as Record<string, unknown> | undefined) ??
    data;
  const email =
    typeof u?.email === 'string'
      ? u.email.trim().toLowerCase()
      : typeof u?.mail === 'string'
        ? u.mail.trim().toLowerCase()
        : '';
  if (!email) return null;
  const displayName =
    (typeof u?.publicName === 'string' && u.publicName) ||
    (typeof u?.displayName === 'string' && u.displayName) ||
    (typeof u?.name === 'string' && u.name) ||
    email.split('@')[0] ||
    'Organizer';
  return { email, displayName };
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
