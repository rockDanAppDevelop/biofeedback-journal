// src\features\biofeedback\screens\BiofeedbackEntryCreateScreen.tsx

import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import DateTimeField from '../components/DateTimeField';
import { createBiofeedbackEntry } from '../data/biofeedback-entry.repository';
import { createDefaultBiofeedbackEntryFormValues } from '../forms/biofeedback-entry-form.defaults';
import { toCreateBiofeedbackEntryInput } from '../forms/biofeedback-entry-form.mapper';
import { validateBiofeedbackEntryForm } from '../forms/biofeedback-entry-form.validation';

import { useEffect } from 'react';
import { testFirebaseConnection } from '../lib/testFirebase';


type Props = {
  initialDateKey?: string;
};

export default function BiofeedbackEntryCreateScreen({ initialDateKey }: Props) {

  useEffect(() => {
  testFirebaseConnection();
}, []);

  const [values, setValues] = useState(() => {
    const defaults = createDefaultBiofeedbackEntryFormValues();

    if (initialDateKey) {
      return {
        ...defaults,
        measurementDate: initialDateKey,
      };
    }

    return defaults;
  });

  const errors = useMemo(() => validateBiofeedbackEntryForm(values), [values]);

  function updateField<K extends keyof typeof values>(key: K, value: (typeof values)[K]) {
    setValues((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function handleSave() {
    const nextErrors = validateBiofeedbackEntryForm(values);
    const hasErrors = Object.keys(nextErrors).length > 0;

    if (hasErrors) {
      Alert.alert('הטופס לא תקין', 'יש לבדוק את השדות ולתקן את הערכים.');
      return;
    }

    try {
      const input = toCreateBiofeedbackEntryInput(values);

      await createBiofeedbackEntry(input);

      Alert.alert('נשמר', 'המדידה נשמרה בהצלחה.', [
        {
          text: 'אישור',
          onPress: () => {
            setValues(() => {
              const defaults = createDefaultBiofeedbackEntryFormValues();

              if (initialDateKey) {
                return {
                  ...defaults,
                  measurementDate: initialDateKey,
                };
              }

              return defaults;
            });

            router.back();
          },
        },
      ]);
    } catch {
      Alert.alert('שגיאה', 'שמירת המדידה נכשלה.');
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>הוספת מדידת ביופידבק</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>פרטי מדידה</Text>

            <DateTimeField
              label="תאריך"
              value={values.measurementDate}
              mode="date"
              onChangeValue={(nextValue) => updateField('measurementDate', nextValue)}
            />
            {errors.measurementDate ? (
              <Text style={styles.errorText}>{errors.measurementDate}</Text>
            ) : null}

            <DateTimeField
              label="שעה"
              value={values.measurementTime}
              mode="time"
              onChangeValue={(nextValue) => updateField('measurementTime', nextValue)}
            />
            {errors.measurementTime ? (
              <Text style={styles.errorText}>{errors.measurementTime}</Text>
            ) : null}

            <Text style={styles.label}>סוג תרגיל / מדידה</Text>
            <TextInput
              value={values.exerciseName}
              onChangeText={(text) => updateField('exerciseName', text)}
              style={styles.input}
            />
            {errors.exerciseName ? (
              <Text style={styles.errorText}>{errors.exerciseName}</Text>
            ) : null}

            <Text style={styles.label}>משך בדקות</Text>
            <TextInput
              value={String(values.durationMinutes)}
              onChangeText={(text) => updateField('durationMinutes', Number(text) || 0)}
              style={styles.input}
              keyboardType="numeric"
            />
            {errors.durationMinutes ? (
              <Text style={styles.errorText}>{errors.durationMinutes}</Text>
            ) : null}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>HRV</Text>

            <Text style={styles.label}>אחוז זמן בטווח לחץ</Text>
            <TextInput
              value={values.hrvStressPercent}
              onChangeText={(text) => updateField('hrvStressPercent', text)}
              style={styles.input}
              keyboardType="numeric"
            />
            {errors.hrvStressPercent ? (
              <Text style={styles.errorText}>{errors.hrvStressPercent}</Text>
            ) : null}

            <Text style={styles.label}>אחוז זמן בטווח ביניים</Text>
            <TextInput
              value={values.hrvMidRangePercent}
              onChangeText={(text) => updateField('hrvMidRangePercent', text)}
              style={styles.input}
              keyboardType="numeric"
            />
            {errors.hrvMidRangePercent ? (
              <Text style={styles.errorText}>{errors.hrvMidRangePercent}</Text>
            ) : null}

            <Text style={styles.label}>אחוז זמן בטווח רגיעה</Text>
            <TextInput
              value={values.hrvRelaxationPercent}
              onChangeText={(text) => updateField('hrvRelaxationPercent', text)}
              style={styles.input}
              keyboardType="numeric"
            />
            {errors.hrvRelaxationPercent ? (
              <Text style={styles.errorText}>{errors.hrvRelaxationPercent}</Text>
            ) : null}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>RLX</Text>

            <Text style={styles.label}>ערך התחלתי</Text>
            <TextInput
              value={values.rlxStartValue}
              onChangeText={(text) => updateField('rlxStartValue', text)}
              style={styles.input}
              keyboardType="numeric"
            />
            {errors.rlxStartValue ? (
              <Text style={styles.errorText}>{errors.rlxStartValue}</Text>
            ) : null}

            <Text style={styles.label}>ערך סיום</Text>
            <TextInput
              value={values.rlxEndValue}
              onChangeText={(text) => updateField('rlxEndValue', text)}
              style={styles.input}
              keyboardType="numeric"
            />
            {errors.rlxEndValue ? (
              <Text style={styles.errorText}>{errors.rlxEndValue}</Text>
            ) : null}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>הערות</Text>
            <TextInput
              value={values.notes}
              onChangeText={(text) => updateField('notes', text)}
              style={[styles.input, styles.notesInput]}
              multiline
              textAlignVertical="top"
            />
          </View>
        </ScrollView>

        <View style={styles.floatingActionBar}>
          <Pressable style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>שמור</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  screen: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 120,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
  },
  section: {
    marginBottom: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#dcdcdc',
    borderRadius: 12,
    backgroundColor: '#fafafa',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    marginBottom: 6,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#cfcfcf',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    marginBottom: 8,
  },
  notesInput: {
    minHeight: 110,
  },
  errorText: {
    color: '#c62828',
    marginBottom: 8,
  },
  floatingActionBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
  },
  saveButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#43a047',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
  },
});