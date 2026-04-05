//src\features\biofeedback\screens\BiofeedbackDayEntriesScreen.tsx

import { router, useFocusEffect } from 'expo-router';
import { useEffect, useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { listBiofeedbackEntries } from '../data/biofeedback-entry.repository';
import { BiofeedbackEntry } from '../types/biofeedback-entry.types';
import { listBiofeedbackEntriesByDateKeyFromFirestore } from '../data/firebase-biofeedback-read-repository';
import { testFirebaseConnection } from '../../../lib/testFirebase';
import type { TimeOfDay } from '../types/biofeedback-entry.types';
import { auth } from '../../../lib/firebase';

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

function toOptionalNumber(value: string): number | null {
  if (!value.trim()) {
    return null;
  }

  return Number(value);
}

function mapTimeToTimeOfDay(time: string): TimeOfDay {
  const hour = Number(time.split(':')[0]);

  if (hour < 12) return 'morning';
  if (hour < 17) return 'noon';
  if (hour < 21) return 'evening';
  return 'night';
}

function mapFirebaseEntryToBiofeedbackEntry(entry: {
  id: string;
  measurementDate: string;
  measurementTime: string;
  
  dateKey: string;
  measuredAt: string;
  exerciseName: string;
  measurementType?: 'hrv' | 'rlx' | null;
  durationMinutes: number;
  hrvStressPercent: string;
  hrvMidRangePercent: string;
  hrvRelaxationPercent: string;
  rlxStartValue: string;
  rlxEndValue: string;
  notes: string;
  createdAt: string;
}): BiofeedbackEntry {
  return {
    id: entry.id,
    userId: auth.currentUser?.uid ?? '',
    dateKey: entry.dateKey,
    measuredAt: entry.measuredAt,
    measurementType: (entry as any).measurementType ?? null,
    timeOfDay: mapTimeToTimeOfDay(entry.measurementTime),
    createdAt: entry.createdAt,
    updatedAt: entry.createdAt,
    exerciseName: entry.exerciseName,
    durationMinutes: entry.durationMinutes,
    notes: entry.notes,
    hrvDistribution: {
  stressPercent: toOptionalNumber(entry.hrvStressPercent),
  midRangePercent: toOptionalNumber(entry.hrvMidRangePercent),
  relaxationPercent: toOptionalNumber(entry.hrvRelaxationPercent),
},
rlx: {
  startValue: toOptionalNumber(entry.rlxStartValue),
  endValue: toOptionalNumber(entry.rlxEndValue),
},
  };
}

export default function BiofeedbackDayEntriesScreen({ dateKey }: Props) {
  const [entries, setEntries] = useState<BiofeedbackEntry[]>([]);

  useFocusEffect(
  useCallback(() => {
    async function loadFromFirebase() {
      try {
        await testFirebaseConnection();

        const result = await listBiofeedbackEntriesByDateKeyFromFirestore(dateKey);
        console.log('FIREBASE DAY DATA:', result);

        const mapped = result.map(mapFirebaseEntryToBiofeedbackEntry);
        setEntries(mapped);
      } catch (e) {
        console.log('FIREBASE LOAD FAILED:', e);
      }
    }

    void loadFromFirebase();
  }, [dateKey])
);

/*   useFocusEffect(
    useCallback(() => {
      loadEntries();
    }, [dateKey]),
  ); */

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
        <View style={styles.headerRow}>
  <Pressable
    style={styles.addButton}
    onPress={() => router.push(`/entries/new?dateKey=${dateKey}`)}
  >
    <Text style={styles.addButtonText}>＋</Text>
  </Pressable>

  <View style={styles.headerTextBlock}>
    <Text style={styles.title}>{dateKey}</Text>
    <Text style={styles.subtitle}>מדידות היום</Text>
  </View>
</View>

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
                <View style={styles.titleRow}>
  <Text style={styles.cardTitle}>{entry.exerciseName}</Text>

  {entry.measurementType ? (
    <View
      style={[
        styles.measurementBadge,
        entry.measurementType === 'hrv'
          ? styles.measurementBadgeHrv
          : styles.measurementBadgeRlx,
      ]}
    >
      <Text style={styles.measurementBadgeText}>
        {entry.measurementType === 'hrv' ? 'HRV' : 'RLX'}
      </Text>
    </View>
  ) : null}
</View>
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
    headerRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTextBlock: {
    flex: 1,
    marginLeft: 12,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1e88e5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 24,
  },
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
    marginBottom: 0,
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
  titleRow: {
  flexDirection: 'row-reverse',
  alignItems: 'center',
  gap: 8,
},

measurementBadge: {
  paddingHorizontal: 8,
  paddingVertical: 4,
  borderRadius: 6,
},

measurementBadgeHrv: {
  backgroundColor: '#e3f2fd',
},

measurementBadgeRlx: {
  backgroundColor: '#e8f5e9',
},

measurementBadgeText: {
  fontSize: 12,
  fontWeight: '700',
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