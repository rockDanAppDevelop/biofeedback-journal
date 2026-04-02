// src\features\biofeedback\forms\biofeedback-entry-form.mapper.ts

import { BiofeedbackEntryFormValues } from '../types/biofeedback-entry-form.types';

export type CreateBiofeedbackEntryInput = {
  measuredAt: string;
  exerciseName: string;
  durationMinutes?: number;
  hrvDistribution: {
    stressPercent: number | null;
    midRangePercent: number | null;
    relaxationPercent: number | null;
  };
  rlx: {
    startValue: number | null;
    endValue: number | null;
  };
  notes?: string;
  rawSourceData?: Record<string, unknown>;
};

export function toCreateBiofeedbackEntryInput(
  values: BiofeedbackEntryFormValues,
): CreateBiofeedbackEntryInput {
  return {
    measuredAt: values.measuredAt,
    exerciseName: values.exerciseName.trim(),
    durationMinutes: values.durationMinutes || 8,
    hrvDistribution: {
      stressPercent: values.hrvStressPercent === '' ? null : Number(values.hrvStressPercent),
      midRangePercent: values.hrvMidRangePercent === '' ? null : Number(values.hrvMidRangePercent),
      relaxationPercent:
        values.hrvRelaxationPercent === '' ? null : Number(values.hrvRelaxationPercent),
    },
    rlx: {
      startValue: values.rlxStartValue === '' ? null : Number(values.rlxStartValue),
      endValue: values.rlxEndValue === '' ? null : Number(values.rlxEndValue),
    },
    notes: values.notes.trim(),
  };
}