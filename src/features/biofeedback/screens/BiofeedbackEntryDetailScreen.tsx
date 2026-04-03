//src\features\biofeedback\screens\BiofeedbackEntryDetailScreen.tsx

import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  deleteBiofeedbackEntry,
  getBiofeedbackEntryById,
  updateBiofeedbackEntry,
} from '../data/biofeedback-entry.repository';
import { createDefaultBiofeedbackEntryFormValues } from '../forms/biofeedback-entry-form.defaults';
import { createBiofeedbackEntryFormValuesFromEntry } from '../forms/biofeedback-entry-form.from-entry';
import { toCreateBiofeedbackEntryInput } from '../forms/biofeedback-entry-form.mapper';
import { validateBiofeedbackEntryForm } from '../forms/biofeedback-entry-form.validation';

type Props = {
  entryId: string;
};

export default function BiofeedbackEntryDetailScreen({ entryId }: Props) {
  const [values, setValues] = useState(createDefaultBiofeedbackEntryFormValues());
  const [isLoading, setIsLoading] = useState(true);

  const errors = useMemo(() => validateBiofeedbackEntryForm(values), [values]);

  useEffect(() => {
    loadEntry();
  }, [entryId]);

  async function loadEntry() {
    const entry = await getBiofeedbackEntryById(entryId);

    if (!entry) {
      Alert.alert('שגיאה', 'הרשומה לא נמצאה', [
        {
          text: 'אישור',
          onPress: () => router.back(),
        },
      ]);
      return;
    }

    setValues(createBiofeedbackEntryFormValuesFromEntry(entry));
    setIsLoading(false);
  }

  function updateField<K extends keyof typeof values>(key: K, value: (typeof values)[K]) {
    setValues((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function handleUpdate() {
    const nextErrors = validateBiofeedbackEntryForm(values);
    const hasErrors = Object.keys(nextErrors).length > 0;

    if (hasErrors) {
      Alert.alert('הטופס לא תקין', 'יש לבדוק את השדות ולתקן את הערכים.');
      return;
    }

    try {
      const input = toCreateBiofeedbackEntryInput(values);

      await updateBiofeedbackEntry(entryId, input);

      Alert.alert('עודכן', 'המדידה עודכנה בהצלחה.', [
        {
          text: 'אישור',
          onPress: () => router.back(),
        },
      ]);
    } catch {
      Alert.alert('שגיאה', 'עדכון המדידה נכשל.');
    }
  }

  function handleDelete() {
    Alert.alert('מחיקת מדידה', 'האם למחוק את המדידה?', [
      { text: 'ביטול', style: 'cancel' },
      {
        text: 'מחק',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteBiofeedbackEntry(entryId);
            router.back();
          } catch {
            Alert.alert('שגיאה', 'מחיקת המדידה נכשלה.');
          }
        },
      },
    ]);
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Text>טוען...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>עריכת מדידה</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>פרטי מדידה</Text>

          <Text style={styles.label}>תאריך</Text>
          <TextInput
            value={values.measurementDate}
            onChangeText={(text) => updateField('measurementDate', text)}
            style={styles.input}
            autoCapitalize="none"
            placeholder="YYYY-MM-DD"
          />
          {errors.measurementDate ? (
            <Text style={styles.errorText}>{errors.measurementDate}</Text>
          ) : null}

          <Text style={styles.label}>שעה</Text>
          <TextInput
            value={values.measurementTime}
            onChangeText={(text) => updateField('measurementTime', text)}
            style={styles.input}
            autoCapitalize="none"
            placeholder="HH:mm"
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
          {errors.exerciseName ? <Text style={styles.errorText}>{errors.exerciseName}</Text> : null}

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

          <Text style={styles.label}>אחוז זמן בטווח ביניים</Text>
          <TextInput
            value={values.hrvMidRangePercent}
            onChangeText={(text) => updateField('hrvMidRangePercent', text)}
            style={styles.input}
            keyboardType="numeric"
          />

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
          {errors.rlxStartValue ? <Text style={styles.errorText}>{errors.rlxStartValue}</Text> : null}

          <Text style={styles.label}>ערך סיום</Text>
          <TextInput
            value={values.rlxEndValue}
            onChangeText={(text) => updateField('rlxEndValue', text)}
            style={styles.input}
            keyboardType="numeric"
          />
          {errors.rlxEndValue ? <Text style={styles.errorText}>{errors.rlxEndValue}</Text> : null}
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

        <View style={styles.actions}>
          <Button title="שמור שינויים" onPress={handleUpdate} />
        </View>

        <View style={styles.deleteAction}>
          <Button title="מחק מדידה" color="#c62828" onPress={handleDelete} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
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
  actions: {
    marginTop: 8,
  },
  deleteAction: {
    marginTop: 12,
  },
});