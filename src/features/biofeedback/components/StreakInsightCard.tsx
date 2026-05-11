import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { getStreakInsight } from '../lib/streak-insight';

type Props = {
  entryDateKeys: string[];
  todayDateKey: string;
};

function formatStreakDays(count: number): string {
  const dayLabel = count === 1 ? 'יום' : 'ימים';

  return `${count} ${dayLabel}`;
}

export default function StreakInsightCard({ entryDateKeys, todayDateKey }: Props) {
  const streakInsight = useMemo(
    () => getStreakInsight(entryDateKeys, todayDateKey),
    [entryDateKeys, todayDateKey],
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
    <View style={styles.dailyStatusCard}>
      <Text style={styles.dailyStatusLabel}>היום שלך</Text>
      <Text style={styles.dailyStatusMessage}>{streakInsightText}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
});
