import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors, type } from '../theme/tokens';
import { ActiveEventsScreen } from '../screens/ActiveEventsScreen';
import { EventDetailScreen } from '../screens/EventDetailScreen';
import { GuestListScreen } from '../screens/GuestListScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { ScanTicketsScreen } from '../screens/ScanTicketsScreen';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { ready, token } = useAuth();

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.surface }}>
        <ActivityIndicator
          accessibilityLabel="Loading app"
          size="large"
          color={colors.primaryContainer}
        />
      </View>
    );
  }

  const authed = Boolean(token);

  return (
    <NavigationContainer key={authed ? 'authed' : 'guest'}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.onSurface,
          headerTitleStyle: { fontWeight: '700', fontSize: type.bodyLg },
          headerShadowVisible: false,
          headerBackButtonDisplayMode: 'minimal',
          headerLargeTitle: false,
          headerTitleAlign: 'center',
          contentStyle: { backgroundColor: colors.surface },
        }}
      >
        {!authed ? (
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        ) : (
          <>
            <Stack.Screen
              name="ActiveEvents"
              component={ActiveEventsScreen}
              options={{ title: 'Active events' }}
            />
            <Stack.Screen name="EventDetail" component={EventDetailScreen} options={{ title: 'Event' }} />
            <Stack.Screen name="GuestList" component={GuestListScreen} options={{ title: 'Guest list' }} />
            <Stack.Screen name="ScanTickets" component={ScanTicketsScreen} options={{ title: 'Scan tickets' }} />
            <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
