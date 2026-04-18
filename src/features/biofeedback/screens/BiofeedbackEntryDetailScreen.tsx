//src\features\biofeedback\screens\BiofeedbackEntryDetailScreen.tsx

import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
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
import {
  ACTIVITY_CATALOG,
  type ActivityCatalogItem,
  type ActivityCategoryId,
} from '../constants/activity-catalog';

type Props = {
  entryId: string;
  fromDay?: string;
};

const CATEGORY_LABELS: Record<ActivityCategoryId, string> = {
  trainers: 'מאמנים',
  relaxation: 'הרפיה',
  guided: 'מונחה',
  monitoring: 'ניטור',
  custom: 'מותאם אישית',
};

const CATEGORY_DISPLAY_ORDER: Exclude<ActivityCategoryId, 'custom'>[] = [
  'trainers',
  'relaxation',
  'guided',
  'monitoring',
];

const CATEGORY_ICONS = {
  trainers: 'whistle',
  relaxation: 'meditation',
  guided: 'flower-tulip-outline',
  monitoring: 'chart-line',
};

function toOptionalNumber(value: string): number | null {
  if (!value.trim()) {
    return null;
  }

  return Number(value);
}

function toOptionalPercent(value: string): number | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);

  if (Number.isNaN(parsed)) {
    return null;
  }

  return parsed;
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
  measurementType?: 'hrv' | 'rlx' | null;
  activity?: {
    activityType: 'training' | 'monitoring';
    catalogItemId: string | null;
    userCustomActivityId: string | null;
    measurementType: 'hrv' | 'rlx' | 'none' | null;
    customExerciseName: string | null;
    exerciseParameters: {
      inhale?: number | null;
      holdAfterInhale?: number | null;
      exhale?: number | null;
      holdAfterExhale?: number | null;
    } | null;
    monitoringType: 'morning' | 'short' | null;
  };
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
    userId: '',
    measuredAt: entry.measuredAt,
    dateKey: entry.dateKey,
    timeOfDay: mapTimeToTimeOfDay(entry.measurementTime),
    activity: entry.activity,
    exerciseName: entry.exerciseName,
    measurementType: entry.measurementType ?? null,
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
  const [isReplacingExercise, setIsReplacingExercise] = useState(false);

  const selectedCatalogItem = useMemo(
    () =>
      ACTIVITY_CATALOG.find((item) => item.id === values.selectedCatalogItemId) ?? null,
    [values.selectedCatalogItemId],
  );

  const visibleCatalogItems = useMemo(() => {
    if (
      values.selectedCategoryId === '' ||
      values.selectedCategoryId === 'custom'
    ) {
      return [];
    }

    return ACTIVITY_CATALOG.filter(
      (item) =>
        item.categoryId === values.selectedCategoryId &&
        item.isActive,
    );
  }, [values.selectedCategoryId]);

  const errors = useMemo(() => validateBiofeedbackEntryForm(values), [values]);

      useEffect(() => {
    loadEntry();
  }, [entryId]);

  async function loadEntry() {
    const entry = await getBiofeedbackEntryByIdFromFirestore(entryId);

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

  function resetExerciseSelectionFields() {
    return {
      selectedCatalogItemId: '',
      userCustomActivityId: '',
      exerciseName: '',
      customExerciseName: '',
      customMeasurementType: '',
      monitoringType: '',
    } as const;
  }

  function handleCategorySelect(categoryId: Exclude<ActivityCategoryId, 'custom'>) {
    setValues((current) => ({
      ...current,
      selectedCategoryId: categoryId,
      ...resetExerciseSelectionFields(),
    }));
  }

  function handleCatalogItemSelect(item: ActivityCatalogItem) {
    setValues((current) => ({
      ...current,
      selectedCategoryId: item.categoryId,
      ...resetExerciseSelectionFields(),
      selectedCatalogItemId: item.id,
      exerciseName: item.label,
      monitoringType:
        item.activityType === 'monitoring' ? item.monitoringType : '',
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
      const payload = {
        measurementDate: values.measurementDate,
        measurementTime: values.measurementTime,
        dateKey: values.measurementDate,
        measuredAt: input.measuredAt,
        exerciseName: values.exerciseName.trim(),
        measurementType: input.activity?.measurementType ?? null,
        durationMinutes: Number(values.durationMinutes),
        hrvStressPercent: values.hrvStressPercent.trim(),
        hrvMidRangePercent: values.hrvMidRangePercent.trim(),
        hrvRelaxationPercent: values.hrvRelaxationPercent.trim(),
        rlxStartValue: values.rlxStartValue.trim(),
        rlxEndValue: values.rlxEndValue.trim(),
        notes: values.notes.trim(),
      };

      await updateBiofeedbackEntryInFirestore(entryId, payload);

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

        <View style={styles.exerciseSummaryCard}>
          <Text style={styles.exerciseSummaryLabel}>התרגיל הנוכחי</Text>
          <Text style={styles.exerciseSummaryValue}>{values.exerciseName || 'ללא תרגיל'}</Text>
          {(values.customMeasurementType !== '' || selectedCatalogItem?.measurementType) ? (
            <Text style={styles.exerciseSummaryMeta}>
              סוג מדידה:{' '}
              {values.customMeasurementType !== ''
                ? values.customMeasurementType.toUpperCase()
                : selectedCatalogItem?.measurementType.toUpperCase()}
            </Text>
          ) : null}
          <Pressable
            style={styles.changeExerciseButton}
            onPress={() => setIsReplacingExercise(true)}
          >
            <Text style={styles.changeExerciseButtonText}>החלף תרגיל</Text>
          </Pressable>
        </View>

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

          {isReplacingExercise ? (
            <>
              <Text style={styles.label}>קטגוריה</Text>

              <Pressable
                style={styles.closeReplaceExerciseButton}
                onPress={() => setIsReplacingExercise(false)}
              >
                <Text style={styles.closeReplaceExerciseButtonText}>סגור החלפת תרגיל</Text>
              </Pressable>

              <View style={styles.categoryTopRow}>
                {CATEGORY_DISPLAY_ORDER.map((categoryId) => {
                  const isSelected = values.selectedCategoryId === categoryId;

                  return (
                    <Pressable
                      key={categoryId}
                      onPress={() => handleCategorySelect(categoryId)}
                      style={styles.categoryCircleItem}
                    >
                      <View
                        style={[
                          styles.categoryCircleButton,
                          isSelected && styles.categoryCircleButtonSelected,
                        ]}
                      >
                        <MaterialCommunityIcons
                          name={CATEGORY_ICONS[categoryId]}
                          size={24}
                          color={isSelected ? '#0d47a1' : '#46607a'}
                        />
                      </View>
                      <Text
                        style={[
                          styles.categoryCircleLabel,
                          isSelected && styles.categoryCircleLabelSelected,
                        ]}
                      >
                        {CATEGORY_LABELS[categoryId]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.label}>תרגיל</Text>
              <View style={styles.exerciseOptionsContainer}>
                {visibleCatalogItems.map((item) => {
                  const isSelected = values.selectedCatalogItemId === item.id;

                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => handleCatalogItemSelect(item)}
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
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
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
  exerciseSummaryCard: {
    marginBottom: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#d6e4f5',
    borderRadius: 12,
    backgroundColor: '#f8fbff',
  },
  exerciseSummaryLabel: {
    fontSize: 12,
    color: '#46607a',
    marginBottom: 4,
  },
  exerciseSummaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1b2a3a',
    marginBottom: 6,
  },
  exerciseSummaryMeta: {
    fontSize: 13,
    color: '#46607a',
    marginBottom: 12,
  },
  changeExerciseButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d6e4f5',
    backgroundColor: '#ffffff',
  },
  changeExerciseButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e4f8a',
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
  categoryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  categoryCircleItem: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  categoryCircleButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 1,
    borderColor: '#cfcfcf',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  categoryCircleButtonSelected: {
    borderColor: '#1e88e5',
    backgroundColor: '#e3f2fd',
  },
  categoryCircleLabel: {
    fontSize: 12,
    color: '#222222',
    fontWeight: '500',
    textAlign: 'center',
  },
  categoryCircleLabelSelected: {
    color: '#0d47a1',
    fontWeight: '700',
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
  closeReplaceExerciseButton: {
    alignSelf: 'flex-start',
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d6e4f5',
    backgroundColor: '#f8fbff',
  },
  closeReplaceExerciseButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e4f8a',
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
