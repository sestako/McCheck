import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { Activity } from '../api/types';
import { useAuth } from '../context/AuthContext';
import { userFriendlyApiMessage } from '../lib/apiErrors';
import type { AttendeesStackParamList } from '../navigation/types';
import { colors, radius, space, type } from '../theme/tokens';

type Props = NativeStackScreenProps<AttendeesStackParamList, 'AttendeesHome'>;

function formatStart(startIso: string): string {
  const d = new Date(startIso);
  if (Number.isNaN(d.getTime())) return startIso;
  return d.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function toBadgeLabel(state: string): string {
  return state.replace(/_/g, ' ').toUpperCase();
}

/**
 * Attendees tab root (Stitch bottom nav): same activities as Events, opens guest list directly.
 */
export function AttendeesHomeScreen({ navigation }: Props) {
  const { activitiesApi } = useAuth();
  const [items, setItems] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await activitiesApi.getMyActivities();
      setItems(data);
    } catch (e) {
      setError(userFriendlyApiMessage(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activitiesApi]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load])
  );

  if (loading && items.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primaryContainer} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text accessibilityRole="header" style={styles.heroTitle}>
          Attendees
        </Text>
        <Text style={styles.heroSubtitle}>Select an event to view its guest list.</Text>
      </View>

      {error ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>{error}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Retry loading events" onPress={() => void load()}>
            <Text style={styles.bannerAction}>Retry</Text>
          </Pressable>
        </View>
      ) : null}

      <FlatList
        accessibilityLabel="Events you can open guest lists for"
        data={items}
        keyExtractor={(item) => String(item.id)}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load();
            }}
            tintColor={colors.primaryContainer}
          />
        }
        contentContainerStyle={items.length === 0 ? styles.emptyContainer : styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No draft, upcoming, or ongoing events you own.</Text>
        }
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            onPress={() =>
              navigation.navigate('GuestList', {
                activityId: item.id,
                activityName: item.name,
              })
            }
          >
            <View style={styles.rowTop}>
              <Text style={styles.rowTitle} numberOfLines={3} ellipsizeMode="tail">
                {item.name}
              </Text>
              <Text style={styles.stateBadge}>{toBadgeLabel(item.state)}</Text>
            </View>
            <Text style={styles.rowMeta}>
              {item.registrationsCount} registrations
              {item.capacity != null ? ` · capacity ${item.capacity}` : ''}
            </Text>
            <Text style={styles.rowWhen}>{formatStart(item.start)}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  hero: {
    paddingHorizontal: space.lg,
    paddingTop: space.xs,
    paddingBottom: space.sm,
  },
  heroTitle: {
    fontSize: type.titleMd,
    fontWeight: '700',
    color: colors.onSurface,
  },
  heroSubtitle: {
    marginTop: space.xs,
    color: colors.onSurfaceVariant,
    fontSize: type.bodyMd,
  },
  listContent: { paddingHorizontal: space.lg, paddingBottom: space.xl },
  row: {
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.outlineSoft,
    borderRadius: radius.lg,
    padding: space.lg,
    marginBottom: space.md,
  },
  rowPressed: { opacity: 0.92 },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  rowTitle: { flex: 1, fontSize: type.titleSm, fontWeight: '600', color: colors.onSurface },
  stateBadge: {
    backgroundColor: colors.surfaceContainerLow,
    color: colors.onSurfaceVariant,
    fontSize: type.labelXs,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
  },
  rowMeta: { fontSize: type.bodyMd, color: colors.onSurfaceVariant, marginTop: space.sm },
  rowWhen: { fontSize: type.labelSm, color: colors.onSurfaceVariant, marginTop: space.xs },
  emptyContainer: { flexGrow: 1, justifyContent: 'center', padding: space.xl },
  emptyText: { textAlign: 'center', color: colors.onSurfaceVariant, fontSize: type.bodyLg },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    backgroundColor: colors.surfaceContainerLow,
    marginHorizontal: space.lg,
    borderRadius: radius.md,
    marginBottom: space.md,
  },
  bannerText: { flex: 1, color: colors.error, fontSize: type.bodyMd },
  bannerAction: { color: colors.primaryContainer, fontWeight: '600', marginLeft: space.sm },
});
