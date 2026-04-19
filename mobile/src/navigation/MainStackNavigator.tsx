import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { ActiveEventsScreen } from '../screens/ActiveEventsScreen';
import { EventDetailScreen } from '../screens/EventDetailScreen';
import { GuestListScreen } from '../screens/GuestListScreen';
import { ScanTicketsScreen } from '../screens/ScanTicketsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { colors } from '../theme/tokens';
import type { MainStackParamList } from './types';

const Stack = createNativeStackNavigator<MainStackParamList>();

/**
 * Single main stack — no bottom tab bar.
 *
 * Every screen renders its own `StitchHeader` (see `docs/stitch-ref/*.html`),
 * so we disable the native stack header globally to avoid double headers.
 *
 * `Settings` is presented modally — it's a detour (profile + sign out + env
 * info), not part of the event check-in flow. Reached from the
 * `HeaderProfileButton` on `ActiveEvents`.
 */
const stackScreenOptions = {
  headerShown: false as const,
  contentStyle: { backgroundColor: colors.surface },
};

export function MainStackNavigator() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="ActiveEvents" component={ActiveEventsScreen} />
      <Stack.Screen name="EventDetail" component={EventDetailScreen} />
      <Stack.Screen name="GuestList" component={GuestListScreen} />
      <Stack.Screen name="ScanTickets" component={ScanTicketsScreen} />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ presentation: 'modal' }}
      />
    </Stack.Navigator>
  );
}
