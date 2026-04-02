//src\features\biofeedback\screens\BiofeedbackDayEntriesScreen.tsx

import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { listBiofeedbackEntries } from '../data/biofeedback-entry.repository';
import { BiofeedbackEntry } from '../types/biofeedback-entry.types';

type Props = {
  dateKey: string;
};

export default function BiofeedbackDayEntriesScreen({ dateKey }: Props) {
  const [entries, setEntries] = useState<BiofeedbackEntry[]>([]);

  useEffect(() => {
    loadEntries();
  }, [dateKey]);

  async function loadEntries() {
    const allEntries = await listBiofeedbackEntries();
    setEntries(allEntries.filter((entry) => entry.dateKey === dateKey));
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>{dateKey}</Text>

        {entries.length === 0 ? (
          <Text style={styles.emptyText}>אין מדידות ביום הזה</Text>
        ) : (
          entries.map((entry) => (
            <View key={entry.id} style={styles.card}>
              <Text style={styles.cardTitle}>{entry.exerciseName}</Text>
              <Text>שעה ביום: {entry.timeOfDay}</Text>
              <Text>משך: {entry.durationMinutes} דקות</Text>
              <Text>
                HRV: {entry.hrvDistribution.stressPercent ?? '-'} /{' '}
                {entry.hrvDistribution.midRangePercent ?? '-'} /{' '}
                {entry.hrvDistribution.relaxationPercent ?? '-'}
              </Text>
              <Text>
                RLX: {entry.rlx.startValue ?? '-'} → {entry.rlx.endValue ?? '-'}
              </Text>
              {entry.notes ? <Text>הערות: {entry.notes}</Text> : null}
            </View>
          ))
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
  },
  card: {
    borderWidth: 1,
    borderColor: '#dcdcdc',
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#fafafa',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
});