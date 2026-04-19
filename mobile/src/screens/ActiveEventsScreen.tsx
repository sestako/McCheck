import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Activity, ActivityFilter } from '../api/types';
import { useAuth } from '../context/AuthContext';
import { userFriendlyApiMessage } from '../lib/apiErrors';
import type { MainStackParamList } from '../navigation/types';
import { colors, elevation, radius, space, type } from '../theme/tokens';
import { HeaderProfileButton } from '../ui/HeaderProfileButton';
import { StitchHeader } from '../ui/StitchHeader';

type Props = NativeStackScreenProps<MainStackParamList, 'ActiveEvents'>;

const SCREEN_HEIGHT = Dimensions.get('window').height;

type FilterOption = {
  id: ActivityFilter;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const FILTER_OPTIONS: readonly FilterOption[] = [
  {
    id: 'all',
    label: 'All events',
    description: 'Upcoming and ongoing events you own',
    icon: 'calendar-outline',
  },
  {
    id: 'upcoming',
    label: 'Upcoming',
    description: 'Events that haven’t started yet',
    icon: 'time-outline',
  },
  {
    id: 'ongoing',
    label: 'Ongoing',
    description: 'Happening right now',
    icon: 'pulse-outline',
  },
];

function filterLabel(filter: ActivityFilter): string {
  return FILTER_OPTIONS.find((o) => o.id === filter)?.label ?? 'All events';
}

/** `docs/stitch-ref/upcoming-events.html` — Upcoming Events screen. */
export function ActiveEventsScreen({ navigation }: Props) {
  const { activitiesApi } = useAuth();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<ActivityFilter>('all');
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [sheetMounted, setSheetMounted] = useState(false);
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (filterSheetOpen) {
      setSheetMounted(true);
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.spring(sheetTranslateY, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 4,
          speed: 14,
        }),
      ]).start();
      return;
    }
    if (!sheetMounted) return;
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }),
      Animated.timing(sheetTranslateY, {
        toValue: SCREEN_HEIGHT,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) setSheetMounted(false);
    });
  }, [filterSheetOpen, sheetMounted, backdropOpacity, sheetTranslateY]);

  const load = useCallback(
    async (nextFilter: ActivityFilter) => {
      setError(null);
      try {
        const data = await activitiesApi.getMyActivities(nextFilter);
        setItems(data);
      } catch (e) {
        setError(userFriendlyApiMessage(e));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activitiesApi]
  );

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load(filter);
    }, [load, filter])
  );

  const onSelectFilter = useCallback(
    (next: ActivityFilter) => {
      setFilterSheetOpen(false);
      if (next === filter) return;
      setFilter(next);
      setLoading(true);
      void load(next);
    },
    [filter, load]
  );

  const [featured, rest] = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? items.filter((i) => i.name.toLowerCase().includes(q) || i.address?.toLowerCase().includes(q))
      : items;
    const sorted = [...filtered].sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
    );
    return [sorted[0] ?? null, sorted.slice(1)];
  }, [items, query]);

  const openEvent = useCallback(
    (a: Activity) => navigation.navigate('EventDetail', { activityId: a.id }),
    [navigation]
  );
  const openGuestList = useCallback(
    (a: Activity) =>
      navigation.navigate('GuestList', { activityId: a.id, activityName: a.name }),
    [navigation]
  );

  if (loading && items.length === 0) {
    return (
      <View style={styles.container}>
        <StitchHeader />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StitchHeader
        rightSlot={
          <HeaderProfileButton onPress={() => navigation.navigate('Settings')} />
        }
      />
      <ScrollView
        stickyHeaderIndices={[]}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load(filter);
            }}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.hero}>
          <Text accessibilityRole="header" style={styles.heroTitle}>
            Upcoming Events
          </Text>
          <Text style={styles.heroSub}>
            {heroSubtitle(filter, items.length)}
          </Text>
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchField}>
            <View style={styles.searchIcon} />
            <TextInput
              accessibilityLabel="Search events"
              placeholder="Search events…"
              placeholderTextColor={colors.slate400}
              value={query}
              onChangeText={setQuery}
              style={styles.searchInput}
              autoCorrect={false}
            />
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Filter events. Current filter: ${filterLabel(filter)}.`}
            accessibilityState={{ expanded: filterSheetOpen }}
            onPress={() => setFilterSheetOpen(true)}
            style={({ pressed }) => [
              styles.filterBtn,
              filter !== 'all' && styles.filterBtnActive,
              pressed && { opacity: 0.7 },
            ]}
          >
            <Ionicons
              name="options-outline"
              size={22}
              color={filter === 'all' ? colors.slate700 : colors.onPrimary}
            />
            {filter !== 'all' ? <View style={styles.filterDot} /> : null}
          </Pressable>
        </View>

        {error ? (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>{error}</Text>
            <Pressable accessibilityRole="button" onPress={() => void load(filter)}>
              <Text style={styles.bannerAction}>Retry</Text>
            </Pressable>
          </View>
        ) : null}

        {featured ? (
          <FeaturedEventCard
            activity={featured}
            onPress={() => openEvent(featured)}
            onOpenGuestList={() => openGuestList(featured)}
          />
        ) : null}

        <View style={styles.listSection}>
          {rest.length === 0 && !featured ? (
            <Text style={styles.emptyText}>{emptyText(filter, query)}</Text>
          ) : null}
          {rest.map((item) => (
            <EventRow
              key={item.id}
              activity={item}
              onPress={() => openEvent(item)}
              onOpenGuestList={() => openGuestList(item)}
            />
          ))}
        </View>
      </ScrollView>

      <Modal
        visible={sheetMounted}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={() => setFilterSheetOpen(false)}
      >
        <Animated.View
          pointerEvents={filterSheetOpen ? 'auto' : 'none'}
          style={[styles.sheetBackdrop, { opacity: backdropOpacity }]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close filter"
            onPress={() => setFilterSheetOpen(false)}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
        <Animated.View
          style={[
            styles.sheet,
            {
              paddingBottom: insets.bottom + space.lg,
              transform: [{ translateY: sheetTranslateY }],
            },
          ]}
        >
          <View style={styles.sheetHandle} />
          <Text accessibilityRole="header" style={styles.sheetTitle}>
            Filter events
          </Text>
          {FILTER_OPTIONS.map((opt) => {
            const active = opt.id === filter;
            return (
              <Pressable
                key={opt.id}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => onSelectFilter(opt.id)}
                style={({ pressed }) => [
                  styles.sheetRow,
                  active && styles.sheetRowActive,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <View
                  style={[styles.sheetRowIcon, active && styles.sheetRowIconActive]}
                >
                  <Ionicons
                    name={opt.icon}
                    size={20}
                    color={active ? colors.onPrimary : colors.primary}
                  />
                </View>
                <View style={styles.sheetRowText}>
                  <Text style={styles.sheetRowLabel}>{opt.label}</Text>
                  <Text style={styles.sheetRowDesc}>{opt.description}</Text>
                </View>
                {active ? (
                  <Ionicons name="checkmark" size={22} color={colors.primary} />
                ) : null}
              </Pressable>
            );
          })}
        </Animated.View>
      </Modal>
    </View>
  );
}

function heroSubtitle(filter: ActivityFilter, count: number): string {
  if (count === 0) {
    if (filter === 'upcoming') return 'No upcoming events.';
    if (filter === 'ongoing') return 'Nothing ongoing right now.';
    return 'No upcoming or ongoing events you own.';
  }
  const plural = count === 1 ? '' : 's';
  if (filter === 'upcoming') return `${count} upcoming event${plural}.`;
  if (filter === 'ongoing') return `${count} ongoing event${plural}.`;
  return `You have ${count} event${plural} scheduled.`;
}

function emptyText(filter: ActivityFilter, query: string): string {
  if (query.trim()) return 'No matches for your search.';
  if (filter === 'upcoming') return 'No upcoming events.';
  if (filter === 'ongoing') return 'Nothing is happening right now.';
  return 'No events to show.';
}

function FeaturedEventCard({
  activity,
  onPress,
  onOpenGuestList,
}: {
  activity: Activity;
  onPress: () => void;
  onOpenGuestList: () => void;
}) {
  const d = new Date(activity.start);
  const day = Number.isNaN(d.getTime()) ? '--' : String(d.getDate());
  const mon = Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleString(undefined, { month: 'short' }).toUpperCase();
  const time = Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleString(undefined, { hour: '2-digit', minute: '2-digit' });
  const pill = pillLabelFor(activity.start);
  const venue = activity.address?.split(',')[0] ?? 'Venue to be announced';

  return (
    <View style={styles.featured}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open ${activity.name}`}
        onPress={onPress}
        style={({ pressed }) => [pressed && { opacity: 0.97 }]}
      >
        <View style={styles.featuredImage}>
          <View style={styles.featuredImageGlow} />
        </View>
        <View style={styles.featuredBody}>
          <View style={styles.featuredTopRow}>
            <View style={styles.todayPill}>
              <Text style={styles.todayPillText}>{pill}</Text>
            </View>
            <View style={styles.featuredDateBlock}>
              <Text style={styles.featuredDay}>{day}</Text>
              <Text style={styles.featuredMonth}>{mon}</Text>
            </View>
          </View>
          <Text style={styles.featuredTitle} numberOfLines={2}>
            {activity.name}
          </Text>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <View style={[styles.metaDot, { backgroundColor: colors.slate400 }]} />
              <Text style={styles.metaText} numberOfLines={1}>
                {venue}
              </Text>
            </View>
            {time ? (
              <View style={styles.metaItem}>
                <View style={[styles.metaDot, { backgroundColor: colors.slate400 }]} />
                <Text style={styles.metaText}>{time}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </Pressable>
      <View style={styles.featuredDivider} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open guest list for ${activity.name}`}
        onPress={onOpenGuestList}
        style={({ pressed }) => [styles.featuredAction, pressed && styles.chipPressed]}
      >
        <Ionicons name="people" size={18} color={colors.primary} />
        <Text style={styles.featuredActionText}>View guest list</Text>
        <Text style={styles.featuredActionChevron}>›</Text>
      </Pressable>
    </View>
  );
}

function EventRow({
  activity,
  onPress,
  onOpenGuestList,
}: {
  activity: Activity;
  onPress: () => void;
  onOpenGuestList: () => void;
}) {
  const initials = activity.name.slice(0, 2).toUpperCase();
  const d = new Date(activity.start);
  const when = Number.isNaN(d.getTime())
    ? activity.start
    : d.toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
  const place = activity.address?.split(',')[0] ?? 'TBA';
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open ${activity.name}`}
        onPress={onPress}
        style={({ pressed }) => [styles.rowMain, pressed && { opacity: 0.95 }]}
      >
        <View style={styles.rowThumb}>
          <Text style={styles.rowThumbText}>{initials}</Text>
        </View>
        <View style={styles.rowTextWrap}>
          <Text style={styles.rowTitle} numberOfLines={1}>
            {activity.name}
          </Text>
          <View style={styles.rowMetaRow}>
            <Text style={styles.rowMetaText} numberOfLines={1}>
              {when}
            </Text>
            <Text style={styles.rowMetaSep}>·</Text>
            <Text style={[styles.rowMetaText, styles.rowMetaPlace]} numberOfLines={1}>
              {place}
            </Text>
          </View>
        </View>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open guest list for ${activity.name}`}
        onPress={onOpenGuestList}
        hitSlop={8}
        style={({ pressed }) => [styles.rowIconBtn, pressed && styles.chipPressed]}
      >
        <Ionicons name="people" size={18} color={colors.primary} />
      </Pressable>
    </View>
  );
}

function pillLabelFor(startIso: string): string {
  const d = new Date(startIso);
  if (Number.isNaN(d.getTime())) return 'UPCOMING';
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) return 'TODAY';
  const diff = Math.round((d.getTime() - now.getTime()) / 86_400_000);
  if (diff === 1) return 'TOMORROW';
  if (diff > 1 && diff < 8) return `IN ${diff} DAYS`;
  return 'UPCOMING';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  scroll: { paddingHorizontal: space.lg, paddingBottom: space.xxl },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hero: { marginTop: space.md, marginBottom: space.md },
  heroTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.onSurface,
    letterSpacing: -0.8,
  },
  heroSub: {
    marginTop: space.sm,
    color: colors.slate500,
    fontSize: type.bodyMd,
    fontWeight: '500',
  },
  searchRow: { flexDirection: 'row', gap: 12, marginBottom: space.lg },
  searchField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.lg,
    paddingHorizontal: 14,
  },
  searchIcon: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: colors.slate400,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    color: colors.slate700,
    fontSize: type.bodyMd,
  },
  filterBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtnActive: {
    backgroundColor: colors.primary,
  },
  filterDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.onPrimary,
  },

  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surfaceContainerLowest,
    borderTopLeftRadius: radius.xxxl,
    borderTopRightRadius: radius.xxxl,
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    ...elevation.lifted,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.slate200,
    marginBottom: space.md,
  },
  sheetTitle: {
    fontSize: type.titleSm,
    fontWeight: '800',
    color: colors.onSurface,
    marginBottom: space.md,
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: radius.lg,
  },
  sheetRowActive: {
    backgroundColor: colors.secondaryContainer,
  },
  sheetRowIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetRowIconActive: {
    backgroundColor: colors.primary,
  },
  sheetRowText: { flex: 1, minWidth: 0 },
  sheetRowLabel: {
    color: colors.onSurface,
    fontSize: type.bodyLg,
    fontWeight: '700',
  },
  sheetRowDesc: {
    color: colors.slate500,
    fontSize: type.labelSm,
    marginTop: 2,
  },

  featured: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.xxl,
    marginBottom: space.lg,
    overflow: 'hidden',
    ...elevation.card,
  },
  featuredImage: {
    height: 180,
    backgroundColor: colors.slate900,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredImageGlow: {
    width: 160,
    height: 160,
    borderRadius: 80,
    opacity: 0.18,
    backgroundColor: colors.primary,
  },
  featuredBody: { padding: space.lg },
  featuredTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: space.md,
  },
  featuredDateBlock: { alignItems: 'flex-end', flexShrink: 0 },
  todayPill: {
    backgroundColor: colors.secondaryContainer,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  todayPillText: {
    color: colors.primary,
    fontSize: type.labelXs,
    fontWeight: '800',
    letterSpacing: 1,
  },
  featuredDay: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.onSurface,
    lineHeight: 26,
  },
  featuredMonth: {
    fontSize: type.labelXxs,
    fontWeight: '800',
    color: colors.slate400,
    letterSpacing: 2,
  },
  featuredTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.onSurface,
    marginBottom: 14,
  },
  metaRow: { flexDirection: 'row', gap: 18, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaDot: { width: 6, height: 6, borderRadius: 3 },
  metaText: {
    color: colors.slate500,
    fontSize: type.bodyMd,
    fontWeight: '500',
  },
  featuredDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
    marginHorizontal: space.lg,
  },
  featuredAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.lg,
    paddingVertical: 14,
    gap: 10,
  },
  featuredActionText: {
    flex: 1,
    color: colors.primary,
    fontSize: type.bodyMd,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  featuredActionChevron: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: '700',
    marginTop: -3,
  },

  listSection: { gap: 12 },
  row: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 22,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    ...elevation.card,
  },
  rowMain: {
    flex: 1,
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minWidth: 0,
  },
  rowTextWrap: { flex: 1, minWidth: 0 },
  rowThumb: {
    width: 60,
    height: 60,
    borderRadius: radius.lg,
    backgroundColor: colors.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowThumbText: {
    color: colors.primary,
    fontSize: type.bodyLg,
    fontWeight: '800',
  },
  rowTitle: { color: colors.onSurface, fontSize: type.bodyLg, fontWeight: '700' },
  rowMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  rowMetaText: { color: colors.slate500, fontSize: type.labelSm, fontWeight: '600' },
  rowMetaPlace: { flexShrink: 1 },
  rowMetaSep: { color: colors.slate400, fontSize: type.labelSm },

  chipPressed: { opacity: 0.85 },
  rowIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondaryContainer,
    flexShrink: 0,
  },

  emptyText: {
    textAlign: 'center',
    color: colors.slate500,
    fontSize: type.bodyLg,
    paddingVertical: space.xl,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.errorSurface,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    marginBottom: space.md,
  },
  bannerText: { flex: 1, color: colors.error, fontSize: type.bodyMd, fontWeight: '600' },
  bannerAction: { color: colors.primary, fontWeight: '700', marginLeft: space.sm },
});
