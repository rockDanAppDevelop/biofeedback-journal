//src\features\biofeedback\screens\BiofeedbackDayEntriesScreen.tsx

import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { listBiofeedbackEntries } from '../data/biofeedback-entry.repository';
import { BiofeedbackEntry } from '../types/biofeedback-entry.types';

type Props = {
  dateKey: string;
};

function formatEntryTime(measuredAt: string): string {
  const date = new Date(measuredAt);

  return new Intl.DateTimeFormat('he-IL', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

export default function BiofeedbackDayEntriesScreen({ dateKey }: Props) {
  const [entries, setEntries] = useState<BiofeedbackEntry[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadEntries();
    }, [dateKey]),
  );

  async function loadEntries() {
    const allEntries = await listBiofeedbackEntries();
    const filtered = allEntries
      .filter((entry) => entry.dateKey === dateKey)
      .sort((a, b) => a.measuredAt.localeCompare(b.measuredAt));

    setEntries(filtered);
  }

  function handleEntryPress(entryId: string) {
    router.push(`/entries/${entryId}?fromDay=${dateKey}`);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>{dateKey}</Text>
        <Text style={styles.subtitle}>מדידות היום</Text>

        {entries.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>אין מדידות ביום הזה</Text>
          </View>
        ) : (
          entries.map((entry) => (
            <Pressable
              key={entry.id}
              style={styles.card}
              onPress={() => handleEntryPress(entry.id)}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{entry.exerciseName}</Text>
                <Text style={styles.cardTime}>{formatEntryTime(entry.measuredAt)}</Text>
              </View>

              <Text style={styles.rowText}>משך: {entry.durationMinutes} דקות</Text>
              <Text style={styles.rowText}>
                HRV: {entry.hrvDistribution.stressPercent ?? '-'} /{' '}
                {entry.hrvDistribution.midRangePercent ?? '-'} /{' '}
                {entry.hrvDistribution.relaxationPercent ?? '-'}
              </Text>
              <Text style={styles.rowText}>
                RLX: {entry.rlx.startValue ?? '-'} → {entry.rlx.endValue ?? '-'}
              </Text>

              {entry.notes ? (
                <Text style={styles.notesText} numberOfLines={2}>
                  הערות: {entry.notes}
                </Text>
              ) : null}
            </Pressable>
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
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 16,
  },
  emptyState: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 14,
    padding: 18,
    backgroundColor: '#fafafa',
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
  },
  card: {
    borderWidth: 1,
    borderColor: '#dcdcdc',
    borderRadius: 14,
    padding: 14,
    backgroundColor: '#fafafa',
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    flexShrink: 1,
    marginLeft: 12,
  },
  cardTime: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e4f8a',
  },
  rowText: {
    fontSize: 15,
    marginBottom: 6,
    color: '#222222',
  },
  notesText: {
    marginTop: 6,
    fontSize: 14,
    color: '#555555',
  },
});