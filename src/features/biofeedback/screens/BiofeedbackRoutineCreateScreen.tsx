import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { toDateKey } from '../components/calendar.utils';
import DateTimeField from '../components/DateTimeField';
import { createRoutine } from '../data/firebase-routines-repository';

export default function BiofeedbackRoutineCreateScreen() {
  const todayDateKey = useMemo(() => toDateKey(new Date()), []);
  const [name, setName] = useState('');
  const [startDateKey, setStartDateKey] = useState(todayDateKey);
  const [cycleLengthDaysText, setCycleLengthDaysText] = useState('9');
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    if (isSaving) {
      return;
    }

    const trimmedName = name.trim();
    const cycleLengthDays = Number(cycleLengthDaysText);

    if (!trimmedName) {
      Alert.alert('שם רוטינה חסר', 'יש להזין שם לרוטינה.');
      return;
    }

    if (!Number.isInteger(cycleLengthDays) || cycleLengthDays <= 0) {
      Alert.alert('אורך מחזור לא תקין', 'יש להזין מספר ימים גדול מ-0.');
      return;
    }

    try {
      setIsSaving(true);

      await createRoutine({
        name: trimmedName,
        startDateKey,
        cycleLengthDays,
        items: [],
      });

      router.replace('/planning');
    } catch (error) {
      console.log('ROUTINE CREATE FAILED:', error);
      Alert.alert(
        'שמירת הרוטינה נכשלה',
        error instanceof Error ? error.message : 'לא הצלחנו לשמור את הרוטינה כרגע.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>רוטינה חדשה</Text>

        <View style={styles.section}>
          <Text style={styles.label}>שם רוטינה</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            style={styles.input}
            placeholder="לדוגמה: רוטינת ערב"
          />

          <DateTimeField
            label="תאריך התחלה"
            value={startDateKey}
            mode="date"
            onChangeValue={setStartDateKey}
          />

          <Text style={styles.label}>אורך מחזור בימים</Text>
          <TextInput
            value={cycleLengthDaysText}
            onChangeText={setCycleLengthDaysText}
            style={styles.input}
            keyboardType="numeric"
            placeholder="9"
          />
        </View>

        <Pressable
          style={[styles.saveButton, isSaving ? styles.saveButtonDisabled : null]}
          onPress={handleSave}
          disabled={isSaving}
        >
          <Text style={styles.saveButtonText}>{isSaving ? 'שומר...' : 'שמור רוטינה'}</Text>
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
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#243447',
    textAlign: 'right',
    marginBottom: 18,
  },
  section: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d7e3f4',
    backgroundColor: '#f8fbff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
    textAlign: 'right',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cfcfcf',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    marginBottom: 12,
    fontSize: 16,
    textAlign: 'right',
  },
  saveButton: {
    height: 48,
    borderRadius: 14,
    backgroundColor: '#1e4f8a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
});
