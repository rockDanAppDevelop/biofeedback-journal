// app\_layout.tsx

import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import { configureGoogleSignInIfSupported } from '../src/features/auth/api/google-sign-in-adapter';

export default function RootLayout() {
  useEffect(() => {
    void configureGoogleSignInIfSupported(
      '400338054941-alqp94935irb3av0n7ce28sqkoq16qmm.apps.googleusercontent.com',
    );
  }, []);

  return (
    <SafeAreaProvider>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="dashboard" options={{ headerShown: false }} />
        <Stack.Screen name="planning" options={{ headerShown: false }} />
        <Stack.Screen name="weekly-summary" options={{ headerShown: false }} />
        <Stack.Screen name="routines/new" options={{ title: 'רוטינה חדשה' }} />
        <Stack.Screen name="routines/[routineId]" options={{ title: 'פרטי רוטינה' }} />
        <Stack.Screen name="routines/[routineId]/add-item" options={{ title: 'הוספת תרגיל' }} />
        <Stack.Screen name="entries/new" options={{ title: 'הוספת מדידה' }} />
        <Stack.Screen name="entries/[entryId]" options={{ title: 'פרטי מדידה' }} />
        <Stack.Screen
          name="day/[dateKey]"
          options={{ headerShown: false }}
        />
        <Stack.Screen name="export" options={{ headerShown: false }} />
        <Stack.Screen name="custom-activities/manage" options={{ headerShown: false }} />
      </Stack>
    </SafeAreaProvider>
  );
}
