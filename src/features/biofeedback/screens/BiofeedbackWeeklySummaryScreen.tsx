import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { toDateKey } from '../components/calendar.utils';
import { listAllBiofeedbackEntriesFromFirestore } from '../data/firebase-biofeedback-read-repository';
import { getWeeklySummary } from '../lib/weekly-summary';
import { BiofeedbackEntry } from '../types/biofeedback-entry.types';

function formatDateKeyForRange(dateKey: string): string {
  const [year, month, day] = dateKey.split('-');

  if (!year || !month || !day) {
    return dateKey;
  }

  return `${day}.${month}`;
}

type SummaryCardProps = {
  title: string;
  value: string;
  subtitle?: string;
};

function SummaryCard({ title, value, subtitle }: SummaryCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardValue}>{value}</Text>
      {subtitle ? <Text style={styles.cardSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export default function BiofeedbackWeeklySummaryScreen() {
  const [entries, setEntries] = useState<BiofeedbackEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadEntries() {
        try {
          setIsLoading(true);
          setErrorMessage('');

          const nextEntries = await listAllBiofeedbackEntriesFromFirestore();

          if (!isActive) {
            return;
          }

          setEntries(nextEntries);
        } catch (error) {
          if (!isActive) {
            return;
          }

          console.log('WEEKLY SUMMARY LOAD FAILED:', error);
          setErrorMessage('לא הצלחנו לטעון את נתוני השבוע כרגע.');
        } finally {
          if (isActive) {
            setIsLoading(false);
          }
        }
      }

      void loadEntries();

      return () => {
        isActive = false;
      };
    }, []),
  );

  const todayDateKey = toDateKey(new Date());
  const summary = useMemo(
    () => getWeeklySummary(entries, todayDateKey),
    [entries, todayDateKey],
  );
  const hasWeeklyEntries = summary.totalEntries > 0;
  const weekRangeText =
    `${formatDateKeyForRange(summary.weekStartDateKey)} - ` +
    formatDateKeyForRange(summary.weekEndDateKey);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>סיכום שבועי</Text>
        <Text style={styles.subtitle}>{weekRangeText}</Text>

        {isLoading ? (
          <View style={styles.stateCard}>
            <ActivityIndicator size="small" color="#1e4f8a" />
            <Text style={styles.stateText}>טוען את נתוני השבוע...</Text>
          </View>
        ) : errorMessage ? (
          <View style={styles.stateCard}>
            <Text style={styles.stateText}>{errorMessage}</Text>
          </View>
        ) : !hasWeeklyEntries ? (
          <View style={styles.stateCard}>
            <Text style={styles.emptyTitle}>עדיין אין תרגולים השבוע</Text>
            <Text style={styles.stateText}>כשתהיה פעילות, הסיכום השבועי יופיע כאן.</Text>
          </View>
        ) : (
          <View style={styles.cardsContainer}>
            <SummaryCard title="ימים מתורגלים" value={`${summary.daysWithEntries} / 7`} />
            <SummaryCard title="מספר תרגולים" value={String(summary.totalEntries)} />
            <SummaryCard title="דקות תרגול" value={String(summary.totalDurationMinutes)} />
            {summary.totalRlxSessions > 0 ? (
              <SummaryCard
                title="דקות שהסתיימו רגוע יותר"
                value={String(summary.totalMinutesImproved)}
                subtitle={`${summary.rlxImprovedCount} מתוך ${summary.totalRlxSessions} תרגולי RLX`}
              />
            ) : null}
            {summary.averageRelaxationPercent !== null ? (
              <SummaryCard
                title="ממוצע אחוז זמן ברגיעה"
                value={`${Math.round(summary.averageRelaxationPercent)}%`}
              />
            ) : null}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#243447',
    textAlign: 'right',
  },
  subtitle: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'right',
    marginTop: 6,
    marginBottom: 20,
  },
  cardsContainer: {
    gap: 12,
  },
  card: {
    backgroundColor: '#f8fbff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d7e3f4',
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5b6b7d',
    textAlign: 'right',
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e4f8a',
    textAlign: 'right',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'right',
    marginTop: 8,
  },
  stateCard: {
    minHeight: 160,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d7e3f4',
    backgroundColor: '#f8fbff',
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateText: {
    fontSize: 15,
    color: '#4b5563',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 22,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#243447',
    textAlign: 'center',
    marginBottom: 8,
  },
});
