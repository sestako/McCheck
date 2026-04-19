import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
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
import { colors, elevation, radius, space, type } from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

/**
 * Stitch-faithful sign-in screen (`docs/stitch-ref/login.html`).
 *
 * Differences from the reference:
 *  - Logo tile is intentionally hidden (product decision).
 *  - `Forgot?` link is hidden — password reset is performed on the web.
 *  - Dev-only API banner sits above the footer instead of above the form.
 *
 * Keep `accessibilityLabel="Continue with email" / "Continue with Google"` so
 * the existing unit tests in `screens/__tests__/LoginScreen.test.tsx` keep
 * passing even though the visible text is shorter ("Sign in" / "Google").
 */
export function LoginScreen({ navigation }: Props) {
  const { signInWithEmail, signInWithGoogle, exchangeGoogleAccessToken } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

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

  const showDevBanner = USE_MOCK_API || __DEV__;

  return (
    <KeyboardAvoidingView
      style={styles.outer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text accessibilityRole="header" style={styles.brand}>
              McCheck
            </Text>
            <Text style={styles.eyebrow}>Event Suite</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>Email address</Text>
              <View
                style={[
                  styles.inputWrap,
                  emailFocused && styles.inputWrapFocused,
                ]}
              >
                <TextInput
                  accessibilityLabel="Email address"
                  style={styles.input}
                  placeholder="name@company.com"
                  placeholderTextColor={colors.slate400}
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  returnKeyType="next"
                />
                <Ionicons name="mail-outline" size={20} color={colors.slate400} style={styles.inputIcon} />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <View
                style={[
                  styles.inputWrap,
                  passwordFocused && styles.inputWrapFocused,
                ]}
              >
                <TextInput
                  accessibilityLabel="Password"
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={colors.slate400}
                  secureTextEntry
                  autoComplete="password"
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  returnKeyType="go"
                />
                <Ionicons name="lock-closed-outline" size={20} color={colors.slate400} style={styles.inputIcon} />
              </View>
            </View>

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
              <Text style={styles.primaryBtnText}>{busy ? 'Signing in…' : 'Sign in'}</Text>
              {!busy ? (
                <Ionicons name="arrow-forward" size={18} color={colors.onPrimary} style={styles.primaryBtnIcon} />
              ) : null}
            </Pressable>
          </View>

          <View style={styles.dividerWrap}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerLabel}>Or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          {USE_MOCK_API ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Continue with Google"
              style={({ pressed }) => [styles.googleBtn, pressed && styles.pressed]}
              disabled={busy}
              onPress={async () => {
                try {
                  await signInWithGoogle();
                } catch (e) {
                  Alert.alert('Google sign in', prettyError(e));
                }
              }}
            >
              <Ionicons name="logo-google" size={18} color={colors.onSurface} />
              <Text style={styles.googleBtnText}>Google</Text>
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
              style={({ pressed }) => [styles.googleBtn, pressed && styles.pressed]}
              disabled={busy}
              onPress={() =>
                Alert.alert(
                  'Google sign-in',
                  'Add OAuth client IDs to mobile/.env (see .env.example): EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID plus EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID and EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID. Google sign-in requires an EAS/dev build (not Expo Go); see docs/mcheck-android-google-oauth-setup.md.'
                )
              }
            >
              <Ionicons name="logo-google" size={18} color={colors.onSurface} />
              <Text style={styles.googleBtnText}>Google</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.footer}>
          {showDevBanner ? (
            <Text style={styles.devBanner} numberOfLines={2}>
              {USE_MOCK_API ? 'Mock API · development build' : endpointPreview}
            </Text>
          ) : null}
          <View style={styles.footerLinks}>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel="Open privacy policy"
              onPress={() => navigation.navigate('PrivacyPolicy')}
              hitSlop={8}
            >
              <Text style={styles.footerLink}>Privacy Policy</Text>
            </Pressable>
            <Text style={styles.footerDot}>·</Text>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel="Open terms of service"
              onPress={() => navigation.navigate('Terms')}
              hitSlop={8}
            >
              <Text style={styles.footerLink}>Terms of Service</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1, backgroundColor: colors.surface },
  scroll: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingTop: space.xxl,
    paddingBottom: space.lg,
  },
  content: { flexGrow: 1, justifyContent: 'center' },

  header: { alignItems: 'center', marginBottom: space.xl },
  brand: {
    color: colors.onSurface,
    fontSize: type.display,
    fontWeight: '800',
    letterSpacing: -1,
    marginBottom: 4,
  },
  eyebrow: {
    color: colors.slate500,
    fontSize: type.labelXs,
    fontWeight: '600',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },

  form: { gap: space.md },
  field: { gap: space.xs },
  label: {
    color: colors.onSurface,
    fontSize: type.labelXs,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: 'transparent',
    paddingHorizontal: space.md,
  },
  inputWrapFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceContainerLowest,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: type.bodyMd,
    color: colors.onSurface,
  },
  inputIcon: { marginLeft: space.sm },

  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    marginTop: space.sm,
    ...elevation.primaryCta,
  },
  primaryBtnText: {
    color: colors.onPrimary,
    fontSize: type.bodyMd,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  primaryBtnIcon: { marginLeft: space.sm, marginRight: -4 },

  dividerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    marginVertical: space.lg,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.slate200 },
  dividerLabel: {
    color: colors.slate400,
    fontSize: type.labelXxs,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },

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

  footer: {
    alignItems: 'center',
    marginTop: space.xl,
    gap: space.sm,
  },
  devBanner: {
    color: colors.slate400,
    fontSize: type.labelXxs,
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  footerLink: {
    color: colors.slate500,
    fontSize: type.labelSm,
    fontWeight: '600',
  },
  footerDot: { color: colors.slate400, fontSize: type.labelSm },

  pressed: { opacity: 0.85 },
});
