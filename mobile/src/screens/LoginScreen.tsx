import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { GoogleSignInButton } from '../auth/GoogleSignInButton';
import {
  API_BASE_URL,
  AUTH_GOOGLE_SOCIAL_PATH,
  AUTH_LOGIN_PATH,
  isGoogleLoginConfigured,
  USE_MOCK_API,
} from '../config/env';
import { useAuth } from '../context/AuthContext';
import { userFriendlyApiMessage } from '../lib/apiErrors';
import type { RootStackParamList } from '../navigation/types';
import { colors, radius, space, type } from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export function LoginScreen(_props: Props) {
  const { signInWithEmail, signInWithGoogle, exchangeGoogleAccessToken } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const endpointPreview = `${API_BASE_URL}${AUTH_LOGIN_PATH}`;

  function prettyError(err: unknown): string {
    const base = userFriendlyApiMessage(err);
    if (USE_MOCK_API) return base;
    if (!(err instanceof Error)) return base;
    const message = err.message || '';
    if (/no api token/i.test(message)) {
      return `${base}\n\nCheck login response shape or set EXPO_PUBLIC_AUTH_LOGIN_PATH.`;
    }
    if (base.includes(endpointPreview)) return base;
    return `${base}\n\nEndpoint: ${endpointPreview}`;
  }

  return (
    <KeyboardAvoidingView
      style={styles.outer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.eyebrow}>Organizer mode</Text>
        <Text accessibilityRole="header" style={styles.title}>
          McCheck
        </Text>
        <Text style={styles.subtitle}>Sign in with the same account as MoveConcept.</Text>
        {USE_MOCK_API ? (
          <View style={styles.mockBanner}>
            <Text style={styles.mockBannerText}>Mock API enabled for development</Text>
          </View>
        ) : (
          <View style={styles.liveBanner}>
            <Text style={styles.liveBannerText}>Live API mode</Text>
            <Text style={styles.liveBannerMeta}>{endpointPreview}</Text>
          </View>
        )}

        <TextInput
          accessibilityLabel="Email address"
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={colors.onSurfaceVariant}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          accessibilityLabel="Password"
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={colors.onSurfaceVariant}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Continue with email"
          style={({ pressed }) => [styles.primaryBtn, (pressed || busy) && styles.pressed]}
          disabled={busy}
          onPress={async () => {
            try {
              setBusy(true);
              await signInWithEmail(email || 'demo@example.com', password);
            } catch (e) {
              Alert.alert('Sign in failed', prettyError(e));
            } finally {
              setBusy(false);
            }
          }}
        >
          <Text style={styles.primaryBtnText}>{busy ? 'Signing in...' : 'Continue with email'}</Text>
        </Pressable>

        {USE_MOCK_API ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Continue with Google"
            style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
            disabled={busy}
            onPress={async () => {
              try {
                await signInWithGoogle();
              } catch (e) {
                Alert.alert('Google sign in', prettyError(e));
              }
            }}
          >
            <Text style={styles.secondaryBtnText}>Continue with Google</Text>
          </Pressable>
        ) : isGoogleLoginConfigured() ? (
          <GoogleSignInButton
            disabled={busy}
            exchangeGoogleAccessToken={exchangeGoogleAccessToken}
            onError={(msg) =>
              Alert.alert('Google sign in', `${msg}\n\nEndpoint: ${API_BASE_URL}${AUTH_GOOGLE_SOCIAL_PATH}`)
            }
          />
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Continue with Google"
            style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
            disabled={busy}
            onPress={() =>
              Alert.alert(
                'Google sign-in',
                'Add OAuth client IDs to mobile/.env (see .env.example): EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID plus EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID and EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID. Google sign-in requires an EAS/dev build (not Expo Go); see docs/mcheck-android-google-oauth-setup.md.'
              )
            }
          >
            <Text style={styles.secondaryBtnText}>Continue with Google</Text>
          </Pressable>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    padding: space.lg,
  },
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.outlineSoft,
    borderRadius: radius.lg,
    padding: space.lg,
    gap: space.md,
  },
  eyebrow: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceContainerLow,
    color: colors.onSurfaceVariant,
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
    borderRadius: 999,
    fontSize: type.labelXs,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: type.titleLg,
    fontWeight: '700',
    color: colors.onSurface,
  },
  subtitle: {
    fontSize: type.bodyMd,
    color: colors.onSurfaceVariant,
    marginBottom: space.sm,
  },
  mockBanner: {
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.outlineSoft,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    marginBottom: space.xxs,
  },
  mockBannerText: {
    color: colors.onSurfaceVariant,
    fontSize: type.labelSm,
    fontWeight: '500',
  },
  liveBanner: {
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.outlineSoft,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    marginBottom: space.xxs,
    gap: space.xxs,
  },
  liveBannerText: {
    color: colors.primaryContainer,
    fontSize: type.labelSm,
    fontWeight: '600',
  },
  liveBannerMeta: {
    color: colors.onSurfaceVariant,
    fontSize: type.labelSm,
  },
  input: {
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.outlineSoft,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
    fontSize: type.bodyLg,
    color: colors.onSurface,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: colors.primaryContainer,
    borderRadius: radius.md,
    paddingVertical: space.md,
    alignItems: 'center',
    marginTop: space.md,
  },
  primaryBtnText: {
    color: colors.onPrimary,
    fontSize: type.bodyLg,
    fontWeight: '600',
  },
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
