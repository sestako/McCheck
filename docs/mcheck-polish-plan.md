# McCheck — UI/UX Polish Plan

> **Status:** Ready to execute while waiting on V2 backend endpoints (ticket
> resolve, check-in, ticket id, registration `created_at`, resend-email).
> Nothing in this document requires backend changes.
>
> **Last updated:** 2026-04-19
>
> **Related docs:**
> - `mcheck-implementation-plan.md` — core feature work (done/in-flight)
> - `mcheck-v2-implementation-plan.md` — backend work that unblocks the Guest
>   Detail Sheet "Confirm Check-in" button
> - `stitch-ref/DESIGN.md` — visual source of truth

---

## 1. Context — what's already solid

The architectural scaffolding is finished; polish is now the highest-leverage
lever. Current state, good and bad:

**Already in place**

- Design tokens: full palette, 8-point spacing, 5 radius values, 3 elevation
  presets, typography scale (`mobile/src/theme/tokens.ts`).
- Two animated surfaces: scanner line (`ScanTicketsScreen.tsx`) and filter
  sheet (`ActiveEventsScreen.tsx`) — both use `Animated` + `useNativeDriver`.
- Slim shared header (`StitchHeader.tsx`, ~38 px content band).
- Consistent modal animation pattern (backdrop fade + sheet spring).

**Gaps this plan addresses**

- **Zero haptics** anywhere (`expo-haptics` not installed). Staff use this app
  at loud doors — tactile feedback is the highest-leverage single fix.
- **Loading states** are bare `<ActivityIndicator />`. No skeletons.
- **Press feedback** is inconsistent: `opacity: 0.6 / 0.7 / 0.75 / 0.8 / 0.85 /
  0.9` scattered across files.
- **Empty states** are flat text (`"No registered guests yet."`). No icon,
  no friendly voice.
- **Error states** are bare text + retry. No illustration.
- **Card press** doesn't visually "depress" — no scale, just opacity.
- **Stat numbers** (checked-in, registered) snap-update on refresh; no
  tick-up animation.
- **Capacity ring** draws statically on mount (no arc animation).

---

## 2. Tier 1 — ship together in one PR (~1.5 days)

Highest ROI, lowest risk. Do these **all** in a single coherent PR so the
app takes a visible quality jump at once.

### 1.1 Haptics wrapper (+6 call sites)

**Effort:** ~2 h. **Impact:** ★★★★★

Install: `expo install expo-haptics` (peer-compatible with current Expo SDK).

New file `mobile/src/lib/haptics.ts`:

```ts
import * as Haptics from 'expo-haptics';

/**
 * Thin wrappers. Call from event handlers; never from render. All three no-op
 * silently on unsupported devices (e.g. iOS Simulator without CoreHaptics,
 * older Android hardware).
 */
export const hapticTap = () => {
  void Haptics.selectionAsync();
};
export const hapticSuccess = () => {
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
};
export const hapticError = () => {
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
};
export const hapticBump = () => {
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};
```

Call sites:

| Screen | Event | Helper |
|---|---|---|
| `ScanTicketsScreen` | QR resolved → 200 | `hapticSuccess()` |
| `ScanTicketsScreen` | QR resolved → error / not found | `hapticError()` |
| `ScanTicketsScreen` | flashlight toggle, manual-entry open | `hapticTap()` |
| `ActiveEventsScreen` | filter option selected | `hapticTap()` |
| `ActiveEventsScreen` | filter sheet open | `hapticBump()` |
| Event card tap (Active Events, Guest List rows) | navigate | `hapticTap()` |
| Future `GuestDetailSheet` | check-in success | `hapticSuccess()` |

Testing: mock `expo-haptics` in `jest.setup.ts` with `jest.mock('expo-haptics', () => ({ …no-op }))` so unit tests stay silent.

### 1.2 Skeleton loader component (+3 screens)

**Effort:** ~4 h. **Impact:** ★★★★★

New file `mobile/src/ui/Skeleton.tsx`:

```tsx
import React, { useEffect, useRef } from 'react';
import { Animated, type ViewStyle } from 'react-native';
import { colors } from '../theme/tokens';

type Props = {
  width: number | string;
  height: number;
  radius?: number;
  style?: ViewStyle;
};

/** Pulsing placeholder used while lists/cards are loading. */
export function Skeleton({ width, height, radius = 8, style }: Props) {
  const pulse = useRef(new Animated.Value(0.6)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.6, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  return (
    <Animated.View
      style={[
        { width, height, borderRadius: radius, backgroundColor: colors.surfaceContainerLow, opacity: pulse },
        style,
      ]}
    />
  );
}
```

Compose per screen (small, co-located helpers):

- **Active Events** — replace the loading `ActivityIndicator` with:
  - 1 hero skeleton matching `FeaturedEventCard` (≈ 200 px tall)
  - 4 row skeletons matching `EventRow` (≈ 80 px each)
- **Guest List** — 1 skeleton for stats row (2 cards side-by-side) + 5 row
  skeletons matching `AttendeeRow`.
- **Event Detail** — 1 title skeleton + 1 capacity-ring skeleton + 3
  secondary-card skeletons.

**Do not** show the skeleton for pull-to-refresh; only on initial load
(when `items.length === 0 && loading`). Refresh should keep the stale data
visible behind the spinner.

### 1.3 Unified press feedback

**Effort:** ~2 h. **Impact:** ★★★☆☆

New file `mobile/src/ui/pressableStyles.ts`:

```ts
import type { ViewStyle } from 'react-native';

export const pressedOpacity = ({ pressed }: { pressed: boolean }) => ({
  opacity: pressed ? 0.7 : 1,
});

export const pressedScale =
  (base: ViewStyle = {}) =>
  ({ pressed }: { pressed: boolean }) => ({
    ...base,
    transform: [{ scale: pressed ? 0.98 : 1 }],
    opacity: pressed ? 0.92 : 1,
  });
```

Migration (grep + touch):

- `grep -rn "pressed.*opacity" mobile/src/screens` → replace ad-hoc inline
  feedback with `pressedOpacity` on small buttons (back chevron, Scan pill,
  Done, filter pill, retry).
- Apply `pressedScale(styles.card)` to tappable cards:
  `FeaturedEventCard`, `EventRow`, `AttendeeRow`, secondary cards on Event
  Detail (Registration, Ticket Redemption, Guest List entry).
- Do **not** apply scale to the scanner overlay buttons — scale feels wrong
  on fullscreen controls.

### 1.4 List entry animation

**Effort:** ~2 h. **Impact:** ★★★☆☆

`react-native-reanimated` is already in the dep graph (transitively via
`react-native-screens` / `gesture-handler`). Use its built-in presets — no
new install.

```tsx
// in FlatList renderItem
import Animated, { FadeInDown } from 'react-native-reanimated';

<Animated.View entering={FadeInDown.duration(240).delay(index * 30)}>
  <EventRow … />
</Animated.View>
```

Apply to: `ActiveEventsScreen` rows + featured card, `GuestListScreen` rows,
`EventDetailScreen` secondary cards. Cap the stagger at ~6 rows (`delay(Math.min(index, 5) * 30)`) so pagination doesn't look sluggish.

### 1.5 Sheet drag-to-dismiss (filter + future guest detail)

**Effort:** ~2 h. **Impact:** ★★☆☆☆

Gesture-handler is already installed. Wrap the filter sheet's
`Animated.View` in a `PanGestureHandler` (or the modern `Gesture.Pan()` API).
On downward pan > 50 px with velocity > 500 → call `setFilterSheetOpen(false)`.

Bump the sheet corner radius while you're there:

```ts
// in ActiveEventsScreen styles
sheet: {
  …
  borderTopLeftRadius: radius.xxl,   // 24 — was 20
  borderTopRightRadius: radius.xxl,
}
```

---

## 3. Tier 2 — pick two after Tier 1 (~2–3 days)

### 2.1 EmptyState component (+ 3 screens)

**Effort:** ~3 h. **Impact:** ★★★★☆

New file `mobile/src/ui/EmptyState.tsx`:

```tsx
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, space, type } from '../theme/tokens';

type Props = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  subtitle?: string;
  tone?: 'neutral' | 'error';
  cta?: { label: string; onPress: () => void };
};

export function EmptyState({ icon, title, subtitle, tone = 'neutral', cta }: Props) {
  const iconColor = tone === 'error' ? colors.error : colors.slate400;
  return (
    <View style={styles.wrap}>
      <View style={[styles.iconWrap, tone === 'error' && styles.iconWrapError]}>
        <Ionicons name={icon} size={36} color={iconColor} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {cta ? (
        <Pressable accessibilityRole="button" onPress={cta.onPress} style={styles.cta}>
          <Text style={styles.ctaText}>{cta.label}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: space.xxl, paddingHorizontal: space.lg, gap: space.xs },
  iconWrap: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: space.sm,
  },
  iconWrapError: { backgroundColor: colors.errorSurface },
  title: { fontSize: type.titleSm, fontWeight: '700', color: colors.onSurface },
  subtitle: { marginTop: 4, fontSize: type.bodyMd, color: colors.slate500, textAlign: 'center' },
  cta: {
    marginTop: space.md,
    backgroundColor: colors.primary,
    paddingHorizontal: space.xl, paddingVertical: space.sm,
    borderRadius: radius.md,
  },
  ctaText: { color: colors.onPrimary, fontWeight: '700' },
});
```

Call sites:

- **Active Events** (after filter returns empty):
  - `'all'` empty → `"No active events"` / `"Create an event from the web to see it here."`
  - `'upcoming'` empty → `"No upcoming events"` / `"Nothing scheduled yet."`
  - `'ongoing'` empty → `"No live events right now"` / `"Check back when your event starts."`
- **Guest List** (empty): `"No guests yet"` / `"Once people register, they'll appear here."` Same component with `cta` for share URL once we have one.
- **Guest List** (no search match): `"No guests match this search"` / `"Try a different name or ticket ID."`
- **Error states** (everywhere) → reuse with `tone="error"` and `icon="cloud-offline-outline"`.

### 2.2 Capacity ring animation + stat count-up

**Effort:** ~4 h. **Impact:** ★★★★☆

`mobile/src/ui/CapacityRing.tsx` currently draws a static arc. Animate:

- Mount: `strokeDashoffset` from full to target over 600 ms (`Animated.timing`,
  `useNativeDriver: false` because SVG props).
- Update (new percentage): same animation from current to next target. Don't
  re-animate from zero on re-renders — store current in a ref.

Pair with a count-up for the big number on Guest List's "CHECKED IN" card:

```tsx
// mobile/src/ui/CountUp.tsx
function CountUp({ value, duration = 600 }: { value: number; duration?: number }) {
  const prev = useRef(value);
  const [display, setDisplay] = useState(value);
  useEffect(() => {
    const start = prev.current;
    const delta = value - start;
    if (delta === 0) return;
    const started = Date.now();
    const id = setInterval(() => {
      const progress = Math.min(1, (Date.now() - started) / duration);
      setDisplay(Math.round(start + delta * easeOutCubic(progress)));
      if (progress >= 1) { clearInterval(id); prev.current = value; }
    }, 16);
    return () => clearInterval(id);
  }, [value, duration]);
  return <Text>{display.toLocaleString()}</Text>;
}
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
```

Apply to: `CHECKED IN` count, `REMAINING` count, `Total: N`, Event Hub's
`registered` / `attending` / capacity-ring percentage label.

### 2.3 Typography consistency pass

**Effort:** ~1.5 h. **Impact:** ★★☆☆☆

```bash
rg 'fontSize:\s*\d' mobile/src/screens mobile/src/ui
```

Every hit should map to `type.*`. Current offenders (rough list):

- `ActiveEventsScreen`: `fontSize: 28` (hero title) → `type.titleLg`
- `GuestListScreen`: `fontSize: 28` (event title), `fontSize: 30` (stat number)
- `SettingsScreen`: ad-hoc values in `STITCH` block
- `ScanTicketsScreen`: overlay copy

If a value has no token match (e.g. the 30-px stat number), add a new token
rather than keeping raw values.

### 2.4 Modal presentation audit

**Effort:** ~30 min. **Impact:** ★★☆☆☆

Check `mobile/src/navigation/MainStackNavigator.tsx` — make sure the
`Settings` route has `presentation: 'modal'` (or `'formSheet'` on iOS 17+).
Without it, Settings slides in horizontally like a push, not up like a
modal, which reads as "another page" instead of "a profile sheet".

### 2.5 Keyboard avoidance

**Effort:** ~1 h. **Impact:** ★★☆☆☆

Two known cases:

- **Guest List search** — stats card gets pushed up when keyboard opens.
  Wrap the list + stats in `<KeyboardAvoidingView behavior="padding">` on
  iOS only.
- **Scan Tickets manual-entry modal** — input can end up hidden. Use
  `<KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>` inside
  the modal.

Verify on a physical iPhone SE (smallest supported) before shipping.

---

## 4. Tier 3 — nice-to-have, when time allows

### 3.1 Reduce-motion respect

```ts
import { useReduceMotion } from '../lib/useReduceMotion';
// inside components that animate
if (reduceMotion) { /* skip spring, snap instead */ }
```

Required for App Store accessibility review. Gate:
- Skeleton pulse (render static at 0.7 opacity)
- Filter sheet spring (use linear timing)
- List entry animations (remove `entering` prop)
- Capacity ring animation (draw immediately)

### 3.2 Scanner success sound

`expo install expo-av` (or `expo-audio` in newer SDKs). Bundle a 150 ms
success chirp. Short, low-latency; muted when the device is in silent mode.
Add a Profile toggle to disable.

### 3.3 Dark mode

Current `colors` is single-theme. Refactor to:

```ts
// mobile/src/theme/palettes.ts
export const lightColors = { … current values … };
export const darkColors = { surface: '#0B1220', primary: '#34C28A', … };

// mobile/src/theme/useTheme.ts
import { useColorScheme } from 'react-native';
export function useTheme() {
  const scheme = useColorScheme();
  return { colors: scheme === 'dark' ? darkColors : lightColors, space, radius, type, elevation };
}
```

Then migrate every `import { colors } from …` to `const { colors } = useTheme()`. ~20 files. Tedious but mechanical.

### 3.4 Shared-element transition (event card → event detail)

Requires `react-native-shared-element` or `reanimated` SharedTransitions API.
Highest wow, ~1 day. Do last; not critical.

---

## 5. Recommended order of attack

```
Week 1 (while waiting on V2 backend):
  Mon      Tier 1.1 Haptics        + 1.3 Press feedback
  Tue      Tier 1.2 Skeletons (all three screens)
  Wed      Tier 1.4 List entry     + 1.5 Sheet drag
           → Open Tier 1 PR, merge after review
  Thu      Tier 2.1 EmptyState (+ replace all flat-text empties)
  Fri      Tier 2.2 Capacity ring animation + CountUp

Week 2 (slack for V2 backend landing):
  Mon      Tier 2.3 Typography pass
  Tue      Tier 2.4 Modal presentation + 2.5 Keyboard avoidance
  Wed–     Tier 3 items as time allows
```

Ship Tier 1 as **one** PR (cohesive UX jump). Tier 2 items can ship
individually — each is self-contained.

---

## 6. Testing notes

For each new component, add:

- A Jest snapshot / render test in `mobile/src/ui/__tests__/` (mock
  `expo-haptics` at the setup level so haptic helpers never throw during
  tests).
- A "reduced motion" variant once Tier 3.1 lands.

For each screen migration:

- Ensure the existing screen test (where one exists — currently only
  `LoginScreen.test.tsx`) still passes.
- If adding a new screen test is cheap, prefer rendering the empty state
  and loading state rather than full data screens.

Always run the full sweep before merging:

```bash
cd mobile
npm run typecheck
npm test -- --ci
```

---

## 7. Definition of done for "polish"

The polish work is "done" when a new user, opening the app cold:

1. Sees shaped placeholders (not a spinner) within 16 ms of the screen mount.
2. Feels a tactile bump on every meaningful tap (tap, select, success, error).
3. Sees friendly empty/error states with icon + copy + recovery action.
4. Observes subtle motion on data entry (list rows, stat numbers, capacity
   ring) — never more than ~600 ms, never blocking interaction.
5. Experiences consistent press feedback across every touchable.
6. Can drag-dismiss any bottom sheet (no learned "Modal close" button hunt).
7. Has their `reduce motion` setting honored.

Backend-dependent flourishes (real ticket QR, resend-email button, draft
filter, cover photo in hero card) stay gated behind the V2 plan.
