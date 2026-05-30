import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { MonitoringScheduleCardSummary } from '../lib/monitoring-schedule-summary';

type Props = {
  summaries: MonitoringScheduleCardSummary[];
  onStartMonitoring: () => void;
  onManageMonitoring: () => void;
};

export default function MorningMonitoringCardSection({
  summaries,
  onStartMonitoring,
  onManageMonitoring,
}: Props) {
  if (summaries.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <Text style={styles.title}>ניטור בוקר</Text>

      {summaries.map((summary) => (
        <View
          key={summary.scheduleId}
          style={[
            styles.card,
            summary.status === 'scheduled'
              ? styles.cardScheduled
              : summary.status === 'due'
                ? styles.cardDue
                : styles.cardPending,
          ]}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>
              {summary.status === 'pending'
                ? 'ממתין לביצוע'
                : summary.status === 'due'
                  ? 'הגיע הזמן לניטור'
                  : 'מתוכנן להיום'}
            </Text>
            <View style={styles.stateBadge}>
              <Text style={styles.stateBadgeText}>{summary.status}</Text>
            </View>
          </View>

          <Text style={styles.meta}>{`תדירות: ${summary.frequencyLabel}`}</Text>
          <Text style={styles.meta}>
            {summary.lastCompletedDateKey
              ? `ניטור אחרון: ${summary.lastCompletedDateKey}`
              : 'ניטור אחרון: עדיין אין'}
          </Text>
          <Text style={styles.meta}>
            {summary.pendingSinceDateKey
              ? `ממתין מאז: ${summary.pendingSinceDateKey}`
              : `ניטור הבא החל מ־ ${summary.nextDueDateKey}`}
          </Text>
          {summary.overdueDays !== null && summary.overdueDays > 0 ? (
            <Text style={styles.meta}>{`באיחור: ${summary.overdueDays} ימים`}</Text>
          ) : null}

          <Pressable style={styles.manageButton} onPress={onManageMonitoring}>
            <Text style={styles.manageButtonText}>ניהול ניטור</Text>
          </Pressable>

          <Pressable style={styles.actionButton} onPress={onStartMonitoring}>
            <Text style={styles.actionButtonText}>בצע ניטור</Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 6,
    marginBottom: 18,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#243447',
    textAlign: 'right',
    marginBottom: 10,
  },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  cardScheduled: {
    borderColor: '#d7dce5',
    backgroundColor: '#f6f7f9',
  },
  cardDue: {
    borderColor: '#e0c27a',
    backgroundColor: '#fff8e5',
  },
  cardPending: {
    borderColor: '#c8b6e8',
    backgroundColor: '#f6f0ff',
  },
  cardHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 8,
  },
  cardTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#243447',
    textAlign: 'right',
  },
  stateBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d7dce5',
  },
  stateBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4b5563',
  },
  meta: {
    fontSize: 13,
    color: '#5b6b7d',
    textAlign: 'right',
    marginBottom: 12,
  },
  manageButton: {
    alignSelf: 'flex-end',
    minHeight: 38,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#c8b6e8',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  manageButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5e35b1',
  },
  actionButton: {
    alignSelf: 'flex-end',
    minHeight: 38,
    borderRadius: 10,
    backgroundColor: '#ede7f6',
    borderWidth: 1,
    borderColor: '#c8b6e8',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5e35b1',
  },
});
