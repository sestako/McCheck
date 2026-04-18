import React, { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { statusCodes } from '@react-native-google-signin/google-signin';
import { GoogleSignInCancelled, getGoogleCredentialForMoveConcept } from './nativeGoogleSignIn';
import { colors, space, type } from '../theme/tokens';

type Props = {
  disabled: boolean;
  exchangeGoogleAccessToken: (credential: string) => Promise<void>;
  onError: (message: string) => void;
};

export function GoogleSignInButton({ disabled, exchangeGoogleAccessToken, onError }: Props) {
  const [busy, setBusy] = useState(false);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Continue with Google"
      style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
      disabled={disabled || busy}
      onPress={async () => {
        setBusy(true);
        try {
          const credential = await getGoogleCredentialForMoveConcept();
          await exchangeGoogleAccessToken(credential);
        } catch (e) {
          if (e instanceof GoogleSignInCancelled) {
            return;
          }
          if (e && typeof e === 'object' && 'code' in e) {
            const { code } = e as { code: string };
            if (code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
              onError('Google Play services are required for Google sign-in on this device.');
              return;
            }
          }
          onError(e instanceof Error ? e.message : String(e));
        } finally {
          setBusy(false);
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
