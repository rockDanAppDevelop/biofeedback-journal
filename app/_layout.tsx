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
        <Stack.Screen name="planning" options={{ title: 'תכנון תרגולים' }} />
        <Stack.Screen name="entries/new" options={{ title: 'הוספת מדידה' }} />
        <Stack.Screen name="entries/[entryId]" options={{ title: 'פרטי מדידה' }} />
        <Stack.Screen name="day/[dateKey]" options={{ title: 'רשומות יום' }} />
        <Stack.Screen name="export" options={{ title: 'ייצוא נתונים' }} />
        <Stack.Screen name="custom-activities/manage" options={{ title: 'ניהול התרגולים שלי' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
