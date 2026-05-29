// app\_layout.tsx

import { Stack } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import { configureGoogleSignInIfSupported } from '../src/features/auth/api/google-sign-in-adapter';
import { registerPlannedReminderRetryListener } from '../src/features/notifications/lib/planned-reminder-retry';

function AppStack() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="dashboard" options={{ headerShown: false }} />
      <Stack.Screen name="planning" options={{ headerShown: false }} />
      <Stack.Screen name="weekly-summary" options={{ headerShown: false }} />
      <Stack.Screen name="reminder-settings" options={{ headerShown: false }} />
      <Stack.Screen name="monitoring-schedules/new" options={{ headerShown: false }} />
      <Stack.Screen name="routines/new" options={{ headerShown: false }} />
      <Stack.Screen name="routines/[routineId]" options={{ headerShown: false }} />
      <Stack.Screen name="routines/[routineId]/add-item" options={{ headerShown: false }} />
      <Stack.Screen name="entries/new" options={{ headerShown: false }} />
      <Stack.Screen name="entries/[entryId]" options={{ headerShown: false }} />
      <Stack.Screen
        name="day/[dateKey]"
        options={{ headerShown: false }}
      />
      <Stack.Screen name="export" options={{ headerShown: false }} />
      <Stack.Screen name="custom-activities/manage" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    void configureGoogleSignInIfSupported(
      '400338054941-alqp94935irb3av0n7ce28sqkoq16qmm.apps.googleusercontent.com',
    );
  }, []);

  useEffect(() => {
    let unregister: (() => void) | null = null;
    let isActive = true;

    void registerPlannedReminderRetryListener()
      .then((nextUnregister) => {
        if (!isActive) {
          nextUnregister();
          return;
        }

        unregister = nextUnregister;
      })
      .catch((error) => {
        console.warn('PLANNED REMINDER RETRY LISTENER SETUP FAILED:', error);
      });

    return () => {
      isActive = false;
      unregister?.();
    };
  }, []);

  return (
    <SafeAreaProvider>
      {Platform.OS === 'web' ? (
        <View style={styles.webShell}>
          <View style={styles.webAppContainer}>
            <AppStack />
          </View>
        </View>
      ) : (
        <AppStack />
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  webShell: {
    flex: 1,
    backgroundColor: '#eef2f7',
  },
  webAppContainer: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    flex: 1,
    backgroundColor: '#ffffff',
  },
});
