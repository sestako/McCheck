import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { Activity } from '../api/types';
import { useAuth } from '../context/AuthContext';
import { userFriendlyApiMessage } from '../lib/apiErrors';
import type { RootStackParamList } from '../navigation/types';
import { colors, radius, space, type } from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'EventDetail'>;

function formatRange(startIso: string, endIso: string): string {
  const s = new Date(startIso);
  const e = new Date(endIso);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return `${startIso} → ${endIso}`;
  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };
  return `${s.toLocaleString(undefined, options)} - ${e.toLocaleString(undefined, options)}`;
}

function toBadgeLabel(state: string): string {
  return state.replace(/_/g, ' ').toUpperCase();
}

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
      navigation.setOptions({ title: a.name });
    } catch (e) {
      setError(userFriendlyApiMessage(e));
      setActivity(null);
    } finally {
      setLoading(false);
    }
  }, [activityId, activitiesApi, navigation]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primaryContainer} />
      </View>
    );
  }

  if (error || !activity) {
    return (
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
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <Text style={styles.title} numberOfLines={5}>
          {activity.name}
        </Text>
        <Text style={styles.when}>{formatRange(activity.start, activity.end)}</Text>
        <View style={styles.badgeRow}>
          <Text style={styles.stateBadge}>{toBadgeLabel(activity.state)}</Text>
        </View>

        <View style={styles.statRow}>
          <View style={styles.statPill}>
            <Text style={styles.statValue}>{activity.registrationsCount}</Text>
            <Text style={styles.statLabel}>registrations</Text>
          </View>
          {activity.capacity != null ? (
            <View style={styles.statPill}>
              <Text style={styles.statValue}>{activity.capacity}</Text>
              <Text style={styles.statLabel}>capacity</Text>
            </View>
          ) : null}
          {activity.attendingGuestsCount > 0 ? (
            <View style={styles.statPill}>
              <Text style={styles.statValue}>{activity.attendingGuestsCount}</Text>
              <Text style={styles.statLabel}>guests</Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.detailCard}>
        <DetailRow label="State" value={toBadgeLabel(activity.state)} />
        <DetailRow label="Owner" value={activity.owner.displayName} />
        <DetailRow label="UUID" value={activity.uuid} mono />
        {activity.teaser ? <DetailRow label="About" value={activity.teaser} multiline /> : null}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="View guest list"
        style={({ pressed }) => [styles.cta, pressed && { opacity: 0.9 }]}
        onPress={() =>
          navigation.navigate('GuestList', {
            activityId: activity.id,
            activityName: activity.name,
          })
        }
      >
        <Text style={styles.ctaText}>View guest list</Text>
      </Pressable>
    </ScrollView>
  );
}

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
        style={[styles.detailValue, mono && styles.mono, multiline && styles.multiline]}
        numberOfLines={multiline ? 0 : 2}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.surface },
  content: { paddingHorizontal: space.lg, paddingTop: space.xs, paddingBottom: space.xxl },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  heroCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.outlineSoft,
    borderRadius: radius.lg,
    padding: space.lg,
  },
  title: {
    fontSize: type.titleMd,
    fontWeight: '700',
    color: colors.onSurface,
  },
  when: {
    marginTop: space.xs,
    color: colors.onSurfaceVariant,
    fontSize: type.bodyMd,
  },
  badgeRow: { marginTop: space.sm },
  stateBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceContainerLow,
    color: colors.onSurfaceVariant,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: type.labelXs,
    fontWeight: '700',
    textTransform: 'uppercase',
    overflow: 'hidden',
  },
  statRow: {
    marginTop: space.lg,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
  },
  statPill: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: space.xs,
  },
  statValue: { fontSize: type.bodyLg, fontWeight: '700', color: colors.onSurface },
  statLabel: { fontSize: type.labelSm, color: colors.onSurfaceVariant },
  detailCard: {
    marginTop: space.md,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.outlineSoft,
    borderRadius: radius.lg,
    padding: space.lg,
    gap: space.md,
  },
  detailRow: { gap: space.xs },
  detailLabel: {
    fontSize: type.labelSm,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: colors.onSurfaceVariant,
  },
  detailValue: {
    fontSize: type.bodyLg,
    color: colors.onSurface,
  },
  mono: {
    fontFamily: 'Courier',
    fontSize: type.labelSm,
  },
  multiline: {
    lineHeight: 24,
  },
  cta: {
    marginTop: space.xl,
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: colors.primaryContainer,
    borderRadius: radius.md,
    paddingVertical: space.md,
    alignItems: 'center',
  },
  ctaText: { color: colors.onPrimary, fontSize: type.bodyLg, fontWeight: '700' },
  error: { color: colors.error, padding: space.md, textAlign: 'center' },
  retryBtn: {
    marginTop: space.md,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: space.xl,
    paddingVertical: space.sm,
  },
  retryText: { color: colors.onPrimary, fontWeight: '600' },
});
