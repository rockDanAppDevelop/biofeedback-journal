// src\features\biofeedback\screens\BiofeedbackDashboardScreen.tsx

import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import FloatingAddButton from '../components/FloatingAddButton';
import MonthGrid from '../components/MonthGrid';
import { toDateKey } from '../components/calendar.utils';
import { getStreakInsight } from '../lib/streak-insight';

import { collection, getDocs } from 'firebase/firestore';
import { testFirebaseConnection } from '../../../lib/testFirebase';
import { auth, db } from '../../../lib/firebase';
import { UserMenu } from '../../auth/components/UserMenu';
import { getCurrentUserProfile } from '../../auth/data/get-current-user-profile';
import { syncDailyReminderForToday } from '../../notifications/lib/daily-reminder';

function getMonthTitle(date: Date): string {
  return new Intl.DateTimeFormat('he-IL', {
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function addMonths(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function formatStreakDays(count: number): string {
  const dayLabel = count === 1 ? 'יום' : 'ימים';

  return `${count} ${dayLabel}`;
}

export default function BiofeedbackDashboardScreen() {
  const [entryDateKeys, setEntryDateKeys] = useState<string[]>([]);
  const [firstSeenDateKey, setFirstSeenDateKey] = useState('');
  const [referenceDate, setReferenceDate] = useState(() => new Date());

  useFocusEffect(
    useCallback(() => {
      void loadEntries();
    }, []),
  );

  async function loadEntries() {
    try {
      await testFirebaseConnection();

      const user = auth.currentUser;

      if (!user) {
        console.log('DASHBOARD LOAD FAILED: No authenticated user');
        setEntryDateKeys([]);
        return;
      }

      const profile = await getCurrentUserProfile();
      setFirstSeenDateKey(profile?.firstSeenDateKey ?? '');

      const entriesCollection = collection(db, 'users', user.uid, 'entries');
      const snapshot = await getDocs(entriesCollection);

      const uniqueDateKeys = Array.from(
        new Set(
          snapshot.docs
            .map((docSnapshot) => docSnapshot.data().dateKey)
            .filter((value): value is string => typeof value === 'string' && value.length > 0),
        ),
      );

      setEntryDateKeys(uniqueDateKeys);
      await syncDailyReminderForToday(uniqueDateKeys.includes(toDateKey(new Date())));
    } catch (error) {
      console.log('🔥 FIRESTORE ERROR:', error);
    }
  }

  function handleDayPress(dateKey: string) {
    const hasEntryForDay = entryDateKeys.includes(dateKey);

    if (hasEntryForDay) {
      router.push(`/day/${dateKey}`);
      return;
    }

    router.push(`/entries/new?dateKey=${dateKey}`);
  }

  function handlePreviousMonth() {
    setReferenceDate((current) => addMonths(current, -1));
  }

  function handleNextMonth() {
    setReferenceDate((current) => addMonths(current, 1));
  }

  function handleGoToToday() {
    setReferenceDate(new Date());
  }

  const monthTitle = useMemo(() => getMonthTitle(referenceDate), [referenceDate]);
  const streakInsight = useMemo(
    () => getStreakInsight(entryDateKeys, toDateKey(new Date())),
    [entryDateKeys],
  );
  const streakInsightText = useMemo(() => {
    switch (streakInsight.kind) {
      case 'active':
        return `🔥 ${formatStreakDays(streakInsight.streakCount)} ברצף`;
      case 'keep-going':
        return `🔥 ${formatStreakDays(streakInsight.streakCount)} ברצף · בוא נשמור על הרצף`;
      case 'restart':
        return `🔄 הרצף האחרון: ${formatStreakDays(streakInsight.lastStreakCount)} · מתחילים מחדש היום`;
      case 'empty':
        return '✨ היום הוא התחלה טובה לתרגול קטן';
    }
  }, [streakInsight]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <UserMenu />

        <Text style={styles.monthTitle}>{monthTitle}</Text>

        <View style={styles.navigationRow}>
          <Pressable style={styles.navButton} onPress={handleNextMonth}>
            <Text style={styles.navButtonText}>◀</Text>
          </Pressable>

          <Pressable style={styles.todayButton} onPress={handleGoToToday}>
            <Text style={styles.todayButtonText}>היום</Text>
          </Pressable>

          <Pressable style={styles.navButton} onPress={handlePreviousMonth}>
            <Text style={styles.navButtonText}>▶</Text>
          </Pressable>
        </View>

        <Pressable
          style={styles.exportButton}
          onPress={() => router.push('/export')}
        >
          <Text style={styles.exportButtonText}>ייצוא נתונים</Text>
        </Pressable>

        <Pressable
          style={styles.secondaryActionButton}
          onPress={() => router.push('/weekly-summary')}
        >
          <Text style={styles.secondaryActionButtonText}>סיכום שבועי</Text>
        </Pressable>

        <View style={styles.dailyStatusCard}>
          <Text style={styles.dailyStatusLabel}>היום שלך</Text>
          <Text style={styles.dailyStatusMessage}>{streakInsightText}</Text>
        </View>

        <MonthGrid
          referenceDate={referenceDate}
          entryDateKeys={entryDateKeys}
          onDayPress={handleDayPress}
          firstSeenDateKey={firstSeenDateKey}
        />

        <FloatingAddButton />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  exportButton: {
    height: 44,
    borderRadius: 12,
    backgroundColor: '#f3f6fb',
    borderWidth: 1,
    borderColor: '#d7e3f4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  exportButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e4f8a',
  },
  secondaryActionButton: {
    height: 40,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d7e3f4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  secondaryActionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#355f93',
  },
  dailyStatusCard: {
    backgroundColor: '#eef4fb',
    borderWidth: 1,
    borderColor: '#cfdceb',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 6,
    marginBottom: 16,
  },
  dailyStatusLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    textAlign: 'right',
    marginBottom: 4,
  },
  dailyStatusMessage: {
    fontSize: 17,
    fontWeight: '700',
    color: '#243447',
    textAlign: 'right',
    lineHeight: 24,
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
    backgroundColor: '#ffffff',
  },
  monthTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  navigationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  navButton: {
    width: 52,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d0d0d0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  navButtonText: {
    fontSize: 22,
    fontWeight: '700',
  },
  todayButton: {
    minWidth: 110,
    height: 44,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: '#f3f6fb',
    borderWidth: 1,
    borderColor: '#d7e3f4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e4f8a',
  },
});
