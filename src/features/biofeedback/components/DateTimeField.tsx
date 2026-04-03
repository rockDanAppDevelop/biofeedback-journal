//src\features\biofeedback\components\DateTimeField.tsx

import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  label: string;
  value: string;
  mode: 'date' | 'time';
  onChangeValue: (nextValue: string) => void;
};

function parseValueToDate(value: string, mode: 'date' | 'time'): Date {
  const now = new Date();

  if (mode === 'date') {
    const [year, month, day] = value.split('-').map(Number);

    if (!year || !month || !day) {
      return now;
    }

    return new Date(year, month - 1, day);
  }

  const [hours, minutes] = value.split(':').map(Number);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return now;
  }

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

function formatDateValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function formatTimeValue(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${hours}:${minutes}`;
}

export default function DateTimeField({ label, value, mode, onChangeValue }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  function handleChange(event: DateTimePickerEvent, selectedDate?: Date) {
    if (Platform.OS !== 'ios') {
      setIsOpen(false);
    }

    if (event.type === 'dismissed' || !selectedDate) {
      return;
    }

    onChangeValue(mode === 'date' ? formatDateValue(selectedDate) : formatTimeValue(selectedDate));
  }

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>

      <Pressable style={styles.field} onPress={() => setIsOpen(true)}>
        <Text style={styles.value}>{value}</Text>
      </Pressable>

      {isOpen ? (
        <DateTimePicker
          value={parseValueToDate(value, mode)}
          mode={mode}
          display="default"
          is24Hour
          onChange={handleChange}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    marginBottom: 6,
    fontWeight: '500',
  },
  field: {
    borderWidth: 1,
    borderColor: '#cfcfcf',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
  },
  value: {
    fontSize: 16,
    color: '#222222',
  },
});

