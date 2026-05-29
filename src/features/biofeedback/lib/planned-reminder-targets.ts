import {
  createPlannedPractice,
  listPlannedPracticesByDateKey,
} from '../data/firebase-planned-practices-repository';
import { listBiofeedbackEntriesByDateKeyFromFirestore } from '../data/firebase-biofeedback-read-repository';
import {
  getRoutineItemsForDate,
  listActiveRoutines,
} from '../data/firebase-routines-repository';
import { ACTIVITY_CATALOG } from '../constants/activity-catalog';
import type { PlannedPractice } from '../types/planned-practice.types';
import type { RoutineItem } from '../types/routine.types';
import { isPracticeRoutineItem } from './routine-item-kind';

export type PlannedReminderTarget = {
  plannedPracticeId: string;
  dateKey: string;
  routineId: string;
  routineItemId: string;
  label: string;
};

function getPlannedPracticeKey(
  routineId: string,
  routineItemId: string,
  dateKey: string,
): string {
  return `${routineId}:${routineItemId}:${dateKey}`;
}

function getPlannedPracticeKeyFromPractice(
  practice: PlannedPractice,
): string | null {
  if (!practice.routineId || !practice.routineItemId) {
    return null;
  }

  return getPlannedPracticeKey(
    practice.routineId,
    practice.routineItemId,
    practice.dateKey,
  );
}

function isPlannedPracticeCompleted(
  practice: PlannedPractice,
  entryIds: Set<string>,
): boolean {
  return (
    practice.completedEntryId !== null &&
    entryIds.has(practice.completedEntryId)
  );
}

function toCreatePlannedPracticeInput(
  routineId: string,
  routineItemId: string,
  dateKey: string,
  item: RoutineItem,
) {
  return {
    dateKey,
    routineId,
    routineItemId,
    sortOrder: item.sortOrder,
    activityType: item.activityType,
    measurementType: item.measurementType,
    catalogItemId: item.catalogItemId,
    userCustomActivityId: item.userCustomActivityId,
    customExerciseName: item.customExerciseName,
    monitoringType: item.monitoringType,
    durationMinutes: item.durationMinutes,
    exerciseParameters: item.exerciseParameters,
    completedEntryId: null,
  };
}

function getMonitoringLabel(
  monitoringType: PlannedPractice['monitoringType'],
): string | null {
  if (monitoringType === 'morning') {
    return 'ניטור בוקר';
  }

  if (monitoringType === 'short') {
    return 'ניטור קצר';
  }

  if (monitoringType === 'resting_heart_rate') {
    return 'ניטור דופק מנוחה';
  }

  return null;
}

function getPlannedPracticeLabel(
  plannedPractice: PlannedPractice,
  item: RoutineItem,
): string {
  if (plannedPractice.customExerciseName) {
    return plannedPractice.customExerciseName;
  }

  if (item.customExerciseName) {
    return item.customExerciseName;
  }

  const catalogItemId = plannedPractice.catalogItemId ?? item.catalogItemId;
  const catalogItem = catalogItemId
    ? ACTIVITY_CATALOG.find((currentItem) => currentItem.id === catalogItemId)
    : null;

  if (catalogItem) {
    return catalogItem.label;
  }

  return (
    getMonitoringLabel(plannedPractice.monitoringType ?? item.monitoringType) ??
    'תרגול מתוכנן'
  );
}

export async function getPlannedReminderTargetsForDate(
  dateKey: string,
): Promise<PlannedReminderTarget[]> {
  const [routines, plannedPractices, entries] = await Promise.all([
    listActiveRoutines(),
    listPlannedPracticesByDateKey(dateKey),
    listBiofeedbackEntriesByDateKeyFromFirestore(dateKey),
  ]);
  const entryIds = new Set(entries.map((entry) => entry.id));
  const plannedPracticesByKey = new Map<string, PlannedPractice[]>();

  plannedPractices.forEach((practice) => {
    const key = getPlannedPracticeKeyFromPractice(practice);

    if (!key) {
      return;
    }

    const currentPractices = plannedPracticesByKey.get(key) ?? [];
    plannedPracticesByKey.set(key, [...currentPractices, practice]);
  });

  const targets: PlannedReminderTarget[] = [];
  const seenKeys = new Set<string>();

  for (const routine of routines) {
    const routineItems = getRoutineItemsForDate(routine, dateKey).filter(isPracticeRoutineItem);

    for (const item of routineItems) {
      const key = getPlannedPracticeKey(routine.id, item.id, dateKey);

      if (seenKeys.has(key)) {
        continue;
      }

      seenKeys.add(key);

      const matchingPractices = plannedPracticesByKey.get(key) ?? [];
      const plannedPractice =
        matchingPractices.find((practice) =>
          !isPlannedPracticeCompleted(practice, entryIds),
        ) ??
        matchingPractices[0] ??
        await createPlannedPractice(
          toCreatePlannedPracticeInput(routine.id, item.id, dateKey, item),
        );

      if (isPlannedPracticeCompleted(plannedPractice, entryIds)) {
        continue;
      }

      targets.push({
        plannedPracticeId: plannedPractice.id,
        dateKey,
        routineId: routine.id,
        routineItemId: item.id,
        label: getPlannedPracticeLabel(plannedPractice, item),
      });
    }
  }

  return targets;
}
