// src\features\biofeedback\screens\BiofeedbackDashboardScreen.tsx

import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import FloatingAddButton from '../components/FloatingAddButton';
import MonthGrid from '../components/MonthGrid';
import { listBiofeedbackEntries } from '../data/biofeedback-entry.repository';

import { exportBiofeedbackEntriesAsJson } from '../data/biofeedback-entry.export';

function getMonthTitle(date: Date): string {
  return new Intl.DateTimeFormat('he-IL', {
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function addMonths(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

export default function BiofeedbackDashboardScreen() {
  const [entryDateKeys, setEntryDateKeys] = useState<string[]>([]);
  const [referenceDate, setReferenceDate] = useState(() => new Date());

  useFocusEffect(
    useCallback(() => {
      loadEntries();
    }, []),
  );

  async function loadEntries() {
    const entries = await listBiofeedbackEntries();
    const uniqueDateKeys = Array.from(new Set(entries.map((entry) => entry.dateKey)));
    setEntryDateKeys(uniqueDateKeys);
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

    async function handleExportData() {
    try {
      await exportBiofeedbackEntriesAsJson();
    } catch {
      Alert.alert('שגיאה', 'ייצוא הנתונים נכשל.');
    }
  }

  const monthTitle = useMemo(() => getMonthTitle(referenceDate), [referenceDate]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
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

                <Pressable style={styles.exportButton} onPress={handleExportData}>
          <Text style={styles.exportButtonText}>ייצוא נתונים</Text>
        </Pressable>

        <MonthGrid
          referenceDate={referenceDate}
          entryDateKeys={entryDateKeys}
          onDayPress={handleDayPress}
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