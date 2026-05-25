//src\features\biofeedback\components\MonthGrid.tsx

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { toDateKey } from './calendar.utils';

type CalendarDay = {
  dateKey: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  hasEntry: boolean;
  hasMonitoring: boolean;
};

type MonthGridProps = {
  referenceDate: Date;
  entryDateKeys: string[];
  monitoringDateKeys: string[];
  onDayPress: (dateKey: string) => void;
  firstSeenDateKey: string;
};

function buildMonthDays(
  referenceDate: Date,
  entryDateKeys: string[],
  monitoringDateKeys: string[],
): CalendarDay[] {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const startDay = firstDayOfMonth.getDay();

  const days: CalendarDay[] = [];

  for (let i = startDay; i > 0; i--) {
    const date = new Date(year, month, 1 - i);
    const dateKey = toDateKey(date);

    days.push({
      dateKey,
      dayNumber: date.getDate(),
      isCurrentMonth: false,
      hasEntry: entryDateKeys.includes(dateKey),
      hasMonitoring: monitoringDateKeys.includes(dateKey),
    });
  }

  for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
    const date = new Date(year, month, day);
    const dateKey = toDateKey(date);

    days.push({
      dateKey,
      dayNumber: day,
      isCurrentMonth: true,
      hasEntry: entryDateKeys.includes(dateKey),
      hasMonitoring: monitoringDateKeys.includes(dateKey),
    });
  }

  let nextDay = 1;

  while (days.length % 7 !== 0) {
    const date = new Date(year, month + 1, nextDay);
    const dateKey = toDateKey(date);

    days.push({
      dateKey,
      dayNumber: date.getDate(),
      isCurrentMonth: false,
      hasEntry: entryDateKeys.includes(dateKey),
      hasMonitoring: monitoringDateKeys.includes(dateKey),
    });

    nextDay += 1;
  }

  return days;
}

const weekDayLabels = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];

export default function MonthGrid({
  referenceDate,
  entryDateKeys,
  monitoringDateKeys,
  onDayPress,
  firstSeenDateKey,
}: MonthGridProps) {
  const monthDays = buildMonthDays(referenceDate, entryDateKeys, monitoringDateKeys);
  const todayKey = toDateKey(new Date());

  return (
    <View style={styles.wrapper}>
      <View style={styles.weekHeader}>
        {weekDayLabels.map((label) => (
          <Text key={label} style={styles.weekHeaderText}>
            {label}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {monthDays.map((day) => {
          const isToday = day.dateKey === todayKey;

          return (
            <Pressable
              key={day.dateKey}
              onPress={() => onDayPress(day.dateKey)}
              style={[
                styles.dayCell,
                !day.isCurrentMonth && styles.dayCellOutsideMonth,
                day.hasEntry && styles.dayCellDone,
                isToday && styles.dayCellToday,
              ]}
            >
              <Text
                style={[
                  styles.dayText,
                  !day.isCurrentMonth && styles.dayTextOutsideMonth,
                  day.hasEntry && styles.dayTextDone,
                ]}
              >
                {day.dayNumber}
              </Text>

              {day.hasEntry ? (
                <MaterialCommunityIcons
                  name="check"
                  size={15}
                  color="#ffffff"
                  style={styles.doneIcon}
                />
              ) : null}
              {day.hasMonitoring ? (
                <View
                  style={[
                    styles.monitoringBadge,
                    day.hasEntry && styles.monitoringBadgeOnDoneDay,
                  ]}
                >
                  <MaterialCommunityIcons name="pulse" size={14} color="#6A35B8" />
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 20,
  },
  weekHeader: {
    flexDirection: 'row-reverse',
    marginBottom: 8,
  },
  weekHeaderText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  grid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.2857%',
    aspectRatio: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#dedede',
    backgroundColor: '#eeeeee',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingTop: 2,
  },
  dayCellOutsideMonth: {
    backgroundColor: '#f7f7f7',
    borderColor: '#efefef',
  },
  dayCellDone: {
    backgroundColor: '#2e7d32',
    borderColor: '#2e7d32',
  },
  dayCellToday: {
    borderWidth: 2,
    borderColor: '#1976d2',
  },
  doneIcon: {
    position: 'absolute',
    bottom: 6,
  },
  monitoringBadge: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#F1E9FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monitoringBadgeOnDoneDay: {
    backgroundColor: '#F1E9FF',
  },
  dayText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222222',
    lineHeight: 18,
  },
  dayTextOutsideMonth: {
    color: '#b8b8b8',
  },
  dayTextDone: {
    color: '#ffffff',
  },
});
