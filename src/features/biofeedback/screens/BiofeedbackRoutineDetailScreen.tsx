import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getRoutineById } from '../data/firebase-routines-repository';
import type { Routine } from '../types/routine.types';

type Props = {
  routineId: string;
};

function formatCycleLength(cycleLengthDays: number): string {
  return `מחזור כל ${cycleLengthDays} ימים`;
}

export default function BiofeedbackRoutineDetailScreen({ routineId }: Props) {
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

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
    Alert.alert('הוסף תרגיל', 'השלב הבא יהיה הוספת תרגיל לרוטינה.');
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
                {routine.items
                  .slice()
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((item) => (
                    <View key={item.id} style={styles.itemCard}>
                      <Text style={styles.itemTitle}>
                        יום {item.dayOffset + 1} · מיקום {item.sortOrder + 1}
                      </Text>
                      <Text style={styles.itemMeta}>
                        {item.catalogItemId ?? item.userCustomActivityId ?? item.customExerciseName ?? 'תרגיל'}
                      </Text>
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
  itemCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d7e3f4',
    backgroundColor: '#f8fbff',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#243447',
    textAlign: 'right',
    marginBottom: 6,
  },
  itemMeta: {
    fontSize: 14,
    color: '#5b6b7d',
    textAlign: 'right',
  },
});
