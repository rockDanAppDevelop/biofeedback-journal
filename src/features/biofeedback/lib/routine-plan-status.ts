import {
  getRoutineItemsForDate,
  listActiveRoutines,
} from '../data/firebase-routines-repository';

export async function hasPlannedItemsForDate(dateKey: string): Promise<boolean> {
  const routines = await listActiveRoutines();

  return routines.some((routine) => getRoutineItemsForDate(routine, dateKey).length > 0);
}
