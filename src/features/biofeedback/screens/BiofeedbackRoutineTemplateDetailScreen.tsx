import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BiofeedbackHeader from '../components/BiofeedbackHeader';
import { ACTIVITY_CATALOG } from '../constants/activity-catalog';
import {
  archiveRoutineTemplate,
  createRoutineTemplate,
  getRoutineTemplateById,
  updateRoutineTemplate,
} from '../data/firebase-routine-templates-repository';
import { exportStoredRoutineTemplateAsJson } from '../data/routine-template.io';
import type { RoutineTemplate, RoutineTemplateItem } from '../types/routine-template.types';

type Props = {
  templateId: string;
};

type CycleLengthMode = 'preset' | 'custom';

type TemplateItemsByDay = {
  dayOffset: number;
  items: RoutineTemplateItem[];
};

const CYCLE_LENGTH_PRESETS = [
  { label: 'כל יום', value: 1 },
  { label: 'שבוע', value: 7 },
  { label: '10 ימים', value: 10 },
  { label: 'שבועיים', value: 14 },
];

function formatCycleLength(cycleLengthDays: number): string {
  return `מחזור כל ${cycleLengthDays} ימים`;
}

function createTemplateItemId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function getTemplateItemDisplayName(item: RoutineTemplateItem): string {
  if (item.customExerciseName) {
    return item.customExerciseName;
  }

  if (item.activityType === 'monitoring' && item.monitoringType) {
    return item.monitoringType === 'morning' ? 'ניטור בוקר' : 'ניטור קצר';
  }

  const catalogItem = item.catalogItemId
    ? ACTIVITY_CATALOG.find((currentItem) => currentItem.id === item.catalogItemId)
    : null;

  return catalogItem?.label ?? item.catalogItemId ?? item.userCustomActivityId ?? 'תרגיל';
}

function groupTemplateItemsByDay(items: RoutineTemplateItem[]): TemplateItemsByDay[] {
  const groupsByDayOffset = new Map<number, RoutineTemplateItem[]>();

  items.forEach((item) => {
    const currentItems = groupsByDayOffset.get(item.dayOffset) ?? [];
    groupsByDayOffset.set(item.dayOffset, [...currentItems, item]);
  });

  return Array.from(groupsByDayOffset.entries())
    .map(([dayOffset, dayItems]) => ({
      dayOffset,
      items: dayItems.slice().sort((a, b) => a.sortOrder - b.sortOrder),
    }))
    .sort((a, b) => a.dayOffset - b.dayOffset);
}

function normalizeTemplateItems(items: RoutineTemplateItem[]): RoutineTemplateItem[] {
  return items.map((item, index) => ({
    ...item,
    id: item.id || createTemplateItemId(),
    sortOrder: index,
  }));
}

function getInitialCycleLengthMode(cycleLengthDays: number): CycleLengthMode {
  return CYCLE_LENGTH_PRESETS.some((preset) => preset.value === cycleLengthDays)
    ? 'preset'
    : 'custom';
}

export default function BiofeedbackRoutineTemplateDetailScreen({ templateId }: Props) {
  const isNewTemplate = templateId === 'new';
  const [template, setTemplate] = useState<RoutineTemplate | null>(null);
  const [name, setName] = useState('');
  const [cycleLengthMode, setCycleLengthMode] = useState<CycleLengthMode>('preset');
  const [cycleLengthDays, setCycleLengthDays] = useState(7);
  const [customCycleLengthDays, setCustomCycleLengthDays] = useState('');
  const [items, setItems] = useState<RoutineTemplateItem[]>([]);
  const [isLoading, setIsLoading] = useState(!isNewTemplate);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadTemplate() {
        if (isNewTemplate) {
          setIsLoading(false);
          return;
        }

        try {
          setIsLoading(true);
          setErrorMessage('');

          const nextTemplate = await getRoutineTemplateById(templateId);

          if (!isActive) {
            return;
          }

          if (!nextTemplate) {
            setTemplate(null);
            setErrorMessage('לא נמצאה תבנית.');
            return;
          }

          setTemplate(nextTemplate);
          setName(nextTemplate.name);
          setCycleLengthDays(nextTemplate.cycleLengthDays);
          setCycleLengthMode(getInitialCycleLengthMode(nextTemplate.cycleLengthDays));
          setCustomCycleLengthDays(
            getInitialCycleLengthMode(nextTemplate.cycleLengthDays) === 'custom'
              ? String(nextTemplate.cycleLengthDays)
              : '',
          );
          setItems(nextTemplate.items);
        } catch (error) {
          if (!isActive) {
            return;
          }

          console.log('ROUTINE TEMPLATE LOAD FAILED:', error);
          setErrorMessage('לא הצלחנו לטעון את התבנית כרגע.');
        } finally {
          if (isActive) {
            setIsLoading(false);
          }
        }
      }

      void loadTemplate();

      return () => {
        isActive = false;
      };
    }, [isNewTemplate, templateId]),
  );

  const finalCycleLengthDays = useMemo(
    () =>
      cycleLengthMode === 'custom'
        ? Number(customCycleLengthDays.trim())
        : cycleLengthDays,
    [customCycleLengthDays, cycleLengthDays, cycleLengthMode],
  );

  function navigateBackToPlanning() {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/planning');
  }

  function clampItemsToCycleLength(nextCycleLengthDays: number): RoutineTemplateItem[] {
    return normalizeTemplateItems(
      items.map((item) => ({
        ...item,
        dayOffset: Math.min(nextCycleLengthDays - 1, Math.max(0, item.dayOffset)),
      })),
    );
  }

  async function saveTemplate(options: { showSuccess?: boolean } = {}) {
    const trimmedName = name.trim();

    if (!trimmedName) {
      Alert.alert('שם תבנית חסר', 'יש להזין שם לתבנית.');
      return null;
    }

    if (
      !Number.isInteger(finalCycleLengthDays) ||
      finalCycleLengthDays < 1 ||
      finalCycleLengthDays > 365
    ) {
      Alert.alert('אורך מחזור לא תקין', 'יש להזין מספר ימים שלם בין 1 ל-365.');
      return null;
    }

    try {
      setIsSaving(true);
      const normalizedItems = clampItemsToCycleLength(finalCycleLengthDays);

      if (isNewTemplate) {
        const nextTemplate = await createRoutineTemplate({
          name: trimmedName,
          cycleLengthDays: finalCycleLengthDays,
          items: normalizedItems.map(({ id: _id, sortOrder: _sortOrder, ...item }) => item),
        });

        router.replace(`/routine-templates/${nextTemplate.id}`);
        return nextTemplate;
      }

      await updateRoutineTemplate(templateId, {
        name: trimmedName,
        cycleLengthDays: finalCycleLengthDays,
        items: normalizedItems,
      });

      setItems(normalizedItems);
      setCycleLengthDays(finalCycleLengthDays);
      setCycleLengthMode(getInitialCycleLengthMode(finalCycleLengthDays));
      setCustomCycleLengthDays(
        getInitialCycleLengthMode(finalCycleLengthDays) === 'custom'
          ? String(finalCycleLengthDays)
          : '',
      );
      setTemplate((current) =>
        current
          ? {
              ...current,
              name: trimmedName,
              cycleLengthDays: finalCycleLengthDays,
              items: normalizedItems,
            }
          : current,
      );

      if (options.showSuccess) {
        Alert.alert('נשמר', 'התבנית נשמרה.');
      }

      return {
        ...(template ?? {
          id: templateId,
          userId: '',
          createdAt: '',
          updatedAt: '',
          isArchived: false,
        }),
        name: trimmedName,
        cycleLengthDays: finalCycleLengthDays,
        items: normalizedItems,
      };
    } catch (error) {
      console.log('ROUTINE TEMPLATE SAVE FAILED:', error);
      Alert.alert('שמירת התבנית נכשלה', 'לא הצלחנו לשמור את התבנית כרגע.');
      return null;
    } finally {
      setIsSaving(false);
    }
  }

  function handleAddItemPress() {
    if (isNewTemplate) {
      Alert.alert('שמירה נדרשת', 'יש לשמור את התבנית לפני הוספת תרגילים.');
      return;
    }

    router.push(`/routine-templates/${templateId}/add-item`);
  }

  async function handleSavePress() {
    await saveTemplate({ showSuccess: !isNewTemplate });
  }

  async function updateTemplateItems(nextItems: RoutineTemplateItem[], itemId: string) {
    if (isNewTemplate || updatingItemId) {
      return;
    }

    try {
      setUpdatingItemId(itemId);
      const normalizedItems = normalizeTemplateItems(nextItems);
      await updateRoutineTemplate(templateId, { items: normalizedItems });
      setItems(normalizedItems);
      setTemplate((current) =>
        current
          ? {
              ...current,
              items: normalizedItems,
            }
          : current,
      );
    } catch (error) {
      console.log('ROUTINE TEMPLATE ITEM UPDATE FAILED:', error);
      Alert.alert('עדכון התבנית נכשל', 'לא הצלחנו לעדכן את התבנית כרגע.');
    } finally {
      setUpdatingItemId(null);
    }
  }

  function handleChangeItemDay(item: RoutineTemplateItem, delta: number) {
    if (updatingItemId) {
      return;
    }

    const maxDayOffset = Math.max(0, finalCycleLengthDays - 1);
    const nextDayOffset = Math.min(maxDayOffset, Math.max(0, item.dayOffset + delta));

    if (nextDayOffset === item.dayOffset) {
      return;
    }

    const nextItems = items.map((currentItem) =>
      currentItem.id === item.id
        ? {
            ...currentItem,
            dayOffset: nextDayOffset,
          }
        : currentItem,
    );

    void updateTemplateItems(nextItems, item.id);
  }

  function handleRemoveItemPress(item: RoutineTemplateItem) {
    if (updatingItemId) {
      return;
    }

    Alert.alert('להסיר את התרגיל מהתבנית?', 'התרגיל יוסר מהתבנית לייצוא.', [
      { text: 'ביטול', style: 'cancel' },
      {
        text: 'הסר',
        style: 'destructive',
        onPress: () => {
          void updateTemplateItems(
            items.filter((currentItem) => currentItem.id !== item.id),
            item.id,
          );
        },
      },
    ]);
  }

  async function handleExport() {
    if (isNewTemplate) {
      Alert.alert('שמירה נדרשת', 'יש לשמור את התבנית לפני ייצוא.');
      return;
    }

    const savedTemplate = await saveTemplate();

    if (!savedTemplate) {
      return;
    }

    try {
      setIsExporting(true);
      await exportStoredRoutineTemplateAsJson(savedTemplate);
    } catch (error) {
      console.log('ROUTINE TEMPLATE EXPORT FAILED:', error);
      Alert.alert('ייצוא התבנית נכשל', 'לא הצלחנו לייצא את התבנית כרגע.');
    } finally {
      setIsExporting(false);
    }
  }

  function handleArchive() {
    if (isNewTemplate || !template) {
      navigateBackToPlanning();
      return;
    }

    Alert.alert('לארכב את התבנית?', 'התבנית לא תופיע יותר ברשימת הרוטינות לייצוא.', [
      { text: 'ביטול', style: 'cancel' },
      {
        text: 'ארכב',
        style: 'destructive',
        onPress: async () => {
          try {
            await archiveRoutineTemplate(template.id);
            navigateBackToPlanning();
          } catch (error) {
            console.log('ROUTINE TEMPLATE ARCHIVE FAILED:', error);
            Alert.alert('ארכוב התבנית נכשל', 'לא הצלחנו לארכב את התבנית כרגע.');
          }
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <BiofeedbackHeader
          variant="screen"
          title={isNewTemplate ? 'תבנית חדשה לשליחה' : 'תבנית לשליחה'}
          onBackPress={navigateBackToPlanning}
        />

        {isLoading ? (
          <View style={styles.stateCard}>
            <ActivityIndicator size="small" color="#1e4f8a" />
            <Text style={styles.stateText}>טוען תבנית...</Text>
          </View>
        ) : errorMessage ? (
          <View style={styles.stateCard}>
            <Text style={styles.stateText}>{errorMessage}</Text>
          </View>
        ) : (
          <>
            <Text style={styles.title}>{name.trim() || 'תבנית חדשה'}</Text>
            <Text style={styles.subtitle}>
              {Number.isInteger(finalCycleLengthDays) && finalCycleLengthDays > 0
                ? formatCycleLength(finalCycleLengthDays)
                : 'מחזור מותאם אישית'}
            </Text>

            <View style={styles.section}>
              <Text style={styles.label}>שם התבנית</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                style={styles.input}
                placeholder="לדוגמה: תוכנית נשימה לשבוע ראשון"
              />

              <Text style={styles.label}>אורך מחזור</Text>
              <View style={styles.presetButtons}>
                {CYCLE_LENGTH_PRESETS.map((preset) => {
                  const isSelected =
                    cycleLengthMode === 'preset' && cycleLengthDays === preset.value;

                  return (
                    <Pressable
                      key={preset.value}
                      style={[styles.presetButton, isSelected ? styles.presetButtonSelected : null]}
                      onPress={() => {
                        setCycleLengthMode('preset');
                        setCycleLengthDays(preset.value);
                      }}
                    >
                      <Text
                        style={[
                          styles.presetButtonText,
                          isSelected ? styles.presetButtonTextSelected : null,
                        ]}
                      >
                        {preset.label}
                      </Text>
                    </Pressable>
                  );
                })}

                <Pressable
                  style={[
                    styles.presetButton,
                    cycleLengthMode === 'custom' ? styles.presetButtonSelected : null,
                  ]}
                  onPress={() => setCycleLengthMode('custom')}
                >
                  <Text
                    style={[
                      styles.presetButtonText,
                      cycleLengthMode === 'custom' ? styles.presetButtonTextSelected : null,
                    ]}
                  >
                    מותאם אישית
                  </Text>
                </Pressable>
              </View>

              {cycleLengthMode === 'custom' ? (
                <>
                  <Text style={styles.label}>מספר ימים במחזור</Text>
                  <TextInput
                    value={customCycleLengthDays}
                    onChangeText={setCustomCycleLengthDays}
                    style={styles.input}
                    placeholder="לדוגמה: 21"
                    keyboardType="number-pad"
                  />
                </>
              ) : null}
            </View>

            <Pressable
              style={[styles.saveButton, isSaving ? styles.disabled : null]}
              onPress={handleSavePress}
              disabled={isSaving}
            >
              <Text style={styles.saveButtonText}>{isSaving ? 'שומר...' : 'שמור תבנית'}</Text>
            </Pressable>

            <Pressable
              style={[styles.addButton, isNewTemplate ? styles.disabled : null]}
              onPress={handleAddItemPress}
              disabled={isNewTemplate}
            >
              <Text style={styles.addButtonText}>הוסף תרגיל</Text>
            </Pressable>

            {items.length === 0 ? (
              <View style={styles.stateCard}>
                <Text style={styles.emptyTitle}>אין עדיין תרגילים בתבנית</Text>
                <Text style={styles.stateText}>כאן יופיעו התרגילים שיתווספו לתבנית.</Text>
              </View>
            ) : (
              <View style={styles.itemsList}>
                {groupTemplateItemsByDay(items).map((group) => (
                  <View key={group.dayOffset} style={styles.dayGroup}>
                    {finalCycleLengthDays > 1 ? (
                      <Text style={styles.dayGroupTitle}>יום {group.dayOffset + 1}</Text>
                    ) : null}

                    {group.items.map((item, index) => (
                      <View key={item.id} style={styles.itemRow}>
                        <Text style={styles.itemIndex}>{index + 1}</Text>
                        <View style={styles.itemContent}>
                          <Text style={styles.itemName}>{getTemplateItemDisplayName(item)}</Text>
                          <View style={styles.itemActions}>
                            {finalCycleLengthDays > 1 ? (
                              <>
                                <Pressable
                                  style={[
                                    styles.itemActionButton,
                                    item.dayOffset <= 0 || updatingItemId !== null
                                      ? styles.disabled
                                      : null,
                                  ]}
                                  onPress={() => handleChangeItemDay(item, -1)}
                                  disabled={item.dayOffset <= 0 || updatingItemId !== null}
                                >
                                  <Text style={styles.itemActionButtonText}>-</Text>
                                </Pressable>

                                <Text style={styles.itemDayText}>יום {item.dayOffset + 1}</Text>

                                <Pressable
                                  style={[
                                    styles.itemActionButton,
                                    item.dayOffset >= finalCycleLengthDays - 1 ||
                                    updatingItemId !== null
                                      ? styles.disabled
                                      : null,
                                  ]}
                                  onPress={() => handleChangeItemDay(item, 1)}
                                  disabled={
                                    item.dayOffset >= finalCycleLengthDays - 1 ||
                                    updatingItemId !== null
                                  }
                                >
                                  <Text style={styles.itemActionButtonText}>+</Text>
                                </Pressable>
                              </>
                            ) : null}

                            <Pressable
                              style={[
                                styles.removeItemButton,
                                updatingItemId !== null ? styles.disabled : null,
                              ]}
                              onPress={() => handleRemoveItemPress(item)}
                              disabled={updatingItemId !== null}
                            >
                              <Text style={styles.removeItemButtonText}>הסר</Text>
                            </Pressable>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            )}

            {!isNewTemplate ? (
              <>
                <Pressable
                  style={[styles.exportButton, isExporting || isSaving ? styles.disabled : null]}
                  onPress={handleExport}
                  disabled={isExporting || isSaving}
                >
                  <Text style={styles.exportButtonText}>
                    {isExporting ? 'מייצא...' : 'ייצוא JSON'}
                  </Text>
                </Pressable>

                <Pressable style={styles.archiveButton} onPress={handleArchive}>
                  <Text style={styles.archiveButtonText}>ארכב תבנית</Text>
                </Pressable>
              </>
            ) : null}
          </>
        )}
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
    paddingBottom: 28,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#243447',
    textAlign: 'right',
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
  presetButtons: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetButton: {
    minHeight: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#bfd4ee',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  presetButtonSelected: {
    borderColor: '#1e4f8a',
    backgroundColor: '#e3f2fd',
  },
  presetButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#46607a',
  },
  presetButtonTextSelected: {
    color: '#0d47a1',
  },
  saveButton: {
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: '#1e4f8a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  addButton: {
    height: 44,
    borderRadius: 12,
    backgroundColor: '#1e4f8a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  itemsList: {
    gap: 12,
    marginBottom: 16,
  },
  dayGroup: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d7e3f4',
    backgroundColor: '#f8fbff',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dayGroupTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#243447',
    textAlign: 'right',
    marginBottom: 10,
  },
  itemRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#e4edf8',
  },
  itemIndex: {
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#e3f2fd',
    color: '#0d47a1',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 26,
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    color: '#243447',
    fontWeight: '600',
    textAlign: 'right',
    marginBottom: 8,
  },
  itemActions: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  itemActionButton: {
    width: 36,
    height: 32,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#bfd4ee',
    backgroundColor: '#eef6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemActionButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e4f8a',
  },
  itemDayText: {
    minWidth: 58,
    fontSize: 13,
    fontWeight: '700',
    color: '#4b5563',
    textAlign: 'center',
  },
  removeItemButton: {
    minWidth: 52,
    height: 32,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#f0b8b8',
    backgroundColor: '#fff5f5',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  removeItemButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#b71c1c',
  },
  exportButton: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d7e3f4',
    backgroundColor: '#f3f6fb',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  exportButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e4f8a',
  },
  archiveButton: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f0b8b8',
    backgroundColor: '#fff5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  archiveButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#b71c1c',
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
    marginBottom: 16,
  },
  stateText: {
    fontSize: 15,
    color: '#4b5563',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 22,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#243447',
    textAlign: 'center',
    marginBottom: 8,
  },
  disabled: {
    opacity: 0.5,
  },
});
