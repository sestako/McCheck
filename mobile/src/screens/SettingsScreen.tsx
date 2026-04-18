/**
 * Settings (product Stitch #10): account from GET /me + Connection (env) + sign out.
 * Colors / radii: McCheck Stitch MCP `list_projects` designTheme (ROUND_EIGHT → 8px cards).
 * Note: MCP `list_screens` has no frame titled “Settings”; staff UI stays out of V1.
 */
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  API_BASE_URL,
  AUTH_LOGIN_PATH,
  AUTH_LOGOUT_PATH,
  AUTH_ME_PATH,
  MY_ACTIVITIES_LIST_PATH,
  USE_MOCK_API,
} from '../config/env';
import { useAuth } from '../context/AuthContext';
import { liveApiTroubleshootingHint } from '../lib/apiErrors';
import type { MainTabParamList } from '../navigation/types';
import { colors, radius, space, type } from '../theme/tokens';

type Props = BottomTabScreenProps<MainTabParamList, 'Settings'>;

const AVATAR_SIZE = 96;
const hairline = StyleSheet.hairlineWidth;
/** Stitch designTheme.roundness ROUND_EIGHT */
const CARD_RADIUS = radius.sm;

function formatSettingsInstant(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function avatarInitial(displayName: string): string {
  const t = displayName.trim();
  return (t.slice(0, 1) || '?').toUpperCase();
}

type StackRow = { key: string; label: string; value: string; mono?: boolean; multiline?: boolean };

const ABOUT_COLLAPSE_THRESHOLD = 4;

export function SettingsScreen(_props: Props) {
  const { user, token, signOut } = useAuth();
  const displayName = user?.displayName ?? '—';
  const photoUri = user?.profilePhotoUrl?.trim() ? user.profilePhotoUrl : null;

  const aboutRows = useMemo((): StackRow[] => {
    if (!user) return [];
    const rows: StackRow[] = [];
    if (user.id != null) rows.push({ key: 'id', label: 'User ID', value: String(user.id), mono: true });
    if (user.username) rows.push({ key: 'username', label: 'Username', value: user.username, mono: true });
    if (user.fullName) rows.push({ key: 'fullName', label: 'Full name', value: user.fullName });
    if ((user.firstName || user.lastName) && !user.fullName) {
      rows.push({
        key: 'name',
        label: 'Name',
        value: [user.firstName, user.lastName].filter(Boolean).join(' '),
      });
    }
    if (user.phone) rows.push({ key: 'phone', label: 'Phone', value: user.phone });
    if (user.bio) rows.push({ key: 'bio', label: 'Bio', value: user.bio, multiline: true });
    if (user.createdAt) rows.push({ key: 'created', label: 'Member since', value: formatSettingsInstant(user.createdAt) });
    if (user.updatedAt) rows.push({ key: 'updated', label: 'Profile updated', value: formatSettingsInstant(user.updatedAt) });
    if (user.hasGoogleAuth != null) {
      rows.push({ key: 'google', label: 'Google linked', value: user.hasGoogleAuth ? 'Yes' : 'No' });
    }
    return rows;
  }, [user]);

  const [aboutOpen, setAboutOpen] = useState(() => aboutRows.length <= ABOUT_COLLAPSE_THRESHOLD);

  const connectionRows = useMemo(
    (): StackRow[] => [
      { key: 'mode', label: 'Mode', value: USE_MOCK_API ? 'Mock API' : 'Live API' },
      { key: 'base', label: 'Base URL', value: API_BASE_URL, mono: true },
      { key: 'login', label: 'Login path', value: AUTH_LOGIN_PATH, mono: true },
      { key: 'me', label: 'Me path', value: AUTH_ME_PATH, mono: true },
      { key: 'logout', label: 'Logout path', value: AUTH_LOGOUT_PATH, mono: true },
      { key: 'activities', label: 'My activities path', value: MY_ACTIVITIES_LIST_PATH, mono: true },
      { key: 'token', label: 'Token in session', value: token ? 'Yes' : 'No' },
    ],
    [token]
  );

  const showAboutToggle = aboutRows.length > ABOUT_COLLAPSE_THRESHOLD;
  const visibleAboutRows = showAboutToggle && !aboutOpen ? [] : aboutRows;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View
        style={styles.hero}
        accessible
        accessibilityRole="header"
        accessibilityLabel="Settings. Your profile and how this device connects to MoveConcept."
      >
        <Text style={styles.heroEyebrow}>Settings</Text>
        <Text style={styles.heroSubtitle}>Your profile and how this device talks to MoveConcept.</Text>
      </View>

      <View style={styles.identityCard}>
        {photoUri ? (
          <Image
            accessibilityIgnoresInvertColors
            accessibilityLabel={`Profile photo for ${displayName}`}
            source={{ uri: photoUri }}
            style={styles.avatarImage}
          />
        ) : (
          <View
            style={styles.avatarPlaceholder}
            accessibilityRole="image"
            accessibilityLabel={`Avatar for ${displayName}`}
          >
            <Text style={styles.avatarInitial}>{avatarInitial(displayName)}</Text>
          </View>
        )}
        <Text style={styles.identityName} numberOfLines={2}>
          {displayName}
        </Text>
        {user?.email ? (
          <Text style={styles.identityEmail} numberOfLines={2}>
            {user.email}
          </Text>
        ) : null}
        {user?.username ? (
          <Text style={styles.identityTertiary} numberOfLines={1}>
            @{user.username}
          </Text>
        ) : null}
      </View>

      {aboutRows.length > 0 ? (
        <View style={styles.sectionWrap}>
          {showAboutToggle ? (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: aboutOpen }}
              accessibilityLabel={aboutOpen ? 'Collapse about you' : 'Expand about you'}
              onPress={() => setAboutOpen((o) => !o)}
              style={({ pressed }) => [styles.aboutToggle, pressed && styles.aboutTogglePressed]}
            >
              <Text style={styles.sectionEyebrow}>About you</Text>
              <Text style={styles.aboutChevron} accessibilityElementsHidden importantForAccessibility="no">
                {aboutOpen ? '▼' : '▶'}
              </Text>
            </Pressable>
          ) : (
            <Text style={styles.sectionEyebrowStatic}>About you</Text>
          )}
          {visibleAboutRows.length > 0 ? (
            <View style={styles.groupedCard}>
              {visibleAboutRows.map((row, i) => (
                <View
                  key={row.key}
                  style={[styles.groupedRowPad, i < visibleAboutRows.length - 1 && styles.groupedRowBorder]}
                >
                  {row.multiline ? (
                    <>
                      <Text style={styles.groupedLabel}>{row.label}</Text>
                      <Text
                        style={[styles.groupedValue, styles.groupedValueMultiline, row.mono && styles.mono]}
                      >
                        {row.value}
                      </Text>
                    </>
                  ) : (
                    <View style={styles.rowInline}>
                      <Text style={styles.groupedLabelInline}>{row.label}</Text>
                      <Text
                        style={[styles.groupedValueInline, row.mono && styles.mono]}
                        numberOfLines={3}
                        ellipsizeMode="tail"
                      >
                        {row.value}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}

      <View style={styles.sectionWrap}>
        <Text style={styles.diagnosticsEyebrow}>Connection</Text>
        <Text style={styles.diagnosticsHint}>Environment and API paths (read-only).</Text>
        <View style={styles.diagnosticsCard}>
          {connectionRows.map((row, i) => (
            <View
              key={row.key}
              style={[styles.diagnosticsRow, i < connectionRows.length - 1 && styles.diagnosticsRowBorder]}
            >
              <Text style={styles.diagnosticsLabel}>{row.label}</Text>
              <Text
                style={[styles.diagnosticsValue, row.mono && styles.diagnosticsMono]}
                numberOfLines={4}
                ellipsizeMode="tail"
              >
                {row.value}
              </Text>
            </View>
          ))}
          {!USE_MOCK_API ? (
            <Text style={styles.liveHint}>{liveApiTroubleshootingHint()}</Text>
          ) : null}
        </View>
      </View>

      <View style={styles.dangerZone}>
        <Text style={styles.dangerEyebrow}>Account actions</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sign out"
          style={({ pressed }) => [styles.signOutMinimal, pressed && styles.signOutPressed]}
          onPress={() => {
            Alert.alert('Sign out?', 'You will need to sign in again to manage events.', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Sign out',
                style: 'destructive',
                onPress: () => {
                  void signOut();
                },
              },
            ]);
          }}
        >
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  content: { paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: space.xxl * 2 },
  hero: { marginBottom: space.xl, paddingRight: space.sm },
  heroEyebrow: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceContainerLow,
    color: colors.onSurfaceVariant,
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
    borderRadius: 999,
    fontSize: type.labelXs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  heroSubtitle: {
    marginTop: space.md,
    fontSize: type.bodyMd,
    lineHeight: 22,
    color: colors.onSurfaceVariant,
  },
  identityCard: {
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.outlineSoft,
    borderRadius: CARD_RADIUS,
    paddingVertical: space.xl,
    paddingHorizontal: space.lg,
    marginBottom: space.xl,
  },
  avatarImage: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 3,
    borderColor: colors.secondaryContainer,
  },
  avatarPlaceholder: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: colors.secondaryContainer,
    borderWidth: 1,
    borderColor: colors.outlineSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: type.titleLg,
    fontWeight: '700',
    color: colors.primary,
  },
  identityName: {
    marginTop: space.md,
    fontSize: type.titleSm,
    fontWeight: '700',
    color: colors.onSurface,
    textAlign: 'center',
  },
  identityEmail: {
    marginTop: space.xs,
    fontSize: type.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
  identityTertiary: {
    marginTop: space.xs,
    fontSize: type.labelSm,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    opacity: 0.9,
  },
  sectionWrap: { marginBottom: space.xl },
  aboutToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.sm,
    paddingVertical: space.xs,
    paddingHorizontal: space.xs,
    borderRadius: CARD_RADIUS,
  },
  aboutTogglePressed: { opacity: 0.85, backgroundColor: colors.surfaceContainerLow },
  aboutChevron: {
    fontSize: type.labelSm,
    color: colors.onSurfaceVariant,
    marginLeft: space.md,
  },
  sectionEyebrow: {
    fontSize: type.labelSm,
    fontWeight: '700',
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sectionEyebrowStatic: {
    fontSize: type.labelSm,
    fontWeight: '700',
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: space.sm,
    marginLeft: space.xs,
  },
  groupedCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    overflow: 'hidden',
  },
  groupedRowPad: {
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
  },
  groupedRowBorder: {
    borderBottomWidth: hairline,
    borderBottomColor: colors.outlineVariant,
  },
  groupedLabel: {
    fontSize: type.labelSm,
    fontWeight: '600',
    color: colors.onSurfaceVariant,
    marginBottom: space.xxs,
  },
  groupedValue: {
    fontSize: type.bodyMd,
    color: colors.onSurface,
    lineHeight: 22,
  },
  groupedValueMultiline: { lineHeight: 22 },
  rowInline: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.md,
  },
  groupedLabelInline: {
    fontSize: type.labelSm,
    fontWeight: '600',
    color: colors.onSurfaceVariant,
    width: 108,
    flexShrink: 0,
    paddingTop: 2,
  },
  groupedValueInline: {
    flex: 1,
    fontSize: type.bodyMd,
    color: colors.onSurface,
    textAlign: 'right',
    lineHeight: 22,
  },
  mono: { fontFamily: 'Courier', fontSize: type.bodyMd },
  diagnosticsEyebrow: {
    fontSize: type.labelXs,
    fontWeight: '700',
    color: colors.onSurfaceVariant,
    opacity: 0.85,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: space.xs,
    marginLeft: space.xs,
  },
  diagnosticsHint: {
    fontSize: type.labelXs,
    color: colors.onSurfaceVariant,
    opacity: 0.8,
    marginBottom: space.sm,
    marginLeft: space.xs,
    lineHeight: 16,
  },
  diagnosticsCard: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    paddingVertical: space.xs,
    overflow: 'hidden',
  },
  diagnosticsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.sm,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
  },
  diagnosticsRowBorder: {
    borderBottomWidth: hairline,
    borderBottomColor: colors.outlineVariant,
  },
  diagnosticsLabel: {
    width: 100,
    flexShrink: 0,
    fontSize: type.labelXs,
    fontWeight: '600',
    color: colors.onSurfaceVariant,
    opacity: 0.9,
    paddingTop: 2,
  },
  diagnosticsValue: {
    flex: 1,
    fontSize: type.labelSm,
    color: colors.onSurfaceVariant,
    lineHeight: 18,
    textAlign: 'right',
  },
  diagnosticsMono: { fontFamily: 'Courier', fontSize: type.labelXs },
  liveHint: {
    marginTop: space.sm,
    marginHorizontal: space.md,
    marginBottom: space.sm,
    fontSize: type.labelXs,
    color: colors.onSurfaceVariant,
    opacity: 0.9,
    lineHeight: 18,
  },
  dangerZone: {
    marginTop: space.lg,
    paddingTop: space.xl,
    borderTopWidth: hairline,
    borderTopColor: colors.outlineSoft,
  },
  dangerEyebrow: {
    fontSize: type.labelSm,
    fontWeight: '700',
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: space.md,
    marginLeft: space.xs,
  },
  signOutMinimal: {
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingVertical: space.md,
    borderRadius: CARD_RADIUS,
    backgroundColor: 'transparent',
  },
  signOutPressed: { opacity: 0.75, backgroundColor: colors.surfaceContainerLow },
  signOutText: {
    fontSize: type.bodyLg,
    fontWeight: '700',
    color: colors.error,
  },
});
