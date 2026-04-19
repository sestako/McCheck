import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { API_BASE_URL, USE_MOCK_API } from '../config/env';
import { useAuth } from '../context/AuthContext';
import type { MainStackParamList } from '../navigation/types';
import { colors, space, type as typeScale } from '../theme/tokens';
import { StitchHeader } from '../ui/StitchHeader';

type Props = NativeStackScreenProps<MainStackParamList, 'Settings'>;

/** Profile & Staff Stitch HTML: body / cards / ring / logout (HTML wins over DESIGN.md on this screen). */
const STITCH = {
  bodyBg: '#F7F9FB',
  sectionCard: '#F1F3F5',
  ring: '#10413B',
  onSurface: '#111827',
  muted: '#6b7280',
  mutedLight: '#9ca3af',
  rowIcon: '#6b7280',
  divider: 'rgba(229, 231, 235, 0.5)',
  logoutBg: '#FFE9E9',
  logoutFg: '#E53E3E',
  assistanceRadius: 24,
  cardRadius: 20,
} as const;

const AVATAR_SIZE = 96;
const RING_WIDTH = 3;
const RING_PADDING = 4;

function StitchSectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

function StitchRow({
  icon,
  label,
  value,
  valueMultiline,
  isLast,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  valueMultiline?: string;
  isLast?: boolean;
}) {
  return (
    <View style={[styles.stitchRow, !isLast && styles.stitchRowDivider]}>
      <View style={styles.stitchRowMain}>
        <View style={styles.stitchRowLeft}>
          <Ionicons name={icon} size={22} color={STITCH.rowIcon} />
          <Text style={styles.stitchRowLabel}>{label}</Text>
        </View>
        {value != null && value !== '' && !valueMultiline ? (
          <Text style={styles.stitchRowValue} numberOfLines={2}>
            {value}
          </Text>
        ) : null}
      </View>
      {valueMultiline != null && valueMultiline !== '' ? (
        <Text style={styles.stitchRowBio}>{valueMultiline}</Text>
      ) : null}
    </View>
  );
}

export function SettingsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { user, signOut, refreshProfile, profileRefreshing } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  const dismiss = useCallback(() => {
    if (navigation.canGoBack()) navigation.goBack();
  }, [navigation]);

  const onSignOut = useCallback(async () => {
    setSigningOut(true);
    try {
      await signOut();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Sign out failed';
      Alert.alert('Sign out failed', message);
    } finally {
      setSigningOut(false);
    }
  }, [signOut]);

  const confirmSignOut = useCallback(() => {
    Alert.alert('Sign out?', 'You will need to sign in again to use the app.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => void onSignOut() },
    ]);
  }, [onSignOut]);

  const me = user;
  const displayName = me?.fullName?.trim() || me?.displayName?.trim() || 'Signed in';
  const email = me?.email?.trim() ?? '';
  const username = me?.username?.trim();
  const subtitle = email;

  const avatarUrl = useMemo(() => {
    const raw = me?.profilePhotoUrl?.trim();
    if (!raw) return null;
    return raw;
  }, [me?.profilePhotoUrl]);

  const tokenSourceLabel = USE_MOCK_API ? 'Mock session' : 'API bearer token';

  const apiBase = API_BASE_URL || '(not set)';
  const webAppUrl = process.env.EXPO_PUBLIC_WEB_APP_URL?.trim();
  const stagingHint =
    process.env.EXPO_PUBLIC_STAGING === '1' || __DEV__
      ? 'Staging / dev: live updates use polling when the socket URL is not configured.'
      : null;

  return (
    <View style={styles.scroll}>
      <StitchHeader
        title="Profile"
        rightSlot={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close profile"
            hitSlop={10}
            onPress={dismiss}
            style={({ pressed }) => [styles.doneBtn, pressed && styles.pressed]}
          >
            <Text style={styles.doneBtnText}>Done</Text>
          </Pressable>
        }
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={profileRefreshing}
            onRefresh={() => void refreshProfile()}
            tintColor={colors.primary}
          />
        }
      >
      {/* Profile block (Stitch: centered avatar, name, role line — no staff / no Edit profile). */}
      <View style={styles.profileBlock}>
        <View
          style={[
            styles.avatarRing,
            {
              width: AVATAR_SIZE + 2 * (RING_PADDING + RING_WIDTH),
              height: AVATAR_SIZE + 2 * (RING_PADDING + RING_WIDTH),
              borderRadius: (AVATAR_SIZE + 2 * (RING_PADDING + RING_WIDTH)) / 2,
            },
          ]}
        >
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} accessibilityLabel="Profile photo" />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]} accessibilityLabel="No photo">
              <Ionicons name="person" size={44} color={STITCH.mutedLight} />
            </View>
          )}
        </View>
        <Text style={styles.profileName}>{displayName}</Text>
        {subtitle ? <Text style={styles.profileSubtitle}>{subtitle}</Text> : null}
        {username ? <Text style={styles.profileUsername}>@{username}</Text> : null}

        <Pressable
          onPress={confirmSignOut}
          disabled={signingOut}
          style={({ pressed }) => [
            styles.logoutBtn,
            pressed && styles.pressed,
            signingOut && styles.disabled,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Sign out"
        >
          {signingOut ? (
            <ActivityIndicator color={STITCH.logoutFg} />
          ) : (
            <>
              <Ionicons name="log-out-outline" size={20} color={STITCH.logoutFg} />
              <Text style={styles.logoutBtnText}>Sign out</Text>
            </>
          )}
        </Pressable>
      </View>

      {!me ? (
        <View style={styles.centerBlock}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.muted}>Loading profile…</Text>
        </View>
      ) : (
        <>
          <View style={styles.sectionWrap}>
            <StitchSectionHeader title="About you" />
            <View style={styles.sectionCard}>
              <StitchRow
                icon="person-outline"
                label="Name"
                value={me.fullName?.trim() || me.displayName?.trim() || '—'}
              />
              <StitchRow icon="mail-outline" label="Email" value={me.email?.trim() || '—'} />
              <StitchRow icon="at-outline" label="Username" value={me.username?.trim() || '—'} />
              <StitchRow
                icon="document-text-outline"
                label="About"
                valueMultiline={me.bio?.trim() || '—'}
                isLast
              />
            </View>
          </View>

          {/* Assistance-style block from HTML (`rounded-[24px]`, padded). */}
          <View style={styles.connectionAssistance}>
            <Text style={styles.assistanceTitle}>Connection</Text>
            <Text style={styles.assistanceBody}>
              Environment and API paths. Read-only; configure in env before build.
            </Text>
            <View style={[styles.sectionCard, styles.connectionCardInner]}>
              <StitchRow icon="globe-outline" label="Environment" value={__DEV__ ? 'Development' : 'Production'} />
              <StitchRow icon="link-outline" label="API base" value={apiBase} />
              {webAppUrl ? (
                <StitchRow icon="compass-outline" label="Web app" value={webAppUrl} />
              ) : null}
              <StitchRow icon="key-outline" label="Token" value={tokenSourceLabel} />
              <StitchRow
                icon="pulse-outline"
                label="Live updates"
                value={stagingHint ? 'Polling' : 'Default'}
                isLast
              />
            </View>
            {stagingHint ? <Text style={styles.liveHint}>{stagingHint}</Text> : null}
          </View>
        </>
      )}

      <View style={{ height: insets.bottom + space.xl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: STITCH.bodyBg,
  },
  scrollContent: {
    paddingHorizontal: space.lg,
    paddingBottom: space.xl,
  },
  pressed: {
    opacity: 0.85,
  },
  doneBtn: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  doneBtnText: {
    fontSize: typeScale.bodyMd,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: -0.1,
  },
  disabled: {
    opacity: 0.6,
  },
  profileBlock: {
    alignItems: 'center',
    marginTop: space.sm,
  },
  avatarRing: {
    borderWidth: RING_WIDTH,
    borderColor: STITCH.ring,
    padding: RING_PADDING,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: STITCH.sectionCard,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileName: {
    marginTop: space.md,
    fontSize: typeScale.titleMd,
    fontWeight: '700',
    color: STITCH.onSurface,
  },
  profileSubtitle: {
    marginTop: space.xs,
    fontSize: typeScale.bodyMd,
    fontWeight: '500',
    color: STITCH.muted,
  },
  profileUsername: {
    marginTop: 2,
    fontSize: typeScale.labelSm,
    color: STITCH.muted,
  },
  logoutBtn: {
    marginTop: space.lg,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    backgroundColor: STITCH.logoutBg,
    paddingVertical: 12,
    borderRadius: 12,
  },
  logoutBtnText: {
    fontSize: typeScale.bodyMd,
    fontWeight: '600',
    color: STITCH.logoutFg,
  },
  centerBlock: {
    alignItems: 'center',
    paddingVertical: space.xl,
    gap: space.sm,
  },
  muted: {
    fontSize: typeScale.bodyMd,
    color: STITCH.muted,
  },
  sectionWrap: {
    marginTop: space.xl,
  },
  sectionTitle: {
    fontSize: typeScale.titleSm,
    fontWeight: '700',
    color: STITCH.onSurface,
    marginBottom: space.md,
  },
  sectionCard: {
    backgroundColor: STITCH.sectionCard,
    borderRadius: STITCH.cardRadius,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    overflow: 'hidden',
  },
  stitchRow: {
    paddingVertical: space.md,
  },
  stitchRowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: STITCH.divider,
  },
  stitchRowMain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
  },
  stitchRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    flexShrink: 0,
  },
  stitchRowLabel: {
    fontSize: typeScale.bodyMd,
    fontWeight: '600',
    color: STITCH.onSurface,
  },
  stitchRowValue: {
    flex: 1,
    fontSize: typeScale.bodyMd,
    color: STITCH.muted,
    textAlign: 'right',
  },
  stitchRowBio: {
    marginTop: space.sm,
    marginLeft: 22 + space.md,
    fontSize: typeScale.bodyMd,
    color: STITCH.muted,
    lineHeight: 22,
  },
  connectionAssistance: {
    marginTop: space.xl,
    marginBottom: space.md,
    backgroundColor: STITCH.sectionCard,
    borderRadius: STITCH.assistanceRadius,
    padding: space.lg,
  },
  assistanceTitle: {
    fontSize: typeScale.bodyLg,
    fontWeight: '700',
    color: STITCH.onSurface,
  },
  assistanceBody: {
    marginTop: space.xs,
    fontSize: typeScale.bodyMd,
    color: STITCH.muted,
    lineHeight: 22,
  },
  connectionCardInner: {
    marginTop: space.md,
  },
  liveHint: {
    marginTop: space.md,
    fontSize: typeScale.labelSm,
    color: STITCH.muted,
    lineHeight: 18,
  },
});
