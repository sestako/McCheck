import * as Sentry from '@sentry/react-native';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';

import { AuthProvider } from './src/context/AuthContext';
import { initObservability } from './src/lib/observability';
import { RootNavigator } from './src/navigation/RootNavigator';

function App() {
  useEffect(() => {
    initObservability();
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <AuthProvider>
        <RootNavigator />
        <StatusBar style="dark" />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

export default Sentry.wrap(App);

const styles = StyleSheet.create({
  root: { flex: 1 },
});
