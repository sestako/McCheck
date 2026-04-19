import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, space } from '../theme/tokens';

type Props = {
  title?: string;
  onBackPress?: () => void;
  rightSlot?: React.ReactNode;
};

/**
 * Centered sticky header used on every Stitch screen.
 * HTML refs: docs/stitch-ref/event-hub.html, upcoming-events.html, guest-list.html, profile-staff.html.
 *
 * `title` is optional and intentionally unbranded — only the Profile modal passes
 * a value today ("Profile"). Other screens omit it so the center stays empty and
 * the back button / `rightSlot` stay at the edges.
 *
 * The right side is a single `rightSlot` for contextual actions
 * (e.g. profile avatar on the home, "Scan" on guest list, "Done" on the
 * Settings modal). Screens that need no right action simply omit it.
 */
export function StitchHeader({ title, onBackPress, rightSlot }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top }]}>
      <View style={styles.side}>
        {onBackPress ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            hitSlop={10}
            onPress={onBackPress}
            style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
          >
            <Text style={styles.backChevron}>‹</Text>
          </Pressable>
        ) : null}
      </View>
      {title ? (
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      ) : (
        <View style={styles.title} />
      )}
      <View style={[styles.side, styles.sideRight]}>{rightSlot ?? null}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingVertical: 4,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  side: { flex: 1 },
  sideRight: { alignItems: 'flex-end' },
  title: {
    flex: 2,
    textAlign: 'center',
    color: colors.onSurface,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  iconBtn: {
    padding: 4,
  },
  backChevron: {
    fontSize: 28,
    lineHeight: 28,
    color: colors.slate700,
    fontWeight: '700',
    marginTop: -4,
  },
});
