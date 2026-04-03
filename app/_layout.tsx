// app\_layout.tsx

import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="entries/new" options={{ title: 'הוספת מדידה' }} />
        <Stack.Screen name="entries/[entryId]" options={{ title: 'פרטי מדידה' }} />
        <Stack.Screen name="day/[dateKey]" options={{ title: 'רשומות יום' }} />
      </Stack>
    </SafeAreaProvider>
  );
}