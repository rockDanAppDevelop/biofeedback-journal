import {
  createPlannedPractice,
  listPlannedPracticesByDateKey,
} from '../data/firebase-planned-practices-repository';
import { getRoutineItemsForDate } from '../data/firebase-routines-repository';
import type { Routine } from '../types/routine.types';

export type ScheduleRoutineForDateSummary = {
  createdCount: number;
  skippedCount: number;
};

export async function scheduleRoutineForDate(
  routine: Routine,
  dateKey: string,
): Promise<ScheduleRoutineForDateSummary> {
  const routineItems = getRoutineItemsForDate(routine, dateKey);
  const existingPlannedPractices = await listPlannedPracticesByDateKey(dateKey);

  const existingRoutineItemIds = new Set(
    existingPlannedPractices
      .filter((practice) => practice.routineId === routine.id)
      .map((practice) => practice.routineItemId)
      .filter((routineItemId): routineItemId is string => routineItemId !== null),
  );

  const missingItems = routineItems.filter((item) => !existingRoutineItemIds.has(item.id));

  await Promise.all(
    missingItems.map((item) =>
      createPlannedPractice({
        dateKey,
        routineId: routine.id,
        routineItemId: item.id,
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
      }),
    ),
  );

  return {
    createdCount: missingItems.length,
    skippedCount: routineItems.length - missingItems.length,
  };
}
