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
import { Pressable } from 'react-native';

import {
  getBiofeedbackEntryByIdFromFirestore,
  updateBiofeedbackEntryInFirestore,
  deleteBiofeedbackEntryFromFirestore,
} from '../data/firebase-biofeedback-entry-by-id-repository';

import { createDefaultBiofeedbackEntryFormValues } from '../forms/biofeedback-entry-form.defaults';
import { createBiofeedbackEntryFormValuesFromEntry } from '../forms/biofeedback-entry-form.from-entry';
import { toCreateBiofeedbackEntryInput } from '../forms/biofeedback-entry-form.mapper';
import { validateBiofeedbackEntryForm } from '../forms/biofeedback-entry-form.validation';

import DateTimeField from '../components/DateTimeField';
import type { BiofeedbackEntry, TimeOfDay } from '../types/biofeedback-entry.types';

type Props = {
  entryId: string;
  fromDay?: string;
};

function toOptionalNumber(value: string): number | null {
  if (!value.trim()) {
    return null;
  }

  return Number(value);
}

function mapTimeToTimeOfDay(time: string): TimeOfDay {
  const hour = Number(time.split(':')[0]);

  if (hour < 12) return 'morning';
  if (hour < 17) return 'noon';
  if (hour < 21) return 'evening';
  return 'night';
}

function mapFirebaseEntryToBiofeedbackEntry(entry: {
  id: string;
  measurementDate: string;
  measurementTime: string;
  dateKey: string;
  measuredAt: string;
  exerciseName: string;
  durationMinutes: number;
  hrvStressPercent: string;
  hrvMidRangePercent: string;
  hrvRelaxationPercent: string;
  rlxStartValue: string;
  rlxEndValue: string;
  notes: string;
  createdAt: string;
  updatedAt?: string;
}): BiofeedbackEntry {
  return {
    id: entry.id,
    measuredAt: entry.measuredAt,
    dateKey: entry.dateKey,
    timeOfDay: mapTimeToTimeOfDay(entry.measurementTime),
    exerciseName: entry.exerciseName,
    durationMinutes: entry.durationMinutes,
    hrvDistribution: {
      stressPercent: toOptionalNumber(entry.hrvStressPercent),
      midRangePercent: toOptionalNumber(entry.hrvMidRangePercent),
      relaxationPercent: toOptionalNumber(entry.hrvRelaxationPercent),
    },
    rlx: {
      startValue: toOptionalNumber(entry.rlxStartValue),
      endValue: toOptionalNumber(entry.rlxEndValue),
    },
    notes: entry.notes,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt ?? entry.createdAt,
  };
}

export default function BiofeedbackEntryDetailScreen({ entryId, fromDay }: Props) {
  const [values, setValues] = useState(createDefaultBiofeedbackEntryFormValues());
  const [isLoading, setIsLoading] = useState(true);

  const errors = useMemo(() => validateBiofeedbackEntryForm(values), [values]);

  useEffect(() => {
    loadEntry();
  }, [entryId]);

  async function loadEntry() {
    const entry = await getBiofeedbackEntryByIdFromFirestore(entryId);

console.log('ENTRY FROM FIREBASE:', entry);

    if (!entry) {
      Alert.alert('שגיאה', 'הרשומה לא נמצאה', [
        {
          text: 'אישור',
          onPress: () => router.back(),
        },
      ]);
      return;
    }

    const mappedEntry = mapFirebaseEntryToBiofeedbackEntry(entry);
setValues(createBiofeedbackEntryFormValuesFromEntry(mappedEntry));
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

      await updateBiofeedbackEntryInFirestore(entryId, {
  measurementDate: values.measurementDate,
  measurementTime: values.measurementTime,
  dateKey: values.measurementDate,
  measuredAt: input.measuredAt,
  exerciseName: values.exerciseName.trim(),
  durationMinutes: Number(values.durationMinutes),
  hrvStressPercent: values.hrvStressPercent.trim(),
  hrvMidRangePercent: values.hrvMidRangePercent.trim(),
  hrvRelaxationPercent: values.hrvRelaxationPercent.trim(),
  rlxStartValue: values.rlxStartValue.trim(),
  rlxEndValue: values.rlxEndValue.trim(),
  notes: values.notes.trim(),
});

      if (fromDay) {
  router.back();
  return;
}

router.replace('/');
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
            await deleteBiofeedbackEntryFromFirestore(entryId);
            router.replace('/');
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
  <Pressable style={styles.saveButton} onPress={handleUpdate}>
    <Text style={styles.saveButtonText}>שמור שינויים</Text>
  </Pressable>
</View>

<View style={styles.cancelAction}>
  <Pressable
    style={styles.cancelButton}
    onPress={() => {
      if (fromDay) {
        router.back();
        return;
      }
      router.replace('/');
    }}
  >
    <Text style={styles.cancelButtonText}>ביטול עריכה</Text>
  </Pressable>
</View>

<View style={styles.deleteAction}>
  <Pressable style={styles.deleteButton} onPress={handleDelete}>
    <Text style={styles.deleteButtonText}>מחק מדידה</Text>
  </Pressable>
</View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  saveButton: {
  height: 48,
  borderRadius: 12,
  backgroundColor: '#43a047',
  alignItems: 'center',
  justifyContent: 'center',
},

saveButtonText: {
  color: '#ffffff',
  fontSize: 16,
  fontWeight: '700',
},

cancelButton: {
  height: 48,
  borderRadius: 12,
  backgroundColor: '#eeeeee',
  alignItems: 'center',
  justifyContent: 'center',
},

cancelButtonText: {
  color: '#333333',
  fontSize: 16,
  fontWeight: '600',
},

deleteButton: {
  height: 48,
  borderRadius: 12,
  backgroundColor: '#c62828',
  alignItems: 'center',
  justifyContent: 'center',
},

deleteButtonText: {
  color: '#ffffff',
  fontSize: 16,
  fontWeight: '700',
},
    cancelAction: {
    marginTop: 12,
  },
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