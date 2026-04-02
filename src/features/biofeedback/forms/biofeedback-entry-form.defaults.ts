// src\features\biofeedback\forms\biofeedback-entry-form.defaults.ts

import { BiofeedbackEntryFormValues } from '../types/biofeedback-entry-form.types';

export function createDefaultBiofeedbackEntryFormValues(): BiofeedbackEntryFormValues {
  return {
    measuredAt: new Date().toISOString(),
    exerciseName: '',
    durationMinutes: 8,
    hrvStressPercent: '',
    hrvMidRangePercent: '',
    hrvRelaxationPercent: '',
    rlxStartValue: '',
    rlxEndValue: '',
    notes: '',
  };
}