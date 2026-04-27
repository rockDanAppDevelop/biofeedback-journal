export type RoutineItem = {
  id: string;
  sortOrder: number;

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
};

export type Routine = {
  id: string;
  userId: string;
  name: string;
  isActive: boolean;
  items: RoutineItem[];
  createdAt: string;
  updatedAt: string;
};
