// src\features\biofeedback\forms\biofeedback-entry-form.defaults.ts

import { BiofeedbackEntryFormValues } from '../types/biofeedback-entry-form.types';

function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function toTimeInputValue(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${hours}:${minutes}`;
}

export function createDefaultBiofeedbackEntryFormValues(): BiofeedbackEntryFormValues {
  const now = new Date();

  return {
    measurementDate: toDateInputValue(now),
    measurementTime: toTimeInputValue(now),
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