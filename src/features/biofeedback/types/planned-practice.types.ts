export type PlannedPractice = {
  id: string;
  userId: string;
  dateKey: string;

  activityType: 'training' | 'monitoring';
  measurementType: 'hrv' | 'rlx' | 'none';

  catalogItemId: string | null;
  userCustomActivityId: string | null;
  customExerciseName: string | null;

  monitoringType: 'morning' | 'short' | null;

  durationMinutes: number | null;

  exerciseParameters: {
    inhale?: number | null;
    holdAfterInhale?: number | null;
    exhale?: number | null;
    holdAfterExhale?: number | null;
  } | null;

  createdAt: string;
  updatedAt?: string;
};
