import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { toDateKey } from './calendar.utils';

type Props = {
  weekStartDateKey: string;
  practiceEntryDateKeys: string[];
};

const weekDayLabels = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];

function addDaysToDateKey(dateKey: string, days: number): string {
  const date = new Date(`${dateKey}T00:00:00`);
  date.setDate(date.getDate() + days);

  return toDateKey(date);
}

export default function WeeklySuccessIndicator({
  weekStartDateKey,
  practiceEntryDateKeys,
}: Props) {
  const practiceEntryDateKeySet = new Set(practiceEntryDateKeys);
  const weekDays = weekDayLabels.map((label, index) => {
    const dateKey = addDaysToDateKey(weekStartDateKey, index);

    return {
      dateKey,
      label,
      hasPractice: practiceEntryDateKeySet.has(dateKey),
    };
  });
  const isFullWeekCompleted = weekDays.every((day) => day.hasPractice);

  return (
    <View style={styles.wrapper}>
      <View style={styles.row}>
        {weekDays.map((day) => (
          <View
            key={day.dateKey}
            style={[styles.dayCircle, day.hasPractice ? styles.dayCircleDone : null]}
          >
            <Text style={[styles.dayLabel, day.hasPractice ? styles.dayLabelDone : null]}>
              {day.label}
            </Text>

            {day.hasPractice ? (
              <MaterialCommunityIcons
                name="check"
                size={13}
                color="#ffffff"
                style={styles.checkIcon}
              />
            ) : null}
          </View>
        ))}

        <View
          style={[
            styles.trophyCircle,
            isFullWeekCompleted ? styles.trophyCircleDone : null,
          ]}
        >
          <MaterialCommunityIcons
            name="trophy"
            size={20}
            color={isFullWeekCompleted ? '#B7791F' : '#8a8a8a'}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 18,
  },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  dayCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#dedede',
    backgroundColor: '#eeeeee',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dayCircleDone: {
    borderColor: '#2e7d32',
    backgroundColor: '#2e7d32',
  },
  dayLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#555555',
    lineHeight: 15,
  },
  dayLabelDone: {
    color: '#ffffff',
  },
  checkIcon: {
    position: 'absolute',
    bottom: 2,
  },
  trophyCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: '#dedede',
    backgroundColor: '#eeeeee',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trophyCircleDone: {
    borderColor: '#F2C94C',
    backgroundColor: '#FFF4C2',
  },
});
