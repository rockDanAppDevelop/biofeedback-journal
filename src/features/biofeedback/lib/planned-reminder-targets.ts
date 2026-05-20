import {
  createPlannedPractice,
  listPlannedPracticesByDateKey,
} from '../data/firebase-planned-practices-repository';
import { listBiofeedbackEntriesByDateKeyFromFirestore } from '../data/firebase-biofeedback-read-repository';
import {
  getRoutineItemsForDate,
  listActiveRoutines,
} from '../data/firebase-routines-repository';
import type { PlannedPractice } from '../types/planned-practice.types';
import type { RoutineItem } from '../types/routine.types';

export type PlannedReminderTarget = {
  plannedPracticeId: string;
  dateKey: string;
  routineId: string;
  routineItemId: string;
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
    const routineItems = getRoutineItemsForDate(routine, dateKey);

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
      });
    }
  }

  return targets;
}
