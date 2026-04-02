// src\features\biofeedback\types\biofeedback-entry-form.types.ts

export type BiofeedbackEntryFormValues = {
  measuredAt: string;
  exerciseName: string;
  durationMinutes: number;
  hrvStressPercent: string;
  hrvMidRangePercent: string;
  hrvRelaxationPercent: string;
  rlxStartValue: string;
  rlxEndValue: string;
  notes: string;
};