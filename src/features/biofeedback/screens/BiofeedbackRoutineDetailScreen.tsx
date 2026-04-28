import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getRoutineById, updateRoutine } from '../data/firebase-routines-repository';
import type { Routine, RoutineItem } from '../types/routine.types';

type Props = {
  routineId: string;
};

function formatCycleLength(cycleLengthDays: number): string {
  return `מחזור כל ${cycleLengthDays} ימים`;
}

type RoutineItemsByDay = {
  dayOffset: number;
  items: Routine['items'];
};

function getRoutineItemDisplayName(item: Routine['items'][number]): string {
  if (item.customExerciseName) {
    return item.customExerciseName;
  }

  if (item.activityType === 'monitoring' && item.monitoringType) {
    return item.monitoringType === 'morning' ? 'ניטור בוקר' : 'ניטור קצר';
  }

  return item.catalogItemId ?? item.userCustomActivityId ?? 'תרגיל';
}

function groupRoutineItemsByDay(items: Routine['items']): RoutineItemsByDay[] {
  const groupsByDayOffset = new Map<number, Routine['items']>();

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

export default function BiofeedbackRoutineDetailScreen({ routineId }: Props) {
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadRoutine() {
        if (!routineId) {
          setRoutine(null);
          setErrorMessage('לא נמצאה רוטינה.');
          setIsLoading(false);
          return;
        }

        try {
          setIsLoading(true);
          setErrorMessage('');

          const nextRoutine = await getRoutineById(routineId);

          if (!isActive) {
            return;
          }

          if (!nextRoutine) {
            setRoutine(null);
            setErrorMessage('לא נמצאה רוטינה.');
            return;
          }

          setRoutine(nextRoutine);
        } catch (error) {
          if (!isActive) {
            return;
          }

          console.log('ROUTINE DETAIL LOAD FAILED:', error);
          setErrorMessage('לא הצלחנו לטעון את הרוטינה כרגע.');
        } finally {
          if (isActive) {
            setIsLoading(false);
          }
        }
      }

      void loadRoutine();

      return () => {
        isActive = false;
      };
    }, [routineId]),
  );

  function handleAddItemPress() {
    router.push(`/routines/${routineId}/add-item`);
  }

  async function updateRoutineItems(nextItems: RoutineItem[], itemId: string) {
    if (!routine || updatingItemId) {
      return;
    }

    try {
      setUpdatingItemId(itemId);
      await updateRoutine(routine.id, { items: nextItems });
      setRoutine({
        ...routine,
        items: nextItems,
      });
    } catch (error) {
      console.log('ROUTINE ITEM UPDATE FAILED:', error);
      Alert.alert('עדכון הרוטינה נכשל', 'לא הצלחנו לעדכן את הרוטינה כרגע.');
    } finally {
      setUpdatingItemId(null);
    }
  }

  function handleChangeItemDay(item: RoutineItem, delta: number) {
    if (!routine || updatingItemId) {
      return;
    }

    const nextDayOffset = Math.max(0, item.dayOffset + delta);

    if (nextDayOffset === item.dayOffset) {
      return;
    }

    const nextItems = routine.items.map((currentItem) =>
      currentItem.id === item.id
        ? {
            ...currentItem,
            dayOffset: nextDayOffset,
          }
        : currentItem,
    );

    void updateRoutineItems(nextItems, item.id);
  }

  function handleDeleteItemPress(item: RoutineItem) {
    if (!routine || updatingItemId) {
      return;
    }

    Alert.alert(
      'למחוק את התרגיל?',
      'התרגיל יוסר מהרוטינה. תרגולים שכבר תוכננו או בוצעו לא יימחקו.',
      [
        {
          text: 'ביטול',
          style: 'cancel',
        },
        {
          text: 'מחק',
          style: 'destructive',
          onPress: () => {
            const nextItems = routine.items.filter((currentItem) => currentItem.id !== item.id);
            void updateRoutineItems(nextItems, item.id);
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.stateCard}>
            <ActivityIndicator size="small" color="#1e4f8a" />
            <Text style={styles.stateText}>טוען רוטינה...</Text>
          </View>
        ) : errorMessage ? (
          <View style={styles.stateCard}>
            <Text style={styles.stateText}>{errorMessage}</Text>
          </View>
        ) : routine ? (
          <>
            <Text style={styles.title}>{routine.name}</Text>
            <Text style={styles.subtitle}>{formatCycleLength(routine.cycleLengthDays)}</Text>

            <Pressable style={styles.addButton} onPress={handleAddItemPress}>
              <Text style={styles.addButtonText}>הוסף תרגיל</Text>
            </Pressable>

            {routine.items.length === 0 ? (
              <View style={styles.stateCard}>
                <Text style={styles.emptyTitle}>אין עדיין תרגילים ברוטינה</Text>
                <Text style={styles.stateText}>כאן יופיעו התרגילים שיתווספו לרוטינה.</Text>
              </View>
            ) : (
              <View style={styles.itemsList}>
                {groupRoutineItemsByDay(routine.items).map((group) => (
                  <View key={group.dayOffset} style={styles.dayGroup}>
                    <Text style={styles.dayGroupTitle}>יום {group.dayOffset + 1}</Text>

                    {group.items.map((item, index) => (
                      <View key={item.id} style={styles.itemRow}>
                        <Text style={styles.itemIndex}>{index + 1}</Text>
                        <View style={styles.itemContent}>
                          <Text style={styles.itemName}>{getRoutineItemDisplayName(item)}</Text>
                          <View style={styles.itemActions}>
                            <Pressable
                              style={[
                                styles.itemActionButton,
                                item.dayOffset <= 0 || updatingItemId !== null
                                  ? styles.itemActionButtonDisabled
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
                                updatingItemId !== null ? styles.itemActionButtonDisabled : null,
                              ]}
                              onPress={() => handleChangeItemDay(item, 1)}
                              disabled={updatingItemId !== null}
                            >
                              <Text style={styles.itemActionButtonText}>+</Text>
                            </Pressable>

                            <Pressable
                              style={[
                                styles.deleteItemButton,
                                updatingItemId !== null ? styles.itemActionButtonDisabled : null,
                              ]}
                              onPress={() => handleDeleteItemPress(item)}
                              disabled={updatingItemId !== null}
                            >
                              <Text style={styles.deleteItemButtonText}>מחק</Text>
                            </Pressable>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            )}
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
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#243447',
    textAlign: 'center',
    marginBottom: 8,
  },
  itemsList: {
    gap: 12,
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
  itemName: {
    fontSize: 15,
    color: '#243447',
    fontWeight: '600',
    textAlign: 'right',
    marginBottom: 8,
  },
  itemContent: {
    flex: 1,
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
  itemActionButtonDisabled: {
    opacity: 0.45,
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
  deleteItemButton: {
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
  deleteItemButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#b71c1c',
  },
});
