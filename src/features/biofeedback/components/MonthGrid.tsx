//src\features\biofeedback\components\MonthGrid.tsx

import { Pressable, StyleSheet, Text, View } from 'react-native';

import { toDateKey } from './calendar.utils';

type CalendarDay = {
  dateKey: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  hasEntry: boolean;
};

type MonthGridProps = {
  referenceDate: Date;
  entryDateKeys: string[];
  onDayPress: (dateKey: string) => void;
};

function buildMonthDays(referenceDate: Date, entryDateKeys: string[]): CalendarDay[] {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const startDay = firstDayOfMonth.getDay();
  const mondayBasedStartDay = startDay === 0 ? 6 : startDay - 1;

  const days: CalendarDay[] = [];

  for (let i = mondayBasedStartDay; i > 0; i--) {
    const date = new Date(year, month, 1 - i);
    const dateKey = toDateKey(date);

    days.push({
      dateKey,
      dayNumber: date.getDate(),
      isCurrentMonth: false,
      hasEntry: entryDateKeys.includes(dateKey),
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
    });

    nextDay += 1;
  }

  return days;
}

const weekDayLabels = ['ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳', 'א׳'];

export default function MonthGrid({
  referenceDate,
  entryDateKeys,
  onDayPress,
}: MonthGridProps) {
  const monthDays = buildMonthDays(referenceDate, entryDateKeys);
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
    gap: 8,
  },
  dayCell: {
    width: '12.9%',
    aspectRatio: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d9d9d9',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellOutsideMonth: {
    backgroundColor: '#f3f3f3',
    borderColor: '#ececec',
  },
  dayCellDone: {
    backgroundColor: '#43a047',
    borderColor: '#43a047',
  },
  dayCellToday: {
    borderWidth: 2,
    borderColor: '#1e88e5',
  },
  dayText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222222',
  },
  dayTextOutsideMonth: {
    color: '#aaaaaa',
  },
  dayTextDone: {
    color: '#ffffff',
  },
});