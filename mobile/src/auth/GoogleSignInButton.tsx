import * as Google from 'expo-auth-session/providers/google';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import {
  GOOGLE_ANDROID_CLIENT_ID,
  GOOGLE_IOS_CLIENT_ID,
  GOOGLE_WEB_CLIENT_ID,
} from '../config/env';
import { extractGoogleCredentialForMoveConcept } from '../lib/extractGoogleOAuthCredential';
import { colors, radius, space, type } from '../theme/tokens';

type Props = {
  disabled: boolean;
  exchangeGoogleAccessToken: (credential: string) => Promise<void>;
  onError: (message: string) => void;
};

export function GoogleSignInButton({ disabled, exchangeGoogleAccessToken, onError }: Props) {
  const [, response, promptAsync] = Google.useAuthRequest({
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    webClientId: GOOGLE_WEB_CLIENT_ID,
  });

  const [busy, setBusy] = useState(false);
  const [oauthStarted, setOauthStarted] = useState(false);

  useEffect(() => {
    if (!oauthStarted || !response) return;

    const handle = async () => {
      if (response.type === 'cancel' || response.type === 'dismiss') {
        setBusy(false);
        setOauthStarted(false);
        return;
      }
      if (response.type === 'error') {
        const msg =
          typeof response.error === 'object' && response.error && 'message' in response.error
            ? String((response.error as { message?: string }).message)
            : 'Google authorization failed';
        onError(msg || 'Google authorization failed');
        setBusy(false);
        setOauthStarted(false);
        return;
      }

      const credential = extractGoogleCredentialForMoveConcept(response);
      if (!credential) {
        onError('No Google token returned. Check OAuth client IDs and redirect URIs in Google Cloud.');
        setBusy(false);
        setOauthStarted(false);
        return;
      }

      try {
        await exchangeGoogleAccessToken(credential);
      } catch (e) {
        onError(e instanceof Error ? e.message : String(e));
      } finally {
        setBusy(false);
        setOauthStarted(false);
      }
    };

    void handle();
  }, [oauthStarted, response, exchangeGoogleAccessToken, onError]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Continue with Google"
      style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
      disabled={disabled || busy}
      onPress={async () => {
        setBusy(true);
        setOauthStarted(true);
        try {
          const result = await promptAsync();
          if (result.type === 'cancel' || result.type === 'dismiss') {
            setBusy(false);
            setOauthStarted(false);
          }
          if (result.type === 'error') {
            const msg =
              typeof result.error === 'object' && result.error && 'message' in result.error
                ? String((result.error as { message?: string }).message)
                : 'Google authorization failed';
            onError(msg || 'Google authorization failed');
            setBusy(false);
            setOauthStarted(false);
          }
        } catch (e) {
          onError(e instanceof Error ? e.message : String(e));
          setBusy(false);
          setOauthStarted(false);
        }
      }}
    >
      <Text style={styles.secondaryBtnText}>{busy ? 'Signing in…' : 'Continue with Google'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  secondaryBtn: {
    paddingVertical: space.md,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: colors.primaryContainer,
    fontSize: type.bodyLg,
    fontWeight: '600',
  },
  pressed: { opacity: 0.85 },
});
