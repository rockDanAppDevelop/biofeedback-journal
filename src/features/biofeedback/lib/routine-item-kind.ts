import type { RoutineItem } from '../types/routine.types';

export function isPracticeRoutineItem(item: RoutineItem): boolean {
  return item.activityType === 'training';
}
