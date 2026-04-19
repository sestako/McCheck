import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { Activity } from '../api/types';
import { useAuth } from '../context/AuthContext';
import { userFriendlyApiMessage } from '../lib/apiErrors';
import type { MainStackParamList } from '../navigation/types';
import { colors, elevation, radius, space, type } from '../theme/tokens';
import { CapacityRing } from '../ui/CapacityRing';
import { HeaderProfileButton } from '../ui/HeaderProfileButton';
import { StitchHeader } from '../ui/StitchHeader';

type Props = NativeStackScreenProps<MainStackParamList, 'EventDetail'>;

/** `docs/stitch-ref/event-hub.html` — Event Hub dashboard (single event). */
export function EventDetailScreen({ route, navigation }: Props) {
  const { activityId } = route.params;
  const { activitiesApi } = useAuth();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const a = await activitiesApi.getActivity(activityId);
      setActivity(a);
    } catch (e) {
      setError(userFriendlyApiMessage(e));
      setActivity(null);
    } finally {
      setLoading(false);
    }
  }, [activityId, activitiesApi]);

  useEffect(() => {
    void load();
  }, [load]);

  const percent = useMemo(() => {
    if (!activity?.capacity || activity.capacity <= 0) return 0;
    return Math.round((activity.attendingGuestsCount / activity.capacity) * 100);
  }, [activity]);

  const headerBack = navigation.canGoBack() ? () => navigation.goBack() : undefined;
  const headerProfile = (
    <HeaderProfileButton onPress={() => navigation.navigate('Settings')} />
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <StitchHeader onBackPress={headerBack} rightSlot={headerProfile} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (error || !activity) {
    return (
      <View style={styles.container}>
        <StitchHeader onBackPress={headerBack} rightSlot={headerProfile} />
        <View style={styles.centered}>
          <Text style={styles.error}>{error ?? 'Not found'}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Retry loading event"
            style={({ pressed }) => [styles.retryBtn, pressed && { opacity: 0.9 }]}
            onPress={() => void load()}
          >
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const venue = activity.address?.split(',')[0] ?? 'Venue to be announced';
  const redemption =
    activity.registrationsCount > 0
      ? Math.round((activity.attendingGuestsCount / activity.registrationsCount) * 100)
      : 0;

  return (
    <View style={styles.container}>
      <StitchHeader onBackPress={headerBack} rightSlot={headerProfile} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.titleBlock}>
          <Text style={styles.titleHero} numberOfLines={3}>
            {activity.name}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {venue}
          </Text>
        </View>

        <View style={styles.capacityCard}>
          <CapacityRing percent={percent} label="Capacity" size={220} stroke={22} />
          <View style={styles.statsRow}>
            <View style={styles.statBlock}>
              <Text style={styles.statBig}>{activity.attendingGuestsCount}</Text>
              <Text style={styles.statCap}>CHECKED IN</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBlock}>
              <Text style={styles.statBig}>{activity.capacity ?? '–'}</Text>
              <Text style={styles.statCap}>EXPECTED</Text>
            </View>
          </View>
        </View>

        <View style={styles.actionCluster}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open ticket scanner"
            style={({ pressed }) => [styles.scannerBtn, pressed && { opacity: 0.92 }]}
            onPress={() =>
              navigation.navigate('ScanTickets', {
                activityId: activity.id,
                activityName: activity.name,
              })
            }
          >
            <Text style={styles.scannerBtnText}>OPEN SCANNER</Text>
          </Pressable>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel="View guest list"
            style={({ pressed }) => [styles.guestLink, pressed && { opacity: 0.6 }]}
            onPress={() =>
              navigation.navigate('GuestList', {
                activityId: activity.id,
                activityName: activity.name,
              })
            }
          >
            <Text style={styles.guestLinkText}>View Guest List</Text>
            <Text style={styles.guestLinkChevron}>›</Text>
          </Pressable>
        </View>

        <View style={styles.secondaryGrid}>
          <View style={styles.secondaryCard}>
            <View style={styles.secondaryIcon}>
              <Ionicons name="people-outline" size={22} color={colors.primary} />
            </View>
            <Text style={styles.secondaryBig}>{activity.registrationsCount}</Text>
            <Text style={styles.secondaryCap}>REGISTRATIONS</Text>
          </View>
          <View style={styles.secondaryCard}>
            <View style={styles.secondaryIcon}>
              <Ionicons name="ticket-outline" size={22} color={colors.primary} />
            </View>
            <Text style={styles.secondaryBig}>{redemption}%</Text>
            <Text style={styles.secondaryCap}>
              TICKET{'\n'}REDEMPTION
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  scroll: { paddingHorizontal: space.lg, paddingBottom: space.xxl },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.lg },

  titleBlock: { marginTop: space.lg, marginBottom: space.lg },
  titleHero: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.onSurface,
    letterSpacing: -0.8,
    lineHeight: 40,
  },
  subtitle: {
    marginTop: 4,
    color: colors.slate700,
    fontSize: type.bodyLg,
    fontWeight: '500',
  },

  capacityCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 36,
    paddingVertical: space.xl,
    paddingHorizontal: space.lg,
    alignItems: 'center',
    marginBottom: space.lg,
    ...elevation.card,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    paddingTop: space.lg,
    marginTop: space.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  statBlock: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, height: 40, backgroundColor: colors.slate100 },
  statBig: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.onSurface,
    letterSpacing: -0.5,
  },
  statCap: {
    marginTop: 6,
    fontSize: type.labelXs,
    fontWeight: '700',
    color: colors.slate500,
    letterSpacing: 2,
  },

  actionCluster: { alignItems: 'center', gap: space.lg, marginBottom: space.xl },
  scannerBtn: {
    width: '100%',
    backgroundColor: colors.primary,
    paddingVertical: 22,
    borderRadius: radius.xl,
    alignItems: 'center',
    ...elevation.primaryCta,
  },
  scannerBtnText: {
    color: colors.onPrimary,
    fontSize: type.bodyLg,
    fontWeight: '800',
    letterSpacing: 1,
  },
  guestLink: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  guestLinkText: { color: colors.primary, fontSize: type.bodyLg, fontWeight: '800' },
  guestLinkChevron: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: '800',
    marginTop: -3,
  },

  secondaryGrid: { flexDirection: 'row', gap: 14 },
  secondaryCard: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.xxl,
    padding: space.lg,
    justifyContent: 'space-between',
    ...elevation.card,
  },
  secondaryIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBig: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.onSurface,
    letterSpacing: -0.5,
  },
  secondaryCap: {
    fontSize: type.labelXxs,
    fontWeight: '700',
    color: colors.slate500,
    letterSpacing: 1.5,
    lineHeight: 14,
    marginTop: 6,
  },

  error: { color: colors.error, padding: space.md, textAlign: 'center' },
  retryBtn: {
    marginTop: space.md,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: space.xl,
    paddingVertical: space.sm,
  },
  retryText: { color: colors.onPrimary, fontWeight: '700' },
});
