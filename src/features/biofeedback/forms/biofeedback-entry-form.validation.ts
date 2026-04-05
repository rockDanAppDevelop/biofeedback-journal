// src\features\biofeedback\forms\biofeedback-entry-form.validation.ts

import { BiofeedbackEntryFormValues } from '../types/biofeedback-entry-form.types';

export type ValidationErrorMap = Partial<Record<keyof BiofeedbackEntryFormValues, string>>;

function isValidDateInput(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isValidTimeInput(value: string): boolean {
  return /^\d{2}:\d{2}$/.test(value);
}

function toOptionalPercent(value: string): number | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);

  if (Number.isNaN(parsed)) {
    return null;
  }

  return parsed;
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

  const rlxStart = values.rlxStartValue === '' ? null : Number(values.rlxStartValue);
  const rlxEnd = values.rlxEndValue === '' ? null : Number(values.rlxEndValue);

  if (rlxStart !== null && !Number.isFinite(rlxStart)) {
    errors.rlxStartValue = 'ערך RLX התחלתי חייב להיות מספר';
  }

  if (rlxEnd !== null && !Number.isFinite(rlxEnd)) {
    errors.rlxEndValue = 'ערך RLX סיום חייב להיות מספר';
  }

const hasStress = stress !== null;
const hasMid = mid !== null;
const hasRelax = relax !== null;

if (hasStress && (stress < 0 || stress > 100)) {
  errors.hrvStressPercent = 'יש להזין ערך בין 0 ל-100';
}

if (hasMid && (mid < 0 || mid > 100)) {
  errors.hrvMidRangePercent = 'יש להזין ערך בין 0 ל-100';
}

if (hasRelax && (relax < 0 || relax > 100)) {
  errors.hrvRelaxationPercent = 'יש להזין ערך בין 0 ל-100';
}

const hasExtraValues = hasStress || hasMid;

if (!hasRelax && hasExtraValues) {
  errors.hrvRelaxationPercent = 'אם מזינים ביניים או לחץ, צריך גם ערך רגיעה';
}

if (hasRelax && hasExtraValues) {
  const total = (stress ?? 0) + (mid ?? 0) + (relax ?? 0);

  if (Math.abs(total - 100) > 2) {
    const message = 'כשממלאים יותר מרגיעה בלבד, הסכום צריך להיות 100 עם סטייה של עד 2';

    if (!errors.hrvRelaxationPercent) {
      errors.hrvRelaxationPercent = message;
    }

    if (!errors.hrvMidRangePercent) {
      errors.hrvMidRangePercent = message;
    }

    if (!errors.hrvStressPercent) {
      errors.hrvStressPercent = message;
    }
  }
}

return errors;
}
