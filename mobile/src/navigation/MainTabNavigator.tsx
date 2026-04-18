import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActiveEventsScreen } from '../screens/ActiveEventsScreen';
import { AttendeesHomeScreen } from '../screens/AttendeesHomeScreen';
import { EventDetailScreen } from '../screens/EventDetailScreen';
import { GuestListScreen } from '../screens/GuestListScreen';
import { ScanTicketsScreen } from '../screens/ScanTicketsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { colors, type } from '../theme/tokens';
import type { AttendeesStackParamList, EventStackParamList, MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();
const EventStack = createNativeStackNavigator<EventStackParamList>();
const AttendeesStack = createNativeStackNavigator<AttendeesStackParamList>();

const stackScreenOptions = {
  headerStyle: { backgroundColor: colors.surface },
  headerTintColor: colors.onSurface,
  headerTitleStyle: { fontWeight: '700' as const, fontSize: type.bodyLg },
  headerShadowVisible: false,
  headerBackButtonDisplayMode: 'minimal' as const,
  headerLargeTitle: false,
  headerTitleAlign: 'center' as const,
  contentStyle: { backgroundColor: colors.surface },
};

function EventStackNavigator() {
  return (
    <EventStack.Navigator screenOptions={stackScreenOptions}>
      <EventStack.Screen name="ActiveEvents" component={ActiveEventsScreen} options={{ title: 'Active events' }} />
      <EventStack.Screen name="EventDetail" component={EventDetailScreen} options={{ title: 'Event' }} />
      <EventStack.Screen name="GuestList" component={GuestListScreen} options={{ title: 'Guest list' }} />
      <EventStack.Screen name="ScanTickets" component={ScanTicketsScreen} options={{ title: 'Scan tickets' }} />
    </EventStack.Navigator>
  );
}

function AttendeesStackNavigator() {
  return (
    <AttendeesStack.Navigator screenOptions={stackScreenOptions}>
      <AttendeesStack.Screen name="AttendeesHome" component={AttendeesHomeScreen} options={{ title: 'Attendees' }} />
      <AttendeesStack.Screen name="GuestList" component={GuestListScreen} options={{ title: 'Guest list' }} />
      <AttendeesStack.Screen name="ScanTickets" component={ScanTicketsScreen} options={{ title: 'Scan tickets' }} />
    </AttendeesStack.Navigator>
  );
}

export function MainTabNavigator() {
  const insets = useSafeAreaInsets();
  const padBottom = Math.max(insets.bottom, 10);
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          paddingTop: 6,
          paddingBottom: padBottom,
          backgroundColor: colors.surfaceContainerLowest,
          borderTopColor: colors.outlineSoft,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: colors.primaryContainer,
        tabBarInactiveTintColor: colors.onSurfaceVariant,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 0.5,
          textTransform: 'uppercase',
        },
      }}
    >
      <Tab.Screen
        name="Events"
        component={EventStackNavigator}
        options={{
          tabBarLabel: 'Events',
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Attendees"
        component={AttendeesStackNavigator}
        options={{
          tabBarLabel: 'Attendees',
          tabBarIcon: ({ color, size }) => <Ionicons name="people-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          headerShown: true,
          title: 'Settings',
          headerStyle: stackScreenOptions.headerStyle,
          headerTintColor: stackScreenOptions.headerTintColor,
          headerTitleStyle: stackScreenOptions.headerTitleStyle,
          headerShadowVisible: stackScreenOptions.headerShadowVisible,
          headerTitleAlign: stackScreenOptions.headerTitleAlign,
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}
