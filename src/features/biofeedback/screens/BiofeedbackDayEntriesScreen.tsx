//src\features\biofeedback\screens\BiofeedbackDayEntriesScreen.tsx

import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BiofeedbackEntry } from '../types/biofeedback-entry.types';
import { listBiofeedbackEntriesByDateKeyFromFirestore } from '../data/firebase-biofeedback-read-repository';
import { testFirebaseConnection } from '../../../lib/testFirebase';
import { auth } from '../../../lib/firebase';
import { mapFirebaseBiofeedbackEntryToDomain } from '../data/biofeedback-entry.mapper';

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
    async function loadFromFirebase() {
      try {
        await testFirebaseConnection();

        const result = await listBiofeedbackEntriesByDateKeyFromFirestore(dateKey);
        console.log('FIREBASE DAY DATA:', result);

        const mapped = result.map((entry) =>
          mapFirebaseBiofeedbackEntryToDomain(entry, {
            userId: auth.currentUser?.uid ?? '',
          }),
        );
        setEntries(mapped);
      } catch (e) {
        console.log('FIREBASE LOAD FAILED:', e);
      }
    }

    void loadFromFirebase();
  }, [dateKey])
);

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
