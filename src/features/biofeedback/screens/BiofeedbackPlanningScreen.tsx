import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  listActiveRoutines,
} from '../data/firebase-routines-repository';
import type { Routine } from '../types/routine.types';

function formatCycleLength(cycleLengthDays: number): string {
  return `מחזור כל ${cycleLengthDays} ימים`;
}

function formatItemCount(count: number): string {
  return `${count} תרגילים`;
}

export default function BiofeedbackPlanningScreen() {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadRoutines() {
        try {
          setIsLoading(true);
          setErrorMessage('');

          const nextRoutines = await listActiveRoutines();

          if (!isActive) {
            return;
          }

          setRoutines(nextRoutines);
        } catch (error) {
          if (!isActive) {
            return;
          }

          console.log('PLANNING ROUTINES LOAD FAILED:', error);
          setErrorMessage('לא הצלחנו לטעון את הרוטינות כרגע.');
        } finally {
          if (isActive) {
            setIsLoading(false);
          }
        }
      }

      void loadRoutines();

      return () => {
        isActive = false;
      };
    }, []),
  );

  function handleCreateRoutinePress() {
    router.push('/routines/new');
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>תכנון תרגולים</Text>
          <Pressable style={styles.createButton} onPress={handleCreateRoutinePress}>
            <Text style={styles.createButtonText}>רוטינה חדשה</Text>
          </Pressable>
        </View>

        {isLoading ? (
          <View style={styles.stateCard}>
            <ActivityIndicator size="small" color="#1e4f8a" />
            <Text style={styles.stateText}>טוען רוטינות...</Text>
          </View>
        ) : errorMessage ? (
          <View style={styles.stateCard}>
            <Text style={styles.stateText}>{errorMessage}</Text>
          </View>
        ) : routines.length === 0 ? (
          <View style={styles.stateCard}>
            <Text style={styles.emptyTitle}>אין עדיין רוטינות</Text>
            <Text style={styles.stateText}>כאן יופיעו רוטינות התרגול הקבועות שלך.</Text>
          </View>
        ) : (
          <View style={styles.routinesList}>
            {routines.map((routine) => (
              <View key={routine.id} style={styles.routineCard}>
                <Text style={styles.routineName}>{routine.name}</Text>
                <Text style={styles.routineMeta}>{formatItemCount(routine.items.length)}</Text>
                <Text style={styles.routineMeta}>
                  {formatCycleLength(routine.cycleLengthDays)}
                </Text>
                <Text style={styles.routineMeta}>תאריך התחלה: {routine.startDateKey}</Text>
              </View>
            ))}
          </View>
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
    paddingBottom: 24,
  },
  headerRow: {
    gap: 12,
    marginBottom: 18,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#243447',
    textAlign: 'right',
  },
  createButton: {
    height: 44,
    borderRadius: 12,
    backgroundColor: '#1e4f8a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonText: {
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
  routinesList: {
    gap: 12,
  },
  routineCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d7e3f4',
    backgroundColor: '#f8fbff',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  routineName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#243447',
    textAlign: 'right',
    marginBottom: 8,
  },
  routineMeta: {
    fontSize: 14,
    color: '#5b6b7d',
    textAlign: 'right',
    marginTop: 4,
  },
});
