import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { toDateKey } from '../components/calendar.utils';
import { hasBiofeedbackEntryForDateKeyFromFirestore } from '../data/firebase-biofeedback-read-repository';
import BiofeedbackDashboardScreen from './BiofeedbackDashboardScreen';

type StartupState = 'loading' | 'ready' | 'error';

export default function BiofeedbackStartupDecisionScreen() {
  const [state, setState] = useState<StartupState>('loading');

  useEffect(() => {
    void decideStartupRoute();
  }, []);

  async function decideStartupRoute() {
    try {
      setState('loading');

      const todayDateKey = toDateKey(new Date());
      const hasEntryToday =
        await hasBiofeedbackEntryForDateKeyFromFirestore(todayDateKey);

      if (hasEntryToday) {
        setState('ready');
        return;
      }

      router.replace(`/entries/new?dateKey=${todayDateKey}`);
    } catch (error) {
      console.error('STARTUP DECISION FAILED:', error);
      setState('error');
    }
  }

  if (state === 'loading') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Text style={styles.title}>טוען...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (state === 'error') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Text style={styles.title}>שגיאה בטעינת המסך</Text>
          <Pressable style={styles.retryButton} onPress={() => void decideStartupRoute()}>
            <Text style={styles.retryButtonText}>נסה שוב</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return <BiofeedbackDashboardScreen />;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#222222',
    marginBottom: 16,
  },
  retryButton: {
    minWidth: 120,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#1e88e5',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
