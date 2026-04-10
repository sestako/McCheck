import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { AttendeeRow } from '../api/types';
import { useAuth } from '../context/AuthContext';
import { userFriendlyApiMessage } from '../lib/apiErrors';
import type { RootStackParamList } from '../navigation/types';
import { colors, radius, space, type } from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'GuestList'>;

export function GuestListScreen({ route, navigation }: Props) {
  const { activityId, activityName } = route.params;
  const { activitiesApi } = useAuth();
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<AttendeeRow[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const blockedCount = useMemo(
    () => items.reduce((sum, i) => sum + (i.isBlocked ? 1 : 0), 0),
    [items]
  );

  useEffect(() => {
    navigation.setOptions({ title: activityName });
  }, [activityName, navigation]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const resetAndLoad = useCallback(async () => {
    setError(null);
    setLoading(true);
    setPage(1);
    setItems([]);
    setHasMore(true);
    try {
      const res = await activitiesApi.getAttendees(activityId, 1, debounced.trim() || null);
      setItems(res.items);
      setHasMore(res.hasMore);
      setPage(1);
    } catch (e) {
      setError(userFriendlyApiMessage(e));
    } finally {
      setLoading(false);
    }
  }, [activitiesApi, activityId, debounced]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await resetAndLoad();
    } finally {
      setRefreshing(false);
    }
  }, [resetAndLoad]);

  useEffect(() => {
    void resetAndLoad();
  }, [debounced, resetAndLoad]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore || loading) return;
    setLoadingMore(true);
    const next = page + 1;
    try {
      const res = await activitiesApi.getAttendees(activityId, next, debounced.trim() || null);
      setItems((prev) => [...prev, ...res.items]);
      setHasMore(res.hasMore);
      setPage(next);
    } catch {
      // Keep current list and footer state quiet on paging errors.
    } finally {
      setLoadingMore(false);
    }
  }, [activitiesApi, activityId, debounced, hasMore, loading, loadingMore, page]);

  return (
    <View style={styles.container}>
      <View style={styles.searchWrap}>
        <TextInput
          accessibilityLabel="Search guests"
          style={styles.search}
          placeholder="Search guests"
          placeholderTextColor={colors.onSurfaceVariant}
          value={search}
          onChangeText={setSearch}
        />
        <View style={styles.counterRow}>
          <Text style={styles.counterText}>{items.length} guests loaded</Text>
          {blockedCount > 0 ? <Text style={styles.counterWarn}>{blockedCount} blocked guests</Text> : null}
        </View>
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.error}>{error}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Retry loading guests"
            onPress={() => void resetAndLoad()}
          >
            <Text style={styles.errorRetry}>Retry</Text>
          </Pressable>
        </View>
      ) : null}

      {loading && items.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primaryContainer} />
        </View>
      ) : (
        <FlatList
          accessibilityLabel="Guest list"
          data={items}
          keyExtractor={(item) => String(item.user.id)}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void refresh()}
              tintColor={colors.primaryContainer}
            />
          }
          onEndReachedThreshold={0.4}
          onEndReached={() => void loadMore()}
          contentContainerStyle={items.length === 0 ? styles.emptyContainer : styles.listContent}
          ListEmptyComponent={<Text style={styles.empty}>No guests match this search.</Text>}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.user.displayName.slice(0, 1).toUpperCase()}</Text>
              </View>
              <View style={styles.rowTextWrap}>
                <Text style={styles.name} numberOfLines={2} ellipsizeMode="tail">
                  {item.user.displayName}
                </Text>
                <Text style={styles.subline}>Guest</Text>
              </View>
              {item.isBlocked ? <Text style={styles.blocked}>Blocked</Text> : null}
            </View>
          )}
          ListFooterComponent={
            loadingMore ? <ActivityIndicator style={{ margin: 16 }} color={colors.primaryContainer} /> : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  searchWrap: {
    paddingHorizontal: space.lg,
    paddingTop: space.xs,
  },
  search: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: 14,
    fontSize: type.bodyLg,
    color: colors.onSurface,
  },
  counterRow: {
    marginTop: space.xs,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  counterText: { color: colors.onSurfaceVariant, fontSize: type.labelSm },
  counterWarn: { color: colors.error, fontSize: type.labelSm, fontWeight: '600' },
  listContent: {
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    paddingBottom: space.xxl,
  },
  row: {
    marginBottom: space.md,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.outlineSoft,
    borderRadius: radius.md,
    padding: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.onSurfaceVariant, fontWeight: '700' },
  rowTextWrap: { flex: 1 },
  name: { fontSize: type.bodyLg, color: colors.onSurface, fontWeight: '500' },
  subline: { marginTop: space.xxs, color: colors.onSurfaceVariant, fontSize: type.labelSm },
  blocked: {
    fontSize: type.labelSm,
    fontWeight: '700',
    color: colors.error,
    backgroundColor: colors.surfaceContainerLow,
    textTransform: 'uppercase',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  emptyContainer: { flexGrow: 1, justifyContent: 'center' },
  empty: { textAlign: 'center', color: colors.onSurfaceVariant, marginTop: space.xl },
  centered: { flex: 1, justifyContent: 'center' },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
    marginHorizontal: space.lg,
    marginTop: space.xs,
    paddingVertical: space.xs,
  },
  error: { color: colors.error, flex: 1 },
  errorRetry: {
    color: colors.primaryContainer,
    fontWeight: '700',
    fontSize: type.labelSm,
  },
});
