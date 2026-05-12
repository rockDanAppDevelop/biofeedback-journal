import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BiofeedbackHeader from '../components/BiofeedbackHeader';
import {
  ACTIVITY_CATALOG,
  type ActivityCatalogItem,
  type ActivityCategoryId,
} from '../constants/activity-catalog';
import {
  addCustomActivityToFirestore,
  listActiveCustomActivitiesFromFirestore,
} from '../data/firebase-custom-activities-repository';
import {
  getRoutineTemplateById,
  updateRoutineTemplate,
} from '../data/firebase-routine-templates-repository';
import type { RoutineTemplate, RoutineTemplateItem } from '../types/routine-template.types';
import type { UserCustomActivity } from '../types/user-custom-activity.types';

type Props = {
  templateId: string;
};

const CATEGORY_LABELS: Record<ActivityCategoryId, string> = {
  trainers: 'מאמנים',
  relaxation: 'הרפיה',
  guided: 'מונחה',
  monitoring: 'ניטור',
  custom: 'מותאם אישית',
};

const BUILT_IN_CATEGORY_DISPLAY_ORDER: Exclude<ActivityCategoryId, 'custom'>[] = [
  'trainers',
  'relaxation',
  'guided',
  'monitoring',
];

const NEW_CUSTOM_ACTIVITY_ID = '__new_custom_activity__';

function createTemplateItemId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function buildExerciseParameters(item: ActivityCatalogItem): RoutineTemplateItem['exerciseParameters'] {
  if (item.activityType !== 'training' || !item.parameterSchema) {
    return null;
  }

  return item.parameterSchema.reduce<NonNullable<RoutineTemplateItem['exerciseParameters']>>(
    (parameters, field) => ({
      ...parameters,
      [field.id]: field.defaultValue,
    }),
    {},
  );
}

function normalizeTemplateItems(items: RoutineTemplateItem[]): RoutineTemplateItem[] {
  return items.map((item, index) => ({
    ...item,
    sortOrder: index,
  }));
}

export default function BiofeedbackRoutineTemplateAddItemScreen({ templateId }: Props) {
  const [template, setTemplate] = useState<RoutineTemplate | null>(null);
  const [customActivities, setCustomActivities] = useState<UserCustomActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<ActivityCategoryId | ''>('');
  const [selectedCatalogItemId, setSelectedCatalogItemId] = useState('');
  const [selectedCustomActivityId, setSelectedCustomActivityId] = useState('');
  const [newCustomExerciseName, setNewCustomExerciseName] = useState('');
  const [newCustomMeasurementType, setNewCustomMeasurementType] =
    useState<RoutineTemplateItem['measurementType'] | ''>('');
  const [newCustomDurationMinutes, setNewCustomDurationMinutes] = useState('8');
  const [templateDayNumber, setTemplateDayNumber] = useState(1);
  const hasUnsavedChanges =
    selectedCategoryId !== '' ||
    selectedCatalogItemId !== '' ||
    selectedCustomActivityId !== '' ||
    newCustomExerciseName.trim() !== '' ||
    newCustomMeasurementType !== '' ||
    newCustomDurationMinutes.trim() !== '8' ||
    templateDayNumber !== 1;

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadData() {
        if (!templateId || templateId === 'new') {
          setTemplate(null);
          setErrorMessage('יש לשמור את התבנית לפני הוספת תרגילים.');
          setIsLoading(false);
          return;
        }

        try {
          setIsLoading(true);
          setErrorMessage('');

          const [nextTemplate, nextCustomActivities] = await Promise.all([
            getRoutineTemplateById(templateId),
            listActiveCustomActivitiesFromFirestore(),
          ]);

          if (!isActive) {
            return;
          }

          if (!nextTemplate) {
            setTemplate(null);
            setErrorMessage('לא נמצאה תבנית.');
            return;
          }

          setTemplate(nextTemplate);
          setCustomActivities(nextCustomActivities);
        } catch (error) {
          if (!isActive) {
            return;
          }

          console.log('ROUTINE TEMPLATE ADD ITEM LOAD FAILED:', error);
          setErrorMessage('לא הצלחנו לטעון את נתוני התבנית כרגע.');
        } finally {
          if (isActive) {
            setIsLoading(false);
          }
        }
      }

      void loadData();

      return () => {
        isActive = false;
      };
    }, [templateId]),
  );

  const visibleCatalogItems = useMemo(() => {
    if (selectedCategoryId === '' || selectedCategoryId === 'custom') {
      return [];
    }

    return ACTIVITY_CATALOG.filter(
      (item) => item.categoryId === selectedCategoryId && item.isActive,
    );
  }, [selectedCategoryId]);

  function handleCategorySelect(categoryId: ActivityCategoryId) {
    setSelectedCategoryId(categoryId);
    setSelectedCatalogItemId('');
    setSelectedCustomActivityId('');
  }

  function navigateBackToTemplate() {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace(`/routine-templates/${templateId}`);
  }

  function handleBackPress() {
    if (isSaving) {
      return;
    }

    if (!hasUnsavedChanges) {
      navigateBackToTemplate();
      return;
    }

    Alert.alert('לצאת בלי לשמור?', 'התרגיל לא יתווסף לתבנית.', [
      { text: 'להישאר', style: 'cancel' },
      {
        text: 'לצאת בלי לשמור',
        style: 'destructive',
        onPress: navigateBackToTemplate,
      },
    ]);
  }

  async function handleSave() {
    if (isSaving || !template) {
      return;
    }

    const selectedCatalogItem =
      selectedCatalogItemId !== ''
        ? ACTIVITY_CATALOG.find((item) => item.id === selectedCatalogItemId) ?? null
        : null;
    const selectedCustomActivity =
      selectedCustomActivityId !== ''
        ? customActivities.find((activity) => activity.id === selectedCustomActivityId) ?? null
        : null;
    const isCreatingNewCustomTemplateItem =
      selectedCategoryId === 'custom' && selectedCustomActivityId === NEW_CUSTOM_ACTIVITY_ID;

    if (!selectedCatalogItem && !selectedCustomActivity && !isCreatingNewCustomTemplateItem) {
      Alert.alert('בחר תרגיל', 'יש לבחור תרגיל לתבנית.');
      return;
    }

    const trimmedNewCustomExerciseName = newCustomExerciseName.trim();
    const parsedNewCustomDurationMinutes = Number(newCustomDurationMinutes.trim());

    if (isCreatingNewCustomTemplateItem) {
      if (!trimmedNewCustomExerciseName) {
        Alert.alert('שם תרגיל חסר', 'יש להזין שם לתרגיל המותאם.');
        return;
      }

      if (!newCustomMeasurementType) {
        Alert.alert('סוג מדידה חסר', 'יש לבחור סוג מדידה לתרגיל המותאם.');
        return;
      }

      if (
        !Number.isInteger(parsedNewCustomDurationMinutes) ||
        parsedNewCustomDurationMinutes <= 0
      ) {
        Alert.alert('משך לא תקין', 'יש להזין משך בדקות כמספר שלם גדול מ-0.');
        return;
      }
    }

    try {
      setIsSaving(true);

      let savedCustomActivity: UserCustomActivity | null = null;

      if (isCreatingNewCustomTemplateItem) {
        savedCustomActivity = await addCustomActivityToFirestore({
          label: trimmedNewCustomExerciseName,
          measurementType: newCustomMeasurementType as RoutineTemplateItem['measurementType'],
        });
      }

      if (isCreatingNewCustomTemplateItem && !savedCustomActivity) {
        throw new Error('Custom activity was not created');
      }

      const nextSortOrder = template.items.length;
      let baseItem: Omit<RoutineTemplateItem, 'id' | 'dayOffset' | 'sortOrder' | 'durationMinutes'>;

      if (selectedCatalogItem) {
        baseItem = {
          activityType: selectedCatalogItem.activityType,
          measurementType: selectedCatalogItem.measurementType,
          catalogItemId: selectedCatalogItem.id,
          userCustomActivityId: null,
          customExerciseName: null,
          monitoringType:
            selectedCatalogItem.activityType === 'monitoring'
              ? selectedCatalogItem.monitoringType
              : null,
          exerciseParameters: buildExerciseParameters(selectedCatalogItem),
        };
      } else if (isCreatingNewCustomTemplateItem) {
        baseItem = {
          activityType: 'training',
          measurementType: savedCustomActivity!.measurementType,
          catalogItemId: null,
          userCustomActivityId: savedCustomActivity!.id,
          customExerciseName: savedCustomActivity!.label,
          monitoringType: null,
          exerciseParameters: null,
        };
      } else if (selectedCustomActivity) {
        baseItem = {
          activityType: 'training',
          measurementType: selectedCustomActivity.measurementType,
          catalogItemId: null,
          userCustomActivityId: selectedCustomActivity.id,
          customExerciseName: selectedCustomActivity.label,
          monitoringType: null,
          exerciseParameters: null,
        };
      } else {
        throw new Error('No template item source selected');
      }

      const nextItem: RoutineTemplateItem = {
        id: createTemplateItemId(),
        dayOffset: templateDayNumber - 1,
        sortOrder: nextSortOrder,
        durationMinutes: isCreatingNewCustomTemplateItem ? parsedNewCustomDurationMinutes : null,
        ...baseItem,
      };

      await updateRoutineTemplate(template.id, {
        items: normalizeTemplateItems([...template.items, nextItem]),
      });

      navigateBackToTemplate();
    } catch (error) {
      console.log('ROUTINE TEMPLATE ADD ITEM SAVE FAILED:', error);
      Alert.alert(
        'שמירת התרגיל נכשלה',
        error instanceof Error ? error.message : 'לא הצלחנו לשמור את התרגיל כרגע.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <BiofeedbackHeader
          variant="screen"
          title="הוספת תרגיל"
          onBackPress={handleBackPress}
        />

        {isLoading ? (
          <View style={styles.stateCard}>
            <ActivityIndicator size="small" color="#1e4f8a" />
            <Text style={styles.stateText}>טוען נתוני תבנית...</Text>
          </View>
        ) : errorMessage ? (
          <View style={styles.stateCard}>
            <Text style={styles.stateText}>{errorMessage}</Text>
          </View>
        ) : template ? (
          <>
            <Text style={styles.subtitle}>{template.name}</Text>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>פרטי תרגיל</Text>

              <Text style={styles.label}>יום בתבנית</Text>
              <View style={styles.dayStepper}>
                <Pressable
                  style={[
                    styles.dayStepperButton,
                    templateDayNumber <= 1 ? styles.dayStepperButtonDisabled : null,
                  ]}
                  onPress={() => setTemplateDayNumber((current) => Math.max(1, current - 1))}
                  disabled={templateDayNumber <= 1}
                >
                  <Text style={styles.dayStepperButtonText}>-</Text>
                </Pressable>

                <Text style={styles.dayStepperValue}>{templateDayNumber}</Text>

                <Pressable
                  style={[
                    styles.dayStepperButton,
                    templateDayNumber >= template.cycleLengthDays
                      ? styles.dayStepperButtonDisabled
                      : null,
                  ]}
                  onPress={() =>
                    setTemplateDayNumber((current) =>
                      Math.min(template.cycleLengthDays, current + 1),
                    )
                  }
                  disabled={templateDayNumber >= template.cycleLengthDays}
                >
                  <Text style={styles.dayStepperButtonText}>+</Text>
                </Pressable>
              </View>

              <Text style={styles.label}>קטגוריה</Text>
              <View style={styles.categoryTopRow}>
                {BUILT_IN_CATEGORY_DISPLAY_ORDER.map((categoryId) => {
                  const isSelected = selectedCategoryId === categoryId;

                  return (
                    <Pressable
                      key={categoryId}
                      style={styles.categoryCircleItem}
                      onPress={() => handleCategorySelect(categoryId)}
                    >
                      <View
                        style={[
                          styles.categoryCircleButton,
                          isSelected ? styles.categoryCircleButtonSelected : null,
                        ]}
                      >
                        <Text
                          style={[
                            styles.categoryCircleButtonText,
                            isSelected ? styles.categoryCircleButtonTextSelected : null,
                          ]}
                        >
                          {CATEGORY_LABELS[categoryId].slice(0, 1)}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.categoryCircleLabel,
                          isSelected ? styles.categoryCircleLabelSelected : null,
                        ]}
                      >
                        {CATEGORY_LABELS[categoryId]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Pressable
                onPress={() => handleCategorySelect('custom')}
                style={[
                  styles.customCategoryButton,
                  selectedCategoryId === 'custom' ? styles.customCategoryButtonSelected : null,
                ]}
              >
                <Text
                  style={[
                    styles.customCategoryButtonText,
                    selectedCategoryId === 'custom'
                      ? styles.customCategoryButtonTextSelected
                      : null,
                  ]}
                >
                  {CATEGORY_LABELS.custom}
                </Text>
              </Pressable>

              {selectedCategoryId !== '' && selectedCategoryId !== 'custom' ? (
                <>
                  <Text style={styles.label}>תרגיל</Text>
                  <View style={styles.exerciseOptionsContainer}>
                    {visibleCatalogItems.map((item) => {
                      const isSelected = selectedCatalogItemId === item.id;

                      return (
                        <Pressable
                          key={item.id}
                          style={[
                            styles.exerciseOptionButton,
                            isSelected ? styles.exerciseOptionButtonSelected : null,
                          ]}
                          onPress={() => setSelectedCatalogItemId(item.id)}
                        >
                          <Text
                            style={[
                              styles.exerciseOptionButtonText,
                              isSelected ? styles.exerciseOptionButtonTextSelected : null,
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

              {selectedCategoryId === 'custom' ? (
                <>
                  <Text style={styles.label}>תרגול מותאם אישית</Text>
                  <Pressable
                    style={[
                      styles.exerciseOptionButton,
                      selectedCustomActivityId === NEW_CUSTOM_ACTIVITY_ID
                        ? styles.exerciseOptionButtonSelected
                        : null,
                    ]}
                    onPress={() => setSelectedCustomActivityId(NEW_CUSTOM_ACTIVITY_ID)}
                  >
                    <Text
                      style={[
                        styles.exerciseOptionButtonText,
                        selectedCustomActivityId === NEW_CUSTOM_ACTIVITY_ID
                          ? styles.exerciseOptionButtonTextSelected
                          : null,
                      ]}
                    >
                      תרגיל מותאם חדש
                    </Text>
                  </Pressable>

                  {selectedCustomActivityId === NEW_CUSTOM_ACTIVITY_ID ? (
                    <View style={styles.newCustomForm}>
                      <Text style={styles.label}>שם תרגיל</Text>
                      <TextInput
                        value={newCustomExerciseName}
                        onChangeText={setNewCustomExerciseName}
                        style={styles.input}
                        placeholder="לדוגמה: נשימת ערב"
                      />

                      <Text style={styles.label}>סוג מדידה</Text>
                      <View style={styles.measurementTypeOptions}>
                        {([
                          { id: 'hrv', label: 'HRV' },
                          { id: 'rlx', label: 'RLX' },
                          { id: 'none', label: 'ללא' },
                        ] as const).map((option) => {
                          const isSelected = newCustomMeasurementType === option.id;

                          return (
                            <Pressable
                              key={option.id}
                              style={[
                                styles.measurementTypeButton,
                                isSelected ? styles.measurementTypeButtonSelected : null,
                              ]}
                              onPress={() => setNewCustomMeasurementType(option.id)}
                            >
                              <Text
                                style={[
                                  styles.measurementTypeButtonText,
                                  isSelected ? styles.measurementTypeButtonTextSelected : null,
                                ]}
                              >
                                {option.label}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>

                      <Text style={styles.label}>משך בדקות</Text>
                      <TextInput
                        value={newCustomDurationMinutes}
                        onChangeText={setNewCustomDurationMinutes}
                        style={styles.input}
                        keyboardType="number-pad"
                        placeholder="8"
                      />
                    </View>
                  ) : null}

                  {customActivities.length === 0 ? (
                    <Text style={styles.helperText}>אין עדיין תרגולים מותאמים אישית.</Text>
                  ) : (
                    <View style={styles.exerciseOptionsContainer}>
                      {customActivities.map((activity) => {
                        const isSelected = selectedCustomActivityId === activity.id;

                        return (
                          <Pressable
                            key={activity.id}
                            style={[
                              styles.exerciseOptionButton,
                              isSelected ? styles.exerciseOptionButtonSelected : null,
                            ]}
                            onPress={() => setSelectedCustomActivityId(activity.id)}
                          >
                            <Text
                              style={[
                                styles.exerciseOptionButtonText,
                                isSelected ? styles.exerciseOptionButtonTextSelected : null,
                              ]}
                            >
                              {activity.label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  )}
                </>
              ) : null}
            </View>

            <Pressable
              style={[styles.saveButton, isSaving ? styles.saveButtonDisabled : null]}
              onPress={handleSave}
              disabled={isSaving}
            >
              <Text style={styles.saveButtonText}>{isSaving ? 'שומר...' : 'שמור תרגיל'}</Text>
            </Pressable>
          </>
        ) : null}
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
  subtitle: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'right',
    marginTop: 6,
    marginBottom: 16,
  },
  section: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dcdcdc',
    backgroundColor: '#fafafa',
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#243447',
    textAlign: 'right',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#222222',
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
  dayStepper: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 16,
  },
  dayStepperButton: {
    width: 48,
    height: 44,
    borderWidth: 1,
    borderColor: '#bfd4ee',
    borderRadius: 12,
    backgroundColor: '#eef6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayStepperButtonDisabled: {
    opacity: 0.45,
  },
  dayStepperButtonText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1e4f8a',
  },
  dayStepperValue: {
    minWidth: 64,
    fontSize: 16,
    fontWeight: '700',
    color: '#243447',
    textAlign: 'center',
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
  categoryCircleButtonText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#46607a',
  },
  categoryCircleButtonTextSelected: {
    color: '#0d47a1',
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
    textAlign: 'right',
  },
  exerciseOptionButtonTextSelected: {
    color: '#0d47a1',
    fontWeight: '700',
  },
  newCustomForm: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d7e3f4',
    backgroundColor: '#f8fbff',
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
  },
  measurementTypeOptions: {
    flexDirection: 'row-reverse',
    gap: 8,
    marginBottom: 12,
  },
  measurementTypeButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#cfcfcf',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  measurementTypeButtonSelected: {
    borderColor: '#1e88e5',
    backgroundColor: '#e3f2fd',
  },
  measurementTypeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#222222',
  },
  measurementTypeButtonTextSelected: {
    color: '#0d47a1',
    fontWeight: '700',
  },
  helperText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'right',
    marginBottom: 12,
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
  stateCard: {
    minHeight: 160,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d7e3f4',
    backgroundColor: '#f8fbff',
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateText: {
    fontSize: 15,
    color: '#4b5563',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 22,
  },
});
