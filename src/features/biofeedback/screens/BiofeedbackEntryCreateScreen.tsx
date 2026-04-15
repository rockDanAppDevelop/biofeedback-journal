// src\features\biofeedback\screens\BiofeedbackEntryCreateScreen.tsx

import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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
import type { UserCustomActivity } from '../types/user-custom-activity.types';

import { useEffect } from 'react';
import { testFirebaseConnection } from '../../../lib/testFirebase';
import { addBiofeedbackEntryToFirestore } from '../data/firebase-biofeedback-repository';
import {
  addCustomActivityToFirestore,
  listActiveCustomActivitiesFromFirestore,
} from '../data/firebase-custom-activities-repository';

import {
  ACTIVITY_CATALOG,
  type ActivityCatalogItem,
  type ActivityCategoryId,
  type ActivityParameterFieldId,
} from '../constants/activity-catalog';

type Props = {
  initialDateKey?: string;
};

type MapperSaveInput = ReturnType<typeof toCreateBiofeedbackEntryInput> & {
  measurementType?: 'hrv' | 'rlx' | null;
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
  const [showExtraHrvFields, setShowExtraHrvFields] = useState(false);
  const [showExtraRlxFields, setShowExtraRlxFields] = useState(false);
  const [customActivities, setCustomActivities] = useState<UserCustomActivity[]>([]);
  const [isLoadingCustomActivities, setIsLoadingCustomActivities] = useState(false);
  const [hasLoadedCustomActivities, setHasLoadedCustomActivities] = useState(false);

  const categoryOptions = useMemo(
    () => [
      ...CATEGORY_DISPLAY_ORDER.filter((categoryId) =>
        ACTIVITY_CATALOG.some((item) => item.categoryId === categoryId && item.isActive),
      ).map((categoryId) => ({
        id: categoryId,
        label: CATEGORY_LABELS[categoryId],
      })),
      {
        id: 'custom' as const,
        label: CATEGORY_LABELS.custom,
      },
    ],
    [],
  );

  useEffect(() => {
    if (
      values.selectedCategoryId !== 'custom' ||
      hasLoadedCustomActivities ||
      isLoadingCustomActivities
    ) {
      return;
    }

    let isCancelled = false;

    async function loadCustomActivities() {
      setIsLoadingCustomActivities(true);

      try {
        const items = await listActiveCustomActivitiesFromFirestore();

        if (!isCancelled) {
          console.log('CUSTOM ACTIVITIES LOADED:', items);
          setCustomActivities(items);
          setHasLoadedCustomActivities(true);
        }
      } catch (error) {
        console.error('FAILED TO LOAD CUSTOM ACTIVITIES:', error);
      } finally {
        if (!isCancelled) {
          setIsLoadingCustomActivities(false);
        }
      }
    }

    void loadCustomActivities();

    return () => {
      isCancelled = true;
    };
  }, [values.selectedCategoryId, hasLoadedCustomActivities]);

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

  const isMonitoring =
    values.selectedCategoryId === 'monitoring' ||
    selectedCatalogItem?.activityType === 'monitoring';

  const isCustomTraining = values.selectedCategoryId === 'custom';
  const isParameterizedTraining = selectedCatalogItem?.exerciseType === 'parameterized';

  const finalMeasurementTypeForUI =
    isMonitoring
      ? 'none'
      : isCustomTraining
        ? values.customMeasurementType || null
        : selectedCatalogItem?.measurementType ?? null;

  const shouldShowHrvFields =
    !isMonitoring &&
    (
      finalMeasurementTypeForUI === null ||
      finalMeasurementTypeForUI === 'hrv' ||
      finalMeasurementTypeForUI === 'none' ||
      showExtraHrvFields
    );

  const shouldShowRlxFields =
    !isMonitoring &&
    (
      finalMeasurementTypeForUI === null ||
      finalMeasurementTypeForUI === 'rlx' ||
      finalMeasurementTypeForUI === 'none' ||
      showExtraRlxFields
    );

  const errors = useMemo(() => validateBiofeedbackEntryForm(values), [values]);

  function updateField<K extends keyof typeof values>(key: K, value: (typeof values)[K]) {
    setValues((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function resetActivitySpecificFields(nextCategoryId: typeof values.selectedCategoryId) {
    setValues((current) => ({
      ...current,
      selectedCategoryId: nextCategoryId,
      selectedCatalogItemId: '',
      userCustomActivityId: '',
      exerciseName: nextCategoryId === 'custom' ? current.exerciseName : '',
      customExerciseName: '',
      customMeasurementType: '',
      breathingInhale: '',
      breathingHoldAfterInhale: '',
      breathingExhale: '',
      breathingHoldAfterExhale: '',
      monitoringType: '',
    }));
    setShowExtraHrvFields(false);
    setShowExtraRlxFields(false);
  }

  function handleCategorySelect(categoryId: ActivityCategoryId) {
    resetActivitySpecificFields(categoryId);
  }

  function handleCatalogItemSelect(item: ActivityCatalogItem) {
    setValues((current) => ({
      ...current,
      selectedCatalogItemId: item.id,
      exerciseName: item.label,
      customExerciseName: '',
      customMeasurementType: '',
      monitoringType:
        item.activityType === 'monitoring' ? item.monitoringType : '',
    }));

    if (item.activityType === 'monitoring') {
      setShowExtraHrvFields(false);
      setShowExtraRlxFields(false);
    }
  }

  function handleExistingCustomActivitySelect(activity: UserCustomActivity) {
    setValues((current) => ({
      ...current,
      userCustomActivityId: activity.id,
      customExerciseName: activity.label,
      exerciseName: activity.label,
      customMeasurementType: activity.measurementType,
    }));
  }

  function handleStartNewCustomActivity() {
    setValues((current) => ({
      ...current,
      userCustomActivityId: '',
      customExerciseName: '',
      exerciseName: '',
      customMeasurementType: '',
    }));
  }

  function getParameterFieldValue(fieldId: ActivityParameterFieldId): string {
    switch (fieldId) {
      case 'inhale':
        return values.breathingInhale;
      case 'holdAfterInhale':
        return values.breathingHoldAfterInhale;
      case 'exhale':
        return values.breathingExhale;
      case 'holdAfterExhale':
        return values.breathingHoldAfterExhale;
    }
  }

  function updateParameterField(fieldId: ActivityParameterFieldId, text: string) {
    switch (fieldId) {
      case 'inhale':
        updateField('breathingInhale', text);
        return;
      case 'holdAfterInhale':
        updateField('breathingHoldAfterInhale', text);
        return;
      case 'exhale':
        updateField('breathingExhale', text);
        return;
      case 'holdAfterExhale':
        updateField('breathingHoldAfterExhale', text);
        return;
    }
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
      const input = toCreateBiofeedbackEntryInput(values) as MapperSaveInput;

      console.log('BEFORE FIREBASE SAVE');

      const firebaseId = await addBiofeedbackEntryToFirestore({
        measurementDate: values.measurementDate,
        measurementTime: values.measurementTime,
        dateKey: values.measurementDate,
        measuredAt: input.measuredAt,
        exerciseName: input.exerciseName,
        measurementType: input.measurementType ?? null,
        activity: input.activity,
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

      if (
        values.selectedCategoryId === 'custom' &&
        values.userCustomActivityId === '' &&
        values.customExerciseName.trim() !== '' &&
        values.customMeasurementType !== ''
      ) {
        const alreadyExists = customActivities.some(
          (activity) =>
            activity.label.trim() === values.customExerciseName.trim() &&
            activity.measurementType === values.customMeasurementType,
        );

        if (!alreadyExists) {
          const savedCustomActivity = await addCustomActivityToFirestore({
            label: values.customExerciseName.trim(),
            measurementType: values.customMeasurementType,
          });

          setCustomActivities((current) => [savedCustomActivity, ...current]);
        }
      }

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

  const builtInCategoryOptions = [
    { id: 'trainers', iconName: CATEGORY_ICONS.trainers },
    { id: 'relaxation', iconName: CATEGORY_ICONS.relaxation },
    { id: 'guided', iconName: CATEGORY_ICONS.guided },
    { id: 'monitoring', iconName: CATEGORY_ICONS.monitoring },
  ]
    .map((category) => {
      const option = categoryOptions.find((item) => item.id === category.id);

      return option ? { ...option, iconName: category.iconName } : null;
    })
    .filter((option) => option !== null);

  const customCategoryOption = categoryOptions.find((option) => option.id === 'custom') ?? null;

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

            <Text style={styles.label}>קטגוריה</Text>

            <View style={styles.categoryTopRow}>
              {builtInCategoryOptions.map((option) => {
                const isSelected = values.selectedCategoryId === option.id;

                return (
                  <Pressable
                    key={option.id}
                    onPress={() => handleCategorySelect(option.id)}
                    style={styles.categoryCircleItem}
                  >
                    <View
                      style={[
                        styles.categoryCircleButton,
                        isSelected && styles.categoryCircleButtonSelected,
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={option.iconName}
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
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {customCategoryOption ? (
              <Pressable
                onPress={() => handleCategorySelect(customCategoryOption.id)}
                style={[
                  styles.customCategoryButton,
                  values.selectedCategoryId === 'custom' && styles.customCategoryButtonSelected,
                ]}
              >
                <Text
                  style={[
                    styles.customCategoryButtonText,
                    values.selectedCategoryId === 'custom' &&
                      styles.customCategoryButtonTextSelected,
                  ]}
                >
                  {customCategoryOption.label}
                </Text>
              </Pressable>
            ) : null}

            {values.selectedCategoryId !== '' && !isCustomTraining ? (
              <>
                <Text style={styles.label}>פעילות</Text>

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

            {isCustomTraining ? (
              <>
                {isLoadingCustomActivities ? (
                  <Text style={styles.label}>טוען פעילויות שמורות...</Text>
                ) : customActivities.length > 0 ? (
                  <>
                    <Text style={styles.label}>פעילויות שמורות</Text>
                    <View style={styles.exerciseOptionsContainer}>
                      {customActivities.map((activity) => {
                        const isSelected = values.userCustomActivityId === activity.id;

                        return (
                          <Pressable
                            key={activity.id}
                            onPress={() => handleExistingCustomActivitySelect(activity)}
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
                              {activity.label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>

                    <Pressable
                      onPress={handleStartNewCustomActivity}
                      style={styles.secondarySectionToggle}
                    >
                      <Text style={styles.secondarySectionToggleText}>יצירת פעילות חדשה</Text>
                    </Pressable>
                  </>
                ) : null}
                <Text style={styles.label}>שם התרגיל</Text>
                <TextInput
                  value={values.customExerciseName}
                  onChangeText={(text) => {
                    updateField('customExerciseName', text);
                    updateField('exerciseName', text);
                  }}
                  style={styles.input}
                  placeholder="כתבו שם לתרגיל האישי"
                />
                {errors.customExerciseName ? (
                  <Text style={styles.errorText}>{errors.customExerciseName}</Text>
                ) : null}

                <Text style={styles.label}>סוג מדידה</Text>
                <View style={styles.exerciseOptionsContainer}>
                  {[
                    { id: 'hrv', label: 'HRV' },
                    { id: 'rlx', label: 'RLX' },
                    { id: 'none', label: 'ללא' },
                  ].map((option) => {
                    const isSelected = values.customMeasurementType === option.id;

                    return (
                      <Pressable
                        key={option.id}
                        onPress={() =>
                          updateField(
                            'customMeasurementType',
                            option.id as typeof values.customMeasurementType,
                          )
                        }
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
                {errors.customMeasurementType ? (
                  <Text style={styles.errorText}>{errors.customMeasurementType}</Text>
                ) : null}
              </>
            ) : null}

            {selectedCatalogItem && !isMonitoring ? (
              <View style={styles.measurementTypeInfoBox}>
                <Text style={styles.measurementTypeInfoLabel}>סוג מדידה שזוהה</Text>
                <Text style={styles.measurementTypeInfoValue}>
                  {finalMeasurementTypeForUI === 'hrv'
                    ? 'HRV'
                    : finalMeasurementTypeForUI === 'rlx'
                      ? 'RLX'
                      : finalMeasurementTypeForUI === 'none'
                        ? 'HRV / RLX'
                        : ''}
                </Text>
              </View>
            ) : null}

            {!isMonitoring && finalMeasurementTypeForUI === 'hrv' ? (
              <Pressable
                style={styles.secondarySectionToggle}
                onPress={() => setShowExtraRlxFields((current) => !current)}
              >
                <Text style={styles.secondarySectionToggleText}>
                  {showExtraRlxFields ? 'הסתר שדות RLX' : 'הצג גם שדות RLX'}
                </Text>
              </Pressable>
            ) : null}

            {!isMonitoring && finalMeasurementTypeForUI === 'rlx' ? (
              <Pressable
                style={styles.secondarySectionToggle}
                onPress={() => setShowExtraHrvFields((current) => !current)}
              >
                <Text style={styles.secondarySectionToggleText}>
                  {showExtraHrvFields ? 'הסתר שדות HRV' : 'הצג גם שדות HRV'}
                </Text>
              </Pressable>
            ) : null}

            {isParameterizedTraining && selectedCatalogItem?.parameterSchema ? (
              <View style={styles.parameterSection}>
                <Text style={styles.sectionTitle}>פרמטרים</Text>

                {selectedCatalogItem.parameterSchema.map((field) => {
                  const fieldError =
                    field.id === 'inhale'
                      ? errors.breathingInhale
                      : field.id === 'holdAfterInhale'
                        ? errors.breathingHoldAfterInhale
                        : field.id === 'exhale'
                          ? errors.breathingExhale
                          : errors.breathingHoldAfterExhale;

                  return (
                    <View key={field.id}>
                      <Text style={styles.label}>{field.label}</Text>
                      <TextInput
                        value={getParameterFieldValue(field.id)}
                        onChangeText={(text) => updateParameterField(field.id, text)}
                        style={styles.input}
                        keyboardType="numeric"
                        placeholder={String(field.defaultValue)}
                      />
                      {fieldError ? <Text style={styles.errorText}>{fieldError}</Text> : null}
                    </View>
                  );
                })}
              </View>
            ) : null}

            {isMonitoring && errors.monitoringType ? (
              <Text style={styles.errorText}>{errors.monitoringType}</Text>
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
  customCategoryButton: {
    borderWidth: 1,
    borderColor: '#cfcfcf',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    marginBottom: 12,
  },
  customCategoryButtonSelected: {
    borderColor: '#1e88e5',
    backgroundColor: '#e3f2fd',
  },
  customCategoryButtonText: {
    fontSize: 15,
    color: '#222222',
    fontWeight: '500',
    textAlign: 'center',
  },
  customCategoryButtonTextSelected: {
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
  parameterSection: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d6e4f5',
    backgroundColor: '#f8fbff',
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
