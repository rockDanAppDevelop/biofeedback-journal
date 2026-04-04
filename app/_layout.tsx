// app\_layout.tsx

import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

export default function RootLayout() {
  useEffect(() => {
  GoogleSignin.configure({
    webClientId: '400338054941-alqp94935irb3av0n7ce28sqkoq16qmm.apps.googleusercontent.com',
  });
}, []);
  return (
    <SafeAreaProvider>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="entries/new" options={{ title: 'הוספת מדידה' }} />
        <Stack.Screen name="entries/[entryId]" options={{ title: 'פרטי מדידה' }} />
        <Stack.Screen name="day/[dateKey]" options={{ title: 'רשומות יום' }} />
        <Stack.Screen name="export" options={{ title: 'ייצוא נתונים' }} />
      </Stack>
    </SafeAreaProvider>
  );
}