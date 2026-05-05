import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Sharing from 'expo-sharing';
import { SafeAreaView } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';

import { toDateKey } from '../components/calendar.utils';
import { listAllBiofeedbackEntriesFromFirestore } from '../data/firebase-biofeedback-read-repository';
import { getWeeklySummary } from '../lib/weekly-summary';
import { BiofeedbackEntry } from '../types/biofeedback-entry.types';
import BiofeedbackHeader from '../components/BiofeedbackHeader';

function formatDateKeyForRange(dateKey: string): string {
  const [year, month, day] = dateKey.split('-');

  if (!year || !month || !day) {
    return dateKey;
  }

  return `${day}.${month}`;
}

function addDaysToDateKey(dateKey: string, days: number): string {
  const date = new Date(`${dateKey}T00:00:00`);
  date.setDate(date.getDate() + days);

  return toDateKey(date);
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
  const todayDateKey = toDateKey(new Date());
  const [entries, setEntries] = useState<BiofeedbackEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSharing, setIsSharing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [referenceDateKey, setReferenceDateKey] = useState(todayDateKey);
  const summaryRef = useRef<View>(null);

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

  const summary = useMemo(
    () => getWeeklySummary(entries, referenceDateKey),
    [entries, referenceDateKey],
  );
  const currentWeekSummary = useMemo(
    () => getWeeklySummary(entries, todayDateKey),
    [entries, todayDateKey],
  );
  const hasWeeklyEntries = summary.totalEntries > 0;
  const weekRangeText =
    `${formatDateKeyForRange(summary.weekStartDateKey)} - ` +
    formatDateKeyForRange(summary.weekEndDateKey);
  const canGoNextWeek = summary.weekEndDateKey < currentWeekSummary.weekEndDateKey;
  const canShareSummary = !isLoading && !errorMessage && hasWeeklyEntries && !isSharing;

  const handleGoToPreviousWeek = useCallback(() => {
    setReferenceDateKey((currentDateKey) => addDaysToDateKey(currentDateKey, -7));
  }, []);

  const handleGoToNextWeek = useCallback(() => {
    setReferenceDateKey((currentDateKey) => {
      const nextDateKey = addDaysToDateKey(currentDateKey, 7);
      const nextSummary = getWeeklySummary(entries, nextDateKey);

      if (nextSummary.weekEndDateKey > currentWeekSummary.weekEndDateKey) {
        return currentDateKey;
      }

      return nextDateKey;
    });
  }, [currentWeekSummary.weekEndDateKey, entries]);

  const handleShareWeeklySummary = useCallback(async () => {
    if (!summaryRef.current || !canShareSummary) {
      return;
    }

    try {
      setIsSharing(true);

      const canShare = await Sharing.isAvailableAsync();

      if (!canShare) {
        throw new Error('Sharing is not available on this device');
      }

      const uri = await captureRef(summaryRef.current, {
        format: 'png',
        quality: 1,
      });

      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: 'שיתוף סיכום שבועי',
      });
    } catch (error) {
      console.log('WEEKLY SUMMARY SHARE FAILED:', error);
    } finally {
      setIsSharing(false);
    }
  }, [canShareSummary]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <BiofeedbackHeader variant="screen" title="סיכום שבועי" />

        <View ref={summaryRef} collapsable={false} style={styles.summaryCaptureArea}>
          <Text style={styles.title}>סיכום שבועי</Text>
          <Text style={styles.subtitle}>{weekRangeText}</Text>

          <View style={styles.weekNavigation}>
            <Pressable style={styles.weekNavButton} onPress={handleGoToPreviousWeek}>
              <Text style={styles.weekNavButtonText}>שבוע קודם</Text>
            </Pressable>

            <Pressable
              style={[
                styles.weekNavButton,
                !canGoNextWeek ? styles.weekNavButtonDisabled : null,
              ]}
              onPress={handleGoToNextWeek}
              disabled={!canGoNextWeek}
            >
              <Text style={styles.weekNavButtonText}>שבוע הבא</Text>
            </Pressable>
          </View>

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
                  title="שיפור בתרגולי RLX"
                  value={`${summary.rlxImprovedCount} מתוך ${summary.totalRlxSessions}`}
                  subtitle="תרגולי RLX הסתיימו בשיפור"
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
        </View>

        <Pressable
          style={[styles.shareButton, !canShareSummary ? styles.shareButtonDisabled : null]}
          onPress={handleShareWeeklySummary}
          disabled={!canShareSummary}
        >
          <Text style={styles.shareButtonText}>
            {isSharing ? 'מכין תמונה לשיתוף...' : 'שיתוף סיכום שבועי'}
          </Text>
        </Pressable>
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
  summaryCaptureArea: {
    backgroundColor: '#ffffff',
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
    marginBottom: 12,
  },
  weekNavigation: {
    flexDirection: 'row-reverse',
    gap: 10,
    marginBottom: 20,
  },
  weekNavButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bfd4ee',
    backgroundColor: '#eef6ff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  weekNavButtonDisabled: {
    opacity: 0.45,
  },
  weekNavButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e4f8a',
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
  shareButton: {
    height: 48,
    borderRadius: 14,
    backgroundColor: '#1e4f8a',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  shareButtonDisabled: {
    opacity: 0.5,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
