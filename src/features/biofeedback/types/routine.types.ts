export type RoutineItem = {
  id: string;

  dayOffset: number;
  sortOrder: number;

  effectiveFromDateKey: string;
  removedFromDateKey: string | null;

  activityType: 'training' | 'monitoring';
  measurementType: 'hrv' | 'rlx' | 'none';

  catalogItemId: string | null;
  userCustomActivityId: string | null;
  customExerciseName: string | null;

  monitoringType: 'morning' | 'short' | 'resting_heart_rate' | null;

  durationMinutes: number | null;

  exerciseParameters: {
    inhale?: number | null;
    holdAfterInhale?: number | null;
    exhale?: number | null;
    holdAfterExhale?: number | null;
  } | null;
};

export type Routine = {
  id: string;
  userId: string;
  name: string;
  isActive: boolean;
  startDateKey: string;
  cycleLengthDays: number;
  items: RoutineItem[];
  createdAt: string;
  updatedAt: string;
};
