import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
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
          <ActivityIndicator
            size="large"
            color="#1e88e5"
            style={styles.loadingIndicator}
          />
          <Text style={styles.title}>{'\u05d8\u05d5\u05e2\u05df...'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (state === 'error') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Text style={styles.errorTitle}>
            {
              '\u05e9\u05d2\u05d9\u05d0\u05d4 \u05d1\u05d8\u05e2\u05d9\u05e0\u05ea \u05d4\u05de\u05e1\u05da'
            }
          </Text>
          <Pressable
            style={styles.retryButton}
            onPress={() => void decideStartupRoute()}
          >
            <Text style={styles.retryButtonText}>
              {'\u05e0\u05e1\u05d4 \u05e9\u05d5\u05d1'}
            </Text>
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
  loadingIndicator: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#222222',
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#222222',
    marginBottom: 24,
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
