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

export type BiofeedbackEntry = {
  id: string;

  measuredAt: string;
  dateKey: string;
  timeOfDay: TimeOfDay;

  exerciseName: string;
  durationMinutes: number;

  hrvDistribution: HrvDistribution;
  rlx: RlxMetrics;

  notes: string;

  rawSourceData?: Record<string, unknown>;

  createdAt: string;
  updatedAt: string;
};