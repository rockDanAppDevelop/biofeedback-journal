//src\features\biofeedback\components\DaysStrip.tsx

import { StyleSheet, Text, View } from 'react-native';

function getLastDays(count: number) {
  const days = [];
  const today = new Date();

  for (let i = count - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);

    days.push({
      date: d,
      dateKey: d.toISOString().slice(0, 10),
      label: d.getDate(),
    });
  }

  return days;
}

export default function DaysStrip() {
  const days = getLastDays(7);

  return (
    <View style={styles.container}>
      {days.map((day) => {
        const hasEntry = Math.random() > 0.5;

        return (
          <View
            key={day.dateKey}
            style={[
              styles.day,
              hasEntry ? styles.dayDone : styles.dayMissing,
            ]}
          >
            <Text style={styles.dayText}>{day.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  day: {
    flex: 1,
    aspectRatio: 1,
    minWidth: 36,
    maxWidth: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayDone: {
    backgroundColor: '#43a047',
  },
  dayMissing: {
    backgroundColor: '#e53935',
  },
  dayText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 18,
  },
});