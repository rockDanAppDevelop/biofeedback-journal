import {
  getRoutineItemsForDate,
  listActiveRoutines,
} from '../data/firebase-routines-repository';
import { listBiofeedbackEntriesByDateKeyFromFirestore } from '../data/firebase-biofeedback-read-repository';
import { listPlannedPracticesByDateKey } from '../data/firebase-planned-practices-repository';
import { isPracticeRoutineItem } from './routine-item-kind';

export async function hasPlannedItemsForDate(dateKey: string): Promise<boolean> {
  const routines = await listActiveRoutines();
  const plannedRoutineItems = routines.flatMap((routine) =>
    getRoutineItemsForDate(routine, dateKey)
      .filter(isPracticeRoutineItem)
      .map((item) => ({
        routineId: routine.id,
        item,
      })),
  );

  if (plannedRoutineItems.length === 0) {
    return false;
  }

  const [plannedPractices, entries] = await Promise.all([
    listPlannedPracticesByDateKey(dateKey),
    listBiofeedbackEntriesByDateKeyFromFirestore(dateKey),
  ]);
  const entryIds = new Set(entries.map((entry) => entry.id));

  return plannedRoutineItems.some(({ routineId, item }) => {
    const matchingPlannedPractice = plannedPractices.find(
      (practice) =>
        practice.routineId === routineId &&
        practice.routineItemId === item.id &&
        practice.dateKey === dateKey,
    );

    return (
      matchingPlannedPractice?.completedEntryId == null ||
      !entryIds.has(matchingPlannedPractice.completedEntryId)
    );
  });
}
