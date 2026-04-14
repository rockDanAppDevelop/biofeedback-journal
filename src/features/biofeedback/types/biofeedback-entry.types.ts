// src\features\biofeedback\types\biofeedback-entry.types.ts

export type TimeOfDay = 'morning' | 'noon' | 'evening' | 'night';

export type HrvDistribution = {
  stressPercent: number | null;
  midRangePercent: number | null;
  relaxationPercent: number | null;
};

export type RlxMetrics = {
  startValue: number | null;
  endValue: number | null;
};

export type EntryActivity = {
  activityType: 'training' | 'monitoring';
  catalogItemId: string | null;
  userCustomActivityId: string | null;
  measurementType: 'hrv' | 'rlx' | 'none';
  customExerciseName: string | null;
  exerciseParameters: {
    inhale?: number | null;
    holdAfterInhale?: number | null;
    exhale?: number | null;
    holdAfterExhale?: number | null;
  } | null;
  monitoringType: 'morning' | 'short' | null;
};

export type BiofeedbackEntry = {
  id: string;

  userId: string; // נ‘ˆ ׳—׳“׳©

  measuredAt: string;
  dateKey: string;
  timeOfDay: TimeOfDay;

  activity?: EntryActivity;
  exerciseName: string;
  measurementType: 'hrv' | 'rlx' | null;
  durationMinutes: number;

  hrvDistribution: HrvDistribution;
  rlx: RlxMetrics;

  notes: string;

  rawSourceData?: Record<string, unknown>;

  createdAt: string;
  updatedAt: string;
};
