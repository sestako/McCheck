import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { statusCodes } from '@react-native-google-signin/google-signin';
import { GoogleSignInCancelled, getGoogleCredentialForMoveConcept } from './nativeGoogleSignIn';
import { colors, radius, space, type } from '../theme/tokens';

type Props = {
  disabled: boolean;
  exchangeGoogleAccessToken: (credential: string) => Promise<void>;
  onError: (message: string) => void;
};

/**
 * Google sign-in button — visual twin of the mock-mode button on
 * `screens/LoginScreen.tsx` (white surface, slate outline, Google glyph on
 * the left). Kept as a separate component because it owns the native
 * `@react-native-google-signin/google-signin` wiring.
 */
export function GoogleSignInButton({ disabled, exchangeGoogleAccessToken, onError }: Props) {
  const [busy, setBusy] = useState(false);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Continue with Google"
      style={({ pressed }) => [styles.googleBtn, pressed && styles.pressed]}
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
      <Ionicons name="logo-google" size={18} color={colors.onSurface} />
      <Text style={styles.googleBtnText}>{busy ? 'Signing in…' : 'Google'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.slate200,
    paddingVertical: 14,
  },
  googleBtnText: {
    color: colors.onSurface,
    fontSize: type.bodyMd,
    fontWeight: '700',
  },
  pressed: { opacity: 0.85 },
});
