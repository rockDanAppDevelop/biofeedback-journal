export type PlannedPractice = {
  id: string;
  userId: string;
  dateKey: string;

  routineId: string | null;
  routineItemId: string | null;
  sortOrder: number | null;

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

  completedEntryId: string | null;

  createdAt: string;
  updatedAt?: string;
};
