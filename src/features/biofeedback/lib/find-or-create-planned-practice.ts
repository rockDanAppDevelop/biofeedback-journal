import {
  createPlannedPractice,
  listPlannedPracticesByDateKey,
} from '../data/firebase-planned-practices-repository';
import type { PlannedPractice } from '../types/planned-practice.types';
import type { RoutineItem } from '../types/routine.types';

type FindOrCreatePlannedPracticeForRoutineItemInput = {
  routineId: string;
  routineItemId: string;
  dateKey: string;
  item: RoutineItem;
};

export async function findOrCreatePlannedPracticeForRoutineItem({
  routineId,
  routineItemId,
  dateKey,
  item,
}: FindOrCreatePlannedPracticeForRoutineItemInput): Promise<PlannedPractice> {
  const plannedPractices = await listPlannedPracticesByDateKey(dateKey);
  const existingPractice = plannedPractices.find(
    (practice) =>
      practice.routineId === routineId &&
      practice.routineItemId === routineItemId &&
      practice.dateKey === dateKey,
  );

  if (existingPractice) {
    return existingPractice;
  }

  return createPlannedPractice({
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
  });
}
