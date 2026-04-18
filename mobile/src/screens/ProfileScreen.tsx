import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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
import type { RootStackParamList } from '../navigation/types';
import { colors, radius, space, type } from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

function formatProfileInstant(iso: string): string {
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

export function ProfileScreen(_props: Props) {
  const { user, token, signOut } = useAuth();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.hero}>
        <Text accessibilityRole="header" style={styles.heroTitle}>
          Profile
        </Text>
        <Text style={styles.heroSubtitle}>Organizer account for McCheck.</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>Signed in as</Text>
        <Text style={styles.name}>{user?.displayName ?? '—'}</Text>
        <Text style={styles.email}>{user?.email ?? ''}</Text>
        {user?.id != null ? <DetailRow label="User ID" value={String(user.id)} mono /> : null}
        {user?.username ? <DetailRow label="Username" value={user.username} mono /> : null}
        {user?.fullName ? <DetailRow label="Full name" value={user.fullName} /> : null}
        {(user?.firstName || user?.lastName) && !user?.fullName ? (
          <DetailRow label="Name" value={[user?.firstName, user?.lastName].filter(Boolean).join(' ')} />
        ) : null}
        {user?.phone ? <DetailRow label="Phone" value={user.phone} /> : null}
        {user?.bio ? <DetailRow label="Bio" value={user.bio} multiline /> : null}
        {user?.profilePhotoUrl ? (
          <DetailRow label="Profile photo" value={user.profilePhotoUrl} mono multiline />
        ) : null}
        {user?.createdAt ? <DetailRow label="Member since" value={formatProfileInstant(user.createdAt)} /> : null}
        {user?.updatedAt ? <DetailRow label="Profile updated" value={formatProfileInstant(user.updatedAt)} /> : null}
        {user?.hasGoogleAuth != null ? (
          <DetailRow label="Google linked" value={user.hasGoogleAuth ? 'Yes' : 'No'} />
        ) : null}
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>Integration readiness</Text>
        <DetailRow label="Mode" value={USE_MOCK_API ? 'Mock API' : 'Live API'} />
        <DetailRow label="Base URL" value={API_BASE_URL} />
        <DetailRow label="Login path" value={AUTH_LOGIN_PATH} />
        <DetailRow label="Me path" value={AUTH_ME_PATH} />
        <DetailRow label="Logout path" value={AUTH_LOGOUT_PATH} />
        <DetailRow label="My activities list path" value={MY_ACTIVITIES_LIST_PATH} />
        <DetailRow label="Token in session" value={token ? 'Yes' : 'No'} />
        {!USE_MOCK_API ? (
          <Text style={styles.liveHint}>{liveApiTroubleshootingHint()}</Text>
        ) : null}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Sign out"
        style={({ pressed }) => [styles.signOut, pressed && { opacity: 0.9 }]}
        onPress={() => {
          Alert.alert('Sign out?', undefined, [
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  content: { padding: space.lg, paddingBottom: space.xxl },
  hero: { marginBottom: space.lg },
  heroTitle: {
    fontSize: type.titleMd,
    fontWeight: '700',
    color: colors.onSurface,
  },
  heroSubtitle: {
    marginTop: space.xs,
    fontSize: type.bodyMd,
    color: colors.onSurfaceVariant,
  },
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.outlineSoft,
    borderRadius: radius.lg,
    padding: space.lg,
    marginBottom: space.xl,
  },
  label: {
    fontSize: type.labelSm,
    fontWeight: '600',
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  name: { fontSize: type.titleSm, fontWeight: '700', color: colors.onSurface, marginTop: space.xs },
  email: { fontSize: type.bodyMd, color: colors.onSurfaceVariant, marginTop: space.xs },
  detailMono: { fontFamily: 'Courier', fontSize: type.labelSm },
  detailMultiline: { marginTop: space.xxs, lineHeight: 22 },
  signOut: {
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.outlineSoft,
    borderRadius: radius.md,
    paddingVertical: space.md,
    alignItems: 'center',
  },
  signOutText: { color: colors.error, fontSize: type.bodyLg, fontWeight: '600' },
  detailRow: { marginTop: space.sm },
  detailLabel: { fontSize: type.labelSm, color: colors.onSurfaceVariant, fontWeight: '600' },
  detailValue: { marginTop: space.xxs, fontSize: type.bodyMd, color: colors.onSurface },
  liveHint: {
    marginTop: space.md,
    fontSize: type.labelSm,
    color: colors.onSurfaceVariant,
    lineHeight: 20,
  },
});

function DetailRow({
  label,
  value,
  mono,
  multiline,
}: {
  label: string;
  value: string;
  mono?: boolean;
  multiline?: boolean;
}) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text
        style={[styles.detailValue, mono && styles.detailMono, multiline && styles.detailMultiline]}
        numberOfLines={multiline ? undefined : 4}
        ellipsizeMode="tail"
      >
        {value}
      </Text>
    </View>
  );
}
