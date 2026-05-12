export type RoutineTemplateItem = {
  id: string;

  dayOffset: number;
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

export type RoutineTemplate = {
  id: string;
  userId: string;
  name: string;
  cycleLengthDays: number;
  items: RoutineTemplateItem[];
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
};
