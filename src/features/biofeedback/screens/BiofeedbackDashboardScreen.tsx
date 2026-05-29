// src\features\biofeedback\screens\BiofeedbackDashboardScreen.tsx

import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BiofeedbackHeader from '../components/BiofeedbackHeader';
import FloatingAddButton from '../components/FloatingAddButton';
import MonthGrid from '../components/MonthGrid';
import MorningMonitoringCardSection from '../components/MorningMonitoringCardSection';
import StreakInsightCard from '../components/StreakInsightCard';
import { toDateKey } from '../components/calendar.utils';
import { ACTIVITY_CATALOG } from '../constants/activity-catalog';
import {
  getRoutineItemsForDate,
  listActiveRoutines,
} from '../data/firebase-routines-repository';
import { listPlannedPracticesByDateKey } from '../data/firebase-planned-practices-repository';
import { listBiofeedbackEntriesByDateKeyFromFirestore } from '../data/firebase-biofeedback-read-repository';
import { listActiveMonitoringSchedules } from '../data/firebase-monitoring-schedules-repository';
import { findOrCreatePlannedPracticeForRoutineItem } from '../lib/find-or-create-planned-practice';
import { isMonitoringEntry, isPracticeEntry } from '../lib/entry-kind';
import { isPracticeRoutineItem } from '../lib/routine-item-kind';
import {
  getVisibleMorningMonitoringSchedulesForDate,
  type VisibleMonitoringSchedule,
} from '../lib/monitoring-schedule-visibility';
import {
  getMonitoringScheduleCardSummary,
  type MonitoringScheduleCardSummary,
} from '../lib/monitoring-schedule-summary';
import type { BiofeedbackEntry } from '../types/biofeedback-entry.types';
import type { RoutineItem } from '../types/routine.types';

import { collection, getDocs } from 'firebase/firestore';
import { testFirebaseConnection } from '../../../lib/testFirebase';
import { auth, db } from '../../../lib/firebase';
import { getCurrentUserProfile } from '../../auth/data/get-current-user-profile';
import { syncDailyReminderForToday } from '../../notifications/lib/daily-reminder';
import { getDailyReminderTime } from '../../notifications/lib/get-daily-reminder-time';

function getMonthTitle(date: Date): string {
  return new Intl.DateTimeFormat('he-IL', {
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function addMonths(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

type PlannedRoutineItem = {
  id: string;
  routineId: string;
  routineName: string;
  item: RoutineItem;
  isCompleted: boolean;
};

function getRoutineItemDisplayName(item: RoutineItem): string {
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

function getMeasurementLabel(measurementType: RoutineItem['measurementType']): string {
  if (measurementType === 'hrv') {
    return 'HRV';
  }

  if (measurementType === 'rlx') {
    return 'RLX';
  }

  return 'none';
}

export default function BiofeedbackDashboardScreen() {
  const [entryDateKeys, setEntryDateKeys] = useState<string[]>([]);
  const [practiceEntryDateKeys, setPracticeEntryDateKeys] = useState<string[]>([]);
  const [monitoringDateKeys, setMonitoringDateKeys] = useState<string[]>([]);
  const [firstSeenDateKey, setFirstSeenDateKey] = useState('');
  const [referenceDate, setReferenceDate] = useState(() => new Date());
  const [plannedRoutineItems, setPlannedRoutineItems] = useState<PlannedRoutineItem[]>([]);
  const [visibleMonitoringSchedules, setVisibleMonitoringSchedules] = useState<
    VisibleMonitoringSchedule[]
  >([]);
  const [monitoringScheduleSummaries, setMonitoringScheduleSummaries] = useState<
    MonitoringScheduleCardSummary[]
  >([]);
  const [startingPlannedItemId, setStartingPlannedItemId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      void loadEntries();
    }, []),
  );

  async function loadEntries() {
    try {
      await testFirebaseConnection();

      const user = auth.currentUser;

      if (!user) {
        console.log('DASHBOARD LOAD FAILED: No authenticated user');
        setEntryDateKeys([]);
        setPracticeEntryDateKeys([]);
        setMonitoringDateKeys([]);
        setPlannedRoutineItems([]);
        setVisibleMonitoringSchedules([]);
        setMonitoringScheduleSummaries([]);
        return;
      }

      const profile = await getCurrentUserProfile();
      setFirstSeenDateKey(profile?.firstSeenDateKey ?? '');

      const entriesCollection = collection(db, 'users', user.uid, 'entries');
      const snapshot = await getDocs(entriesCollection);

      const uniqueDateKeys = Array.from(
        new Set(
          snapshot.docs
            .map((docSnapshot) => docSnapshot.data().dateKey)
            .filter((value): value is string => typeof value === 'string' && value.length > 0),
        ),
      );
      const uniquePracticeDateKeys = Array.from(
        new Set(
          snapshot.docs
            .filter((docSnapshot) => isPracticeEntry(docSnapshot.data() as BiofeedbackEntry))
            .map((docSnapshot) => docSnapshot.data().dateKey)
            .filter((value): value is string => typeof value === 'string' && value.length > 0),
        ),
      );
      const uniqueMonitoringDateKeys = Array.from(
        new Set(
          snapshot.docs
            .filter((docSnapshot) => {
              const entry = docSnapshot.data() as BiofeedbackEntry;

              return isMonitoringEntry(entry);
            })
            .map((docSnapshot) => docSnapshot.data().dateKey)
            .filter((value): value is string => typeof value === 'string' && value.length > 0),
        ),
      );
      const allEntries = snapshot.docs.map((docSnapshot) => {
        const data = docSnapshot.data();

        return {
          id: docSnapshot.id,
          userId: user.uid,
          measuredAt: String(data.measuredAt ?? ''),
          dateKey: String(data.dateKey ?? ''),
          timeOfDay: 'morning',
          activity: data.activity,
          exerciseName: String(data.exerciseName ?? ''),
          measurementType: data.measurementType ?? null,
          durationMinutes: Number(data.durationMinutes ?? 0),
          monitoringResult: data.monitoringResult ?? null,
          hrvDistribution: {
            stressPercent: null,
            midRangePercent: null,
            relaxationPercent: null,
          },
          rlx: {
            startValue: null,
            endValue: null,
          },
          notes: String(data.notes ?? ''),
          createdAt: String(data.createdAt ?? ''),
          updatedAt: String(data.updatedAt ?? data.createdAt ?? ''),
        } as BiofeedbackEntry;
      });

      setEntryDateKeys(uniqueDateKeys);
      setPracticeEntryDateKeys(uniquePracticeDateKeys);
      setMonitoringDateKeys(uniqueMonitoringDateKeys);
      const todayDateKey = toDateKey(new Date());
      const routines = await listActiveRoutines();
      const activeMonitoringSchedules = await listActiveMonitoringSchedules();
      const plannedPractices = await listPlannedPracticesByDateKey(todayDateKey);
      const todayEntries = await listBiofeedbackEntriesByDateKeyFromFirestore(todayDateKey);
      const todayEntryIds = new Set(todayEntries.map((entry) => entry.id));
      const nextPlannedRoutineItems = routines.flatMap((routine) =>
        getRoutineItemsForDate(routine, todayDateKey).filter(isPracticeRoutineItem).map((item) => {
          const matchingPlannedPractice = plannedPractices.find(
            (practice) =>
              practice.routineId === routine.id &&
              practice.routineItemId === item.id &&
              practice.dateKey === todayDateKey,
          );

          return {
            id: `${routine.id}:${item.id}:${todayDateKey}`,
            routineId: routine.id,
            routineName: routine.name,
            item,
            isCompleted:
              matchingPlannedPractice?.completedEntryId != null &&
              todayEntryIds.has(matchingPlannedPractice.completedEntryId),
          };
        }),
      );

      setPlannedRoutineItems(nextPlannedRoutineItems);
      const nextVisibleMonitoringSchedules = getVisibleMorningMonitoringSchedulesForDate(
        activeMonitoringSchedules,
        todayDateKey,
      );
      setVisibleMonitoringSchedules(nextVisibleMonitoringSchedules);
      setMonitoringScheduleSummaries(
        nextVisibleMonitoringSchedules.map((visibleSchedule) =>
          getMonitoringScheduleCardSummary(
            visibleSchedule.schedule,
            visibleSchedule.state,
            todayDateKey,
            allEntries,
          ),
        ),
      );
      const reminderTime = await getDailyReminderTime();
      await syncDailyReminderForToday(uniqueDateKeys.includes(todayDateKey), reminderTime);
    } catch (error) {
      console.log('🔥 FIRESTORE ERROR:', error);
      setPracticeEntryDateKeys([]);
      setMonitoringDateKeys([]);
      setPlannedRoutineItems([]);
      setVisibleMonitoringSchedules([]);
      setMonitoringScheduleSummaries([]);
    }
  }

  function handleDayPress(dateKey: string) {
    router.push(`/day/${dateKey}`);
  }

  function handlePreviousMonth() {
    setReferenceDate((current) => addMonths(current, -1));
  }

  function handleNextMonth() {
    setReferenceDate((current) => addMonths(current, 1));
  }

  function handleGoToToday() {
    setReferenceDate(new Date());
  }

  async function handlePlannedRoutineItemPress(plannedItem: PlannedRoutineItem) {
    if (startingPlannedItemId || plannedItem.isCompleted) {
      return;
    }

    const todayDateKey = toDateKey(new Date());

    try {
      setStartingPlannedItemId(plannedItem.id);

      const plannedPractice = await findOrCreatePlannedPracticeForRoutineItem({
        routineId: plannedItem.routineId,
        routineItemId: plannedItem.item.id,
        dateKey: todayDateKey,
        item: plannedItem.item,
      });

      router.push(
        `/entries/new?dateKey=${todayDateKey}&plannedPracticeId=${plannedPractice.id}`,
      );
    } catch (error) {
      console.log('PLANNED ROUTINE START FAILED:', error);
    } finally {
      setStartingPlannedItemId(null);
    }
  }

  function handleStartMorningMonitoringPress() {
    const todayDateKey = toDateKey(new Date());

    router.push(`/entries/new?dateKey=${todayDateKey}`);
  }

  function handleManageMorningMonitoringPress() {
    router.push('/monitoring-schedules/new');
  }

  const monthTitle = useMemo(() => getMonthTitle(referenceDate), [referenceDate]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
        <BiofeedbackHeader />

        <Text style={styles.monthTitle}>{monthTitle}</Text>

        <View style={styles.navigationRow}>
          <Pressable style={styles.navButton} onPress={handleNextMonth}>
            <Text style={styles.navButtonText}>◀</Text>
          </Pressable>

          <Pressable style={styles.todayButton} onPress={handleGoToToday}>
            <Text style={styles.todayButtonText}>היום</Text>
          </Pressable>

          <Pressable style={styles.navButton} onPress={handlePreviousMonth}>
            <Text style={styles.navButtonText}>▶</Text>
          </Pressable>
        </View>

        <StreakInsightCard entryDateKeys={practiceEntryDateKeys} todayDateKey={toDateKey(new Date())} />

        <MorningMonitoringCardSection
          summaries={monitoringScheduleSummaries}
          onStartMonitoring={handleStartMorningMonitoringPress}
          onManageMonitoring={handleManageMorningMonitoringPress}
        />


        <View style={styles.todayPlanSection}>
          <Text style={styles.todayPlanTitle}>התכנון להיום</Text>

          {plannedRoutineItems.length === 0 ? (
            <View style={styles.todayPlanEmptyCard}>
              <Text style={styles.todayPlanEmptyText}>אין תרגולים מתוכננים להיום</Text>
              <Pressable
                onPress={() => router.push('/entries/new')}
                style={styles.todayPlanEmptyButton}
              >
                <Text style={styles.todayPlanEmptyButtonText}>הוסף מדידה</Text>
              </Pressable>
            </View>
          ) : (
            plannedRoutineItems.map((plannedItem) => (
              <Pressable
                key={plannedItem.id}
                style={[
                  styles.todayPlanCard,
                  plannedItem.isCompleted || startingPlannedItemId === plannedItem.id
                    ? styles.todayPlanCardDisabled
                    : null,
                ]}
                onPress={() => void handlePlannedRoutineItemPress(plannedItem)}
                disabled={plannedItem.isCompleted || startingPlannedItemId !== null}
              >
                <View style={styles.todayPlanCardHeader}>
                  <Text style={styles.todayPlanExerciseName}>
                    {getRoutineItemDisplayName(plannedItem.item)}
                  </Text>

                  <View
                    style={[
                      styles.measurementBadge,
                      plannedItem.item.measurementType === 'hrv'
                        ? styles.measurementBadgeHrv
                        : plannedItem.item.measurementType === 'rlx'
                          ? styles.measurementBadgeRlx
                          : styles.measurementBadgeNone,
                    ]}
                  >
                    <Text style={styles.measurementBadgeText}>
                      {getMeasurementLabel(plannedItem.item.measurementType)}
                    </Text>
                  </View>

                  {plannedItem.isCompleted ? (
                    <View style={styles.completedBadge}>
                      <Text style={styles.completedBadgeText}>בוצע</Text>
                    </View>
                  ) : null}
                </View>

                <View style={styles.todayPlanRoutineBadge}>
                  <Text style={styles.todayPlanRoutineBadgeText}>
                    {plannedItem.routineName}
                  </Text>
                </View>
              </Pressable>
            ))
          )}
        </View>

        <MonthGrid
          referenceDate={referenceDate}
          entryDateKeys={practiceEntryDateKeys}
          monitoringDateKeys={monitoringDateKeys}
          onDayPress={handleDayPress}
          firstSeenDateKey={firstSeenDateKey}
        />

        </ScrollView>
        <FloatingAddButton />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  monitoringSection: {
    marginTop: 6,
    marginBottom: 18,
  },
  monitoringTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#243447',
    textAlign: 'right',
    marginBottom: 10,
  },
  monitoringCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  monitoringCardScheduled: {
    borderColor: '#d7dce5',
    backgroundColor: '#f6f7f9',
  },
  monitoringCardDue: {
    borderColor: '#e0c27a',
    backgroundColor: '#fff8e5',
  },
  monitoringCardPending: {
    borderColor: '#c8b6e8',
    backgroundColor: '#f6f0ff',
  },
  monitoringCardHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 8,
  },
  monitoringCardTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#243447',
    textAlign: 'right',
  },
  monitoringStateBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d7dce5',
  },
  monitoringStateBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4b5563',
  },
  monitoringMeta: {
    fontSize: 13,
    color: '#5b6b7d',
    textAlign: 'right',
    marginBottom: 12,
  },
  monitoringActionButton: {
    alignSelf: 'flex-end',
    minHeight: 38,
    borderRadius: 10,
    backgroundColor: '#ede7f6',
    borderWidth: 1,
    borderColor: '#c8b6e8',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  monitoringActionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5e35b1',
  },
  monitoringManageButton: {
    alignSelf: 'flex-end',
    minHeight: 38,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#c8b6e8',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  monitoringManageButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5e35b1',
  },
  todayPlanSection: {
    marginTop: 6,
    marginBottom: 18,
  },
  todayPlanTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#243447',
    textAlign: 'right',
    marginBottom: 10,
  },
  todayPlanEmptyCard: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 14,
    padding: 14,
    backgroundColor: '#fafafa',
  },
  todayPlanEmptyText: {
    fontSize: 15,
    color: '#666666',
    textAlign: 'right',
  },
  todayPlanEmptyButton: {
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#e8f0fe',
  },
  todayPlanEmptyButtonText: {
    textAlign: 'center',
    fontWeight: '600',
    color: '#1e4f8a',
  },
  todayPlanCard: {
    borderWidth: 1,
    borderColor: '#cfe3d4',
    borderRadius: 14,
    padding: 14,
    backgroundColor: '#f7fcf8',
    marginBottom: 10,
  },
  todayPlanCardDisabled: {
    opacity: 0.6,
  },
  todayPlanCardHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 8,
  },
  todayPlanExerciseName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#243447',
    textAlign: 'right',
  },
  todayPlanRoutineBadge: {
    alignSelf: 'flex-end',
    borderRadius: 6,
    backgroundColor: '#dff3e4',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  todayPlanRoutineBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1b5e20',
    textAlign: 'center',
  },
  measurementBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  measurementBadgeHrv: {
    backgroundColor: '#e3f2fd',
  },
  measurementBadgeRlx: {
    backgroundColor: '#e8f5e9',
  },
  measurementBadgeNone: {
    backgroundColor: '#eeeeee',
  },
  measurementBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#243447',
  },
  completedBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#dff3e4',
  },
  completedBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1b5e20',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    paddingBottom: 110,
  },
  monthTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  navigationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  navButton: {
    width: 52,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d0d0d0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  navButtonText: {
    fontSize: 22,
    fontWeight: '700',
  },
  todayButton: {
    minWidth: 110,
    height: 44,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: '#f3f6fb',
    borderWidth: 1,
    borderColor: '#d7e3f4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e4f8a',
  },
});
