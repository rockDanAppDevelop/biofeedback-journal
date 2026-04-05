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
  firstSeenDateKey: string;
};

function buildMonthDays(referenceDate: Date, entryDateKeys: string[]): CalendarDay[] {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const todayKey = toDateKey(new Date());

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
  firstSeenDateKey,
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
const isAfterFirstSeen = firstSeenDateKey !== '' && day.dateKey >= firstSeenDateKey;
const isPastDay = day.dateKey < todayKey;
const isEligibleCurrentMonthDay = day.isCurrentMonth && isAfterFirstSeen && isPastDay;
const shouldShowMissed = isEligibleCurrentMonthDay && !day.hasEntry;
          return (
            <Pressable
              key={day.dateKey}
              onPress={() => onDayPress(day.dateKey)}
              style={[
  styles.dayCell,
  !day.isCurrentMonth && styles.dayCellOutsideMonth,
  day.hasEntry && styles.dayCellDone,
  shouldShowMissed && styles.dayCellMissed,
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

{shouldShowMissed ? <View style={styles.missedDot} /> : null}
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
  borderRadius: 12,
  borderWidth: 1,
  borderColor: '#e2e2e2',
  backgroundColor: '#ffffff',
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
dayCellMissed: {
  position: 'relative',
},
missedDot: {
  position: 'absolute',
  bottom: 7,
  width: 5,
  height: 5,
  borderRadius: 2.5,
  backgroundColor: '#d96b6b',
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