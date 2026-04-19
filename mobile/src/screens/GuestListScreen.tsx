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
import { reportError } from '../lib/observability';
import type { MainStackParamList } from '../navigation/types';
import { colors, elevation, radius, space, type } from '../theme/tokens';
import { StitchHeader } from '../ui/StitchHeader';

type Props = NativeStackScreenProps<MainStackParamList, 'GuestList'>;

const AVATAR_PALETTE = [
  { bg: '#D1FAE5', fg: '#065F46' },
  { bg: '#FFE4E6', fg: '#9F1239' },
  { bg: '#DBEAFE', fg: '#1E3A8A' },
  { bg: '#FEF3C7', fg: '#92400E' },
  { bg: '#EDE9FE', fg: '#5B21B6' },
  { bg: '#CFFAFE', fg: '#155E75' },
  { bg: '#FCE7F3', fg: '#9D174D' },
] as const;

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p.charAt(0).toUpperCase()).join('') || '?';
}

function avatarFor(name: string) {
  const code = [...name].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return AVATAR_PALETTE[code % AVATAR_PALETTE.length];
}

function formatShortTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/** `docs/stitch-ref/guest-list.html` — Guest management with stats dashboard + IN/OUT rows. */
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
  const [appendError, setAppendError] = useState<string | null>(null);

  const checkedIn = useMemo(() => items.reduce((n, i) => n + (i.checkedInAt ? 1 : 0), 0), [items]);
  const total = items.length;
  const remaining = Math.max(0, total - checkedIn);
  const percent = total > 0 ? Math.round((checkedIn / total) * 100) : 0;

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const resetAndLoad = useCallback(async () => {
    setError(null);
    setAppendError(null);
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
    setAppendError(null);
    const next = page + 1;
    try {
      const res = await activitiesApi.getAttendees(activityId, next, debounced.trim() || null);
      setItems((prev) => [...prev, ...res.items]);
      setHasMore(res.hasMore);
      setPage(next);
    } catch (e) {
      const msg = userFriendlyApiMessage(e);
      reportError('Guest list pagination failed', e, { activityId, page: next });
      setAppendError(msg);
    } finally {
      setLoadingMore(false);
    }
  }, [activitiesApi, activityId, debounced, hasMore, loading, loadingMore, page]);

  return (
    <View style={styles.container}>
      <StitchHeader
        onBackPress={navigation.canGoBack() ? () => navigation.goBack() : undefined}
        rightSlot={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Scan tickets"
            hitSlop={12}
            onPress={() => navigation.navigate('ScanTickets', { activityId, activityName })}
            style={({ pressed }) => [styles.headerScanBtn, pressed && { opacity: 0.85 }]}
          >
            <Text style={styles.headerScanText}>Scan</Text>
          </Pressable>
        }
      />
      <FlatList
        accessibilityLabel="Guest list"
        data={items}
        keyExtractor={(item) => `reg-${item.registrationId}`}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} tintColor={colors.primary} />
        }
        onEndReachedThreshold={0.4}
        onEndReached={() => void loadMore()}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            <View style={styles.intro}>
              <Text accessibilityRole="header" style={styles.eventTitle} numberOfLines={2}>
                {activityName}
              </Text>
              <Text style={styles.eventSub}>Manage entry and guest details for this event.</Text>
            </View>

            <View style={styles.searchWrap}>
              <View style={styles.searchIconDot} />
              <TextInput
                accessibilityLabel="Search guests by name or ticket ID"
                style={styles.searchInput}
                placeholder="Search by name or ticket ID…"
                placeholderTextColor={colors.slate400}
                value={search}
                onChangeText={setSearch}
                autoCorrect={false}
              />
            </View>

            <View style={styles.statsGrid}>
              <View style={[styles.statCard, styles.statCardPrimary]}>
                <Text style={styles.statCapLight}>CHECKED IN</Text>
                <Text style={styles.statValueLight}>{checkedIn.toLocaleString()}</Text>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${percent}%` }]} />
                </View>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statCapMuted}>REMAINING</Text>
                <Text style={styles.statValueBrand}>{remaining.toLocaleString()}</Text>
                <Text style={styles.statFootnote}>Total: {total.toLocaleString()}</Text>
              </View>
            </View>

            {error && items.length > 0 ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{error}</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Retry loading guests"
                  onPress={() => void resetAndLoad()}
                >
                  <Text style={styles.errorRetry}>Retry</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : error ? (
            <View style={styles.centered}>
              <Text style={styles.empty}>{error}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Retry loading guests"
                style={({ pressed }) => [styles.retryCta, pressed && { opacity: 0.9 }]}
                onPress={() => void resetAndLoad()}
              >
                <Text style={styles.retryCtaText}>Retry</Text>
              </Pressable>
            </View>
          ) : (
            <Text style={styles.empty}>
              {debounced.trim() ? 'No guests match this search.' : 'No registered guests yet.'}
            </Text>
          )
        }
        renderItem={({ item }) => {
          const palette = avatarFor(item.user.displayName);
          const initials = initialsOf(item.user.displayName);
          const status = item.checkedInAt ? 'IN' : 'OUT';
          return (
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <View style={[styles.avatar, { backgroundColor: palette.bg }]}>
                  <Text style={[styles.avatarText, { color: palette.fg }]}>{initials}</Text>
                </View>
                <View style={{ flexShrink: 1 }}>
                  <Text style={styles.name} numberOfLines={1}>
                    {item.user.displayName}
                  </Text>
                  <Text style={styles.subline} numberOfLines={1}>
                    {item.isBlocked
                      ? 'Blocked'
                      : item.checkedInAt
                        ? `Checked in ${formatShortTime(item.checkedInAt)}`
                        : item.isGuest
                          ? 'Guest'
                          : 'Registered'}
                  </Text>
                </View>
              </View>
              <View style={styles.rowRight}>
                <Text style={styles.statusLabel}>{status}</Text>
                <Switch on={!!item.checkedInAt} />
              </View>
            </View>
          );
        }}
        ListFooterComponent={
          <>
            {appendError ? (
              <View style={styles.appendErrorWrap}>
                <Text style={styles.appendError}>{appendError}</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Retry loading more guests"
                  onPress={() => void loadMore()}
                >
                  <Text style={styles.errorRetry}>Try again</Text>
                </Pressable>
              </View>
            ) : null}
            {loadingMore ? <ActivityIndicator style={{ margin: 16 }} color={colors.primary} /> : null}
          </>
        }
      />
    </View>
  );
}

function Switch({ on }: { on: boolean }) {
  return (
    <View style={[switchStyles.track, on && switchStyles.trackOn]}>
      <View style={[switchStyles.knob, on && switchStyles.knobOn]} />
    </View>
  );
}

const switchStyles = StyleSheet.create({
  track: {
    width: 40,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.slate200,
    padding: 2,
  },
  trackOn: { backgroundColor: colors.primary },
  knob: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.surfaceContainerLowest,
  },
  knobOn: { transform: [{ translateX: 18 }] },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  headerScanBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.secondaryContainer,
    borderRadius: 999,
  },
  headerScanText: { color: colors.primary, fontWeight: '800', fontSize: type.labelSm },

  listContent: { paddingHorizontal: space.lg, paddingBottom: space.xxl },

  intro: { marginTop: space.lg, marginBottom: space.md },
  eventTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.onSurface,
    letterSpacing: -0.5,
  },
  eventSub: { marginTop: 4, color: colors.slate500, fontSize: type.bodyMd },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    marginBottom: space.md,
  },
  searchIconDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: colors.slate400,
    marginRight: 10,
  },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: type.bodyMd, color: colors.slate700 },

  statsGrid: { flexDirection: 'row', gap: 14, marginBottom: space.md },
  statCard: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.lg,
    padding: space.md,
    ...elevation.card,
  },
  statCardPrimary: { backgroundColor: colors.primary },
  statCapLight: {
    color: colors.onPrimary,
    opacity: 0.85,
    fontSize: type.labelXxs,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  statCapMuted: {
    color: colors.slate400,
    fontSize: type.labelXxs,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  statValueLight: {
    marginVertical: 6,
    color: colors.onPrimary,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  statValueBrand: {
    marginVertical: 6,
    color: colors.primary,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  statFootnote: { color: colors.slate400, fontSize: type.labelXxs, fontWeight: '600', marginTop: 10 },
  progressTrack: {
    marginTop: 10,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: colors.surfaceContainerLowest },

  row: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.lg,
    padding: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.sm,
    marginBottom: 12,
    ...elevation.card,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 1 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: type.labelSm, fontWeight: '800' },
  name: { color: colors.onSurface, fontSize: type.bodyMd, fontWeight: '700' },
  subline: { marginTop: 2, color: colors.slate500, fontSize: type.labelSm },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 0 },
  statusLabel: { color: colors.slate400, fontSize: type.labelXxs, fontWeight: '800', letterSpacing: 1 },

  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: space.xxl },
  empty: { textAlign: 'center', color: colors.slate500, fontSize: type.bodyMd, paddingVertical: space.xl },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
    backgroundColor: colors.errorSurface,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    marginBottom: space.md,
  },
  errorBannerText: { color: colors.error, flex: 1, fontSize: type.bodyMd, fontWeight: '600' },
  errorRetry: { color: colors.primary, fontWeight: '800', fontSize: type.labelSm },
  retryCta: {
    marginTop: space.md,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: space.xl,
    paddingVertical: space.sm,
  },
  retryCtaText: { color: colors.onPrimary, fontWeight: '700' },
  appendErrorWrap: {
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    alignItems: 'center',
    gap: space.xs,
  },
  appendError: { color: colors.error, fontSize: type.bodyMd, textAlign: 'center' },
});
