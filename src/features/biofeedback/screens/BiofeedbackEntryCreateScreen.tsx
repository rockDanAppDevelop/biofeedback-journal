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

import { createDefaultBiofeedbackEntryFormValues } from '../forms/biofeedback-entry-form.defaults';
import { toCreateBiofeedbackEntryInput } from '../forms/biofeedback-entry-form.mapper';
import { validateBiofeedbackEntryForm } from '../forms/biofeedback-entry-form.validation';

import { useEffect } from 'react';
import { testFirebaseConnection } from '../../../lib/testFirebase';
import { addBiofeedbackEntryToFirestore } from '../data/firebase-biofeedback-repository';

import {
  EXERCISE_OPTIONS,
  type MeasurementType,
} from '../constants/exercise-options';

type Props = {
  initialDateKey?: string;
};

export default function BiofeedbackEntryCreateScreen({ initialDateKey }: Props) {


useEffect(() => {
  void testFirebaseConnection();
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

const [isSaving, setIsSaving] = useState(false);
const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
const [showExtraHrvFields, setShowExtraHrvFields] = useState(false);
const [showExtraRlxFields, setShowExtraRlxFields] = useState(false);

const selectedExerciseOption = useMemo(
  () => EXERCISE_OPTIONS.find((option) => option.id === selectedExerciseId) ?? null,
  [selectedExerciseId]
);

const inferredMeasurementType = selectedExerciseOption?.measurementType ?? null;

const shouldShowHrvFields =
  inferredMeasurementType === null ||
  inferredMeasurementType === 'hrv' ||
  showExtraHrvFields;

const shouldShowRlxFields =
  inferredMeasurementType === null ||
  inferredMeasurementType === 'rlx' ||
  showExtraRlxFields;

const errors = useMemo(() => validateBiofeedbackEntryForm(values), [values]);

  function updateField<K extends keyof typeof values>(key: K, value: (typeof values)[K]) {
    setValues((current) => ({
      ...current,
      [key]: value,
    }));
  }

 async function handleSave() {
  if (isSaving) {
    return;
  }

  console.log('HANDLE SAVE START');

  const nextErrors = validateBiofeedbackEntryForm(values);
  const hasErrors = Object.keys(nextErrors).length > 0;

  if (hasErrors) {
    Alert.alert('הטופס לא תקין', 'יש לבדוק את השדות ולתקן את הערכים.');
    return;
  }

  setIsSaving(true);

  try {
    const input = toCreateBiofeedbackEntryInput(values);

    console.log('BEFORE FIREBASE SAVE');

    const firebaseId = await addBiofeedbackEntryToFirestore({
      measurementDate: values.measurementDate,
      measurementTime: values.measurementTime,
      dateKey: values.measurementDate,
      measuredAt: input.measuredAt,
      exerciseName: values.exerciseName.trim(),
      measurementType: inferredMeasurementType,
      durationMinutes: Number(values.durationMinutes),
      hrvStressPercent: values.hrvStressPercent.trim(),
      hrvMidRangePercent: values.hrvMidRangePercent.trim(),
      hrvRelaxationPercent: values.hrvRelaxationPercent.trim(),
      rlxStartValue: values.rlxStartValue.trim(),
      rlxEndValue: values.rlxEndValue.trim(),
      notes: values.notes.trim(),
    });

    console.log('AFTER FIREBASE SAVE');
    console.log('FIREBASE SAVE SUCCESS:', firebaseId);

    setSelectedExerciseId(null);
    setShowExtraHrvFields(false);
    setShowExtraRlxFields(false);

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

    router.replace('/');
  } catch (e) {
    console.error('FIREBASE SAVE FAILED:', e);
    Alert.alert('שגיאה', 'שמירת המדידה נכשלה.');
  } finally {
    setIsSaving(false);
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

            <Text style={styles.label}>תרגיל</Text>

<View style={styles.exerciseOptionsContainer}>
  {EXERCISE_OPTIONS.map((option) => {
    const isSelected = selectedExerciseId === option.id;

    return (
      <Pressable
        key={option.id}
        onPress={() => {
          setSelectedExerciseId(option.id);
          updateField('exerciseName', option.label);
        }}
        style={[
          styles.exerciseOptionButton,
          isSelected && styles.exerciseOptionButtonSelected,
        ]}
      >
        <Text
          style={[
            styles.exerciseOptionButtonText,
            isSelected && styles.exerciseOptionButtonTextSelected,
          ]}
        >
          {option.label}
        </Text>
      </Pressable>
    );
  })}
</View>

<TextInput
  value={values.exerciseName}
  onChangeText={(text) => {
    setSelectedExerciseId(null);
    updateField('exerciseName', text);
  }}
  style={styles.input}
  placeholder="או כתבו תרגיל אחר"
/>

{errors.exerciseName ? (
  <Text style={styles.errorText}>{errors.exerciseName}</Text>
) : null}

{inferredMeasurementType ? (
  <View style={styles.measurementTypeInfoBox}>
    <Text style={styles.measurementTypeInfoLabel}>סוג מדידה שזוהה</Text>
    <Text style={styles.measurementTypeInfoValue}>
      {inferredMeasurementType === 'hrv' ? 'HRV' : 'RLX'}
    </Text>
  </View>
) : null}

{inferredMeasurementType === 'hrv' ? (
  <Pressable
    style={styles.secondarySectionToggle}
    onPress={() => setShowExtraRlxFields((current) => !current)}
  >
    <Text style={styles.secondarySectionToggleText}>
      {showExtraRlxFields ? 'הסתר שדות RLX' : 'הצג גם שדות RLX'}
    </Text>
  </Pressable>
) : null}

{inferredMeasurementType === 'rlx' ? (
  <Pressable
    style={styles.secondarySectionToggle}
    onPress={() => setShowExtraHrvFields((current) => !current)}
  >
    <Text style={styles.secondarySectionToggleText}>
      {showExtraHrvFields ? 'הסתר שדות HRV' : 'הצג גם שדות HRV'}
    </Text>
  </Pressable>
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

          {shouldShowHrvFields ? (
  <View style={[styles.section, styles.hrvSection]}>
    <Text style={[styles.sectionTitle, styles.hrvSectionTitle]}>HRV</Text>

    <View style={styles.hrvFieldBlockRelax}>
      <Text style={[styles.label, styles.hrvRelaxLabel]}>אחוז זמן בטווח רגיעה</Text>
      <TextInput
        value={values.hrvRelaxationPercent}
        onChangeText={(text) => updateField('hrvRelaxationPercent', text)}
        style={[styles.input, styles.hrvRelaxInput]}
        keyboardType="numeric"
        placeholder="הערך החשוב ביותר"
        placeholderTextColor="#7aa7d9"
      />
      {errors.hrvRelaxationPercent ? (
        <Text style={styles.errorText}>{errors.hrvRelaxationPercent}</Text>
      ) : null}
    </View>

    <View style={styles.hrvFieldBlockMid}>
      <Text style={[styles.label, styles.hrvMidLabel]}>אחוז זמן בטווח ביניים</Text>
      <TextInput
        value={values.hrvMidRangePercent}
        onChangeText={(text) => updateField('hrvMidRangePercent', text)}
        style={[styles.input, styles.hrvMidInput]}
        keyboardType="numeric"
      />
      {errors.hrvMidRangePercent ? (
        <Text style={styles.errorText}>{errors.hrvMidRangePercent}</Text>
      ) : null}
    </View>

    <View style={styles.hrvFieldBlockStress}>
      <Text style={[styles.label, styles.hrvStressLabel]}>אחוז זמן בטווח לחץ</Text>
      <TextInput
        value={values.hrvStressPercent}
        onChangeText={(text) => updateField('hrvStressPercent', text)}
        style={[styles.input, styles.hrvStressInput]}
        keyboardType="numeric"
      />
      {errors.hrvStressPercent ? (
        <Text style={styles.errorText}>{errors.hrvStressPercent}</Text>
      ) : null}
    </View>
  </View>
) : null}

          {shouldShowRlxFields ? (
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
          ) : null}

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
          <Pressable
  style={[styles.saveButton, isSaving && { opacity: 0.6 }]}
  onPress={handleSave}
  disabled={isSaving}
>
  <Text style={styles.saveButtonText}>
    {isSaving ? 'שומר...' : 'שמור'}
  </Text>
</Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    hrvSection: {
    borderColor: '#cfe3ff',
    backgroundColor: '#f4f9ff',
  },
  hrvSectionTitle: {
    color: '#0d47a1',
  },
  hrvFieldBlockRelax: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#e3f2fd',
    borderWidth: 1,
    borderColor: '#90caf9',
  },
  hrvFieldBlockMid: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f5f7fa',
    borderWidth: 1,
    borderColor: '#d6dde6',
  },
  hrvFieldBlockStress: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#fff3e0',
    borderWidth: 1,
    borderColor: '#ffcc80',
  },
  hrvRelaxLabel: {
    color: '#1565c0',
    fontWeight: '700',
  },
  hrvMidLabel: {
    color: '#546e7a',
    fontWeight: '600',
  },
  hrvStressLabel: {
    color: '#ef6c00',
    fontWeight: '700',
  },
  hrvRelaxInput: {
    borderColor: '#90caf9',
    backgroundColor: '#ffffff',
  },
  hrvMidInput: {
    borderColor: '#cfd8dc',
    backgroundColor: '#ffffff',
  },
  hrvStressInput: {
    borderColor: '#ffcc80',
    backgroundColor: '#ffffff',
  },
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
  exerciseOptionsContainer: {
  gap: 8,
  marginBottom: 12,
},
exerciseOptionButton: {
  borderWidth: 1,
  borderColor: '#cfcfcf',
  borderRadius: 10,
  paddingHorizontal: 12,
  paddingVertical: 12,
  backgroundColor: '#ffffff',
},
exerciseOptionButtonSelected: {
  borderColor: '#1e88e5',
  backgroundColor: '#e3f2fd',
},
exerciseOptionButtonText: {
  fontSize: 15,
  color: '#222222',
  fontWeight: '500',
},
exerciseOptionButtonTextSelected: {
  color: '#0d47a1',
  fontWeight: '700',
},
measurementTypeInfoBox: {
  marginBottom: 12,
  paddingHorizontal: 12,
  paddingVertical: 10,
  borderRadius: 10,
  backgroundColor: '#eef6ff',
  borderWidth: 1,
  borderColor: '#cfe3ff',
},
measurementTypeInfoLabel: {
  fontSize: 12,
  color: '#46607a',
  marginBottom: 2,
},
measurementTypeInfoValue: {
  fontSize: 16,
  fontWeight: '700',
  color: '#0d47a1',
},
secondarySectionToggle: {
  marginBottom: 12,
  paddingHorizontal: 12,
  paddingVertical: 10,
  borderRadius: 10,
  borderWidth: 1,
  borderColor: '#d6e4f5',
  backgroundColor: '#f8fbff',
},

secondarySectionToggleText: {
  fontSize: 14,
  fontWeight: '600',
  color: '#1e4f8a',
  textAlign: 'center',
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