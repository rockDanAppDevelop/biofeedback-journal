// src\features\biofeedback\forms\biofeedback-entry-form.validation.ts

import { BiofeedbackEntryFormValues } from '../types/biofeedback-entry-form.types';

export type ValidationErrorMap = Partial<Record<keyof BiofeedbackEntryFormValues, string>>;

function isValidDateInput(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isValidTimeInput(value: string): boolean {
  return /^\d{2}:\d{2}$/.test(value);
}

export function validateBiofeedbackEntryForm(
  values: BiofeedbackEntryFormValues,
): ValidationErrorMap {
  const errors: ValidationErrorMap = {};

  if (!values.measurementDate) {
    errors.measurementDate = 'יש לבחור תאריך';
  } else if (!isValidDateInput(values.measurementDate)) {
    errors.measurementDate = 'פורמט תאריך צריך להיות YYYY-MM-DD';
  }

  if (!values.measurementTime) {
    errors.measurementTime = 'יש לבחור שעה';
  } else if (!isValidTimeInput(values.measurementTime)) {
    errors.measurementTime = 'פורמט שעה צריך להיות HH:mm';
  }

  if (!values.exerciseName.trim()) {
    errors.exerciseName = 'יש להזין שם תרגיל או סוג מדידה';
  }

  if (!Number.isFinite(values.durationMinutes) || values.durationMinutes <= 0) {
    errors.durationMinutes = 'משך הזמן חייב להיות גדול מ-0';
  }

  const stress = values.hrvStressPercent === '' ? null : Number(values.hrvStressPercent);
  const mid = values.hrvMidRangePercent === '' ? null : Number(values.hrvMidRangePercent);
  const relax = values.hrvRelaxationPercent === '' ? null : Number(values.hrvRelaxationPercent);

  const hrvValues = [stress, mid, relax];

  for (const value of hrvValues) {
    if (value !== null && (!Number.isFinite(value) || value < 0 || value > 100)) {
      errors.hrvStressPercent ||= 'ערכי HRV חייבים להיות בין 0 ל-100';
      errors.hrvMidRangePercent ||= 'ערכי HRV חייבים להיות בין 0 ל-100';
      errors.hrvRelaxationPercent ||= 'ערכי HRV חייבים להיות בין 0 ל-100';
      break;
    }
  }

  if (stress !== null && mid !== null && relax !== null) {
    const total = stress + mid + relax;
    if (total < 99 || total > 101) {
      errors.hrvRelaxationPercent = 'סכום שלושת אחוזי HRV צריך להיות 100';
    }
  }

  const rlxStart = values.rlxStartValue === '' ? null : Number(values.rlxStartValue);
  const rlxEnd = values.rlxEndValue === '' ? null : Number(values.rlxEndValue);

  if (rlxStart !== null && !Number.isFinite(rlxStart)) {
    errors.rlxStartValue = 'ערך RLX התחלתי חייב להיות מספר';
  }

  if (rlxEnd !== null && !Number.isFinite(rlxEnd)) {
    errors.rlxEndValue = 'ערך RLX סיום חייב להיות מספר';
  }

  return errors;
}