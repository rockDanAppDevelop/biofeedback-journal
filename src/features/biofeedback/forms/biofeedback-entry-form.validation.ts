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

function toOptionalNumber(value: string): number | null {
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
    errors.measurementDate = '׳³ג„¢׳³ֲ© ׳³ֲ׳³ג€˜׳³ג€”׳³ג€¢׳³ֲ¨ ׳³ֳ—׳³ֲ׳³ֲ¨׳³ג„¢׳³ֲ';
  } else if (!isValidDateInput(values.measurementDate)) {
    errors.measurementDate = '׳³ג‚×׳³ג€¢׳³ֲ¨׳³ֲ׳³ֻ ׳³ֳ—׳³ֲ׳³ֲ¨׳³ג„¢׳³ֲ ׳³ֲ¦׳³ֲ¨׳³ג„¢׳³ֲ ׳³ֲ׳³ג€׳³ג„¢׳³ג€¢׳³ֳ— YYYY-MM-DD';
  }

  if (!values.measurementTime) {
    errors.measurementTime = '׳³ג„¢׳³ֲ© ׳³ֲ׳³ג€˜׳³ג€”׳³ג€¢׳³ֲ¨ ׳³ֲ©׳³ֲ¢׳³ג€';
  } else if (!isValidTimeInput(values.measurementTime)) {
    errors.measurementTime = '׳³ג‚×׳³ג€¢׳³ֲ¨׳³ֲ׳³ֻ ׳³ֲ©׳³ֲ¢׳³ג€ ׳³ֲ¦׳³ֲ¨׳³ג„¢׳³ֲ ׳³ֲ׳³ג€׳³ג„¢׳³ג€¢׳³ֳ— HH:mm';
  }

  if (!values.exerciseName.trim()) {
    errors.exerciseName = '׳³ג„¢׳³ֲ© ׳³ֲ׳³ג€׳³ג€“׳³ג„¢׳³ֲ ׳³ֲ©׳³ֲ ׳³ֳ—׳³ֲ¨׳³ג€™׳³ג„¢׳³ֲ ׳³ֲ׳³ג€¢ ׳³ֲ¡׳³ג€¢׳³ג€™ ׳³ֲ׳³ג€׳³ג„¢׳³ג€׳³ג€';
  }

  if (
    values.selectedCategoryId === 'custom' &&
    !values.customExerciseName.trim() &&
    !values.exerciseName.trim()
  ) {
    errors.customExerciseName = 'הזן שם לתרגיל האישי';
  }

  if (values.selectedCategoryId === 'custom' && values.customMeasurementType === '') {
    errors.customMeasurementType = 'בחר סוג מדידה לתרגיל האישי';
  }

  if (values.selectedCategoryId === 'monitoring' && values.monitoringType === '') {
    errors.monitoringType = 'בחר סוג ניטור';
  }

  if (!Number.isFinite(values.durationMinutes) || values.durationMinutes <= 0) {
    errors.durationMinutes = '׳³ֲ׳³ֲ©׳³ֲ ׳³ג€׳³ג€“׳³ֲ׳³ֲ ׳³ג€”׳³ג„¢׳³ג„¢׳³ג€˜ ׳³ֲ׳³ג€׳³ג„¢׳³ג€¢׳³ֳ— ׳³ג€™׳³ג€׳³ג€¢׳³ֲ ׳³ֲ-0';
  }

  const stress = values.hrvStressPercent === '' ? null : Number(values.hrvStressPercent);
  const mid = values.hrvMidRangePercent === '' ? null : Number(values.hrvMidRangePercent);
  const relax = values.hrvRelaxationPercent === '' ? null : Number(values.hrvRelaxationPercent);

  const rlxStart = values.rlxStartValue === '' ? null : Number(values.rlxStartValue);
  const rlxEnd = values.rlxEndValue === '' ? null : Number(values.rlxEndValue);
  const breathingInhale = toOptionalNumber(values.breathingInhale);
  const breathingHoldAfterInhale = toOptionalNumber(values.breathingHoldAfterInhale);
  const breathingExhale = toOptionalNumber(values.breathingExhale);
  const breathingHoldAfterExhale = toOptionalNumber(values.breathingHoldAfterExhale);

  if (rlxStart !== null && !Number.isFinite(rlxStart)) {
    errors.rlxStartValue = '׳³ֲ¢׳³ֲ¨׳³ֲ RLX ׳³ג€׳³ֳ—׳³ג€”׳³ֲ׳³ֳ—׳³ג„¢ ׳³ג€”׳³ג„¢׳³ג„¢׳³ג€˜ ׳³ֲ׳³ג€׳³ג„¢׳³ג€¢׳³ֳ— ׳³ֲ׳³ֲ¡׳³ג‚×׳³ֲ¨';
  }

  if (rlxEnd !== null && !Number.isFinite(rlxEnd)) {
    errors.rlxEndValue = '׳³ֲ¢׳³ֲ¨׳³ֲ RLX ׳³ֲ¡׳³ג„¢׳³ג€¢׳³ֲ ׳³ג€”׳³ג„¢׳³ג„¢׳³ג€˜ ׳³ֲ׳³ג€׳³ג„¢׳³ג€¢׳³ֳ— ׳³ֲ׳³ֲ¡׳³ג‚×׳³ֲ¨';
  }

  if (values.breathingInhale !== '' && breathingInhale === null) {
    errors.breathingInhale = '׳³ג„¢׳³ֲ© ׳³ֲ׳³ג€׳³ג€“׳³ג„¢׳³ֲ ׳³ֲ¢׳³ֲ¨׳³ֲ ׳³ֲ׳³ֲ¡׳³ג‚×׳³ֲ¨׳³ג„¢';
  }

  if (values.breathingHoldAfterInhale !== '' && breathingHoldAfterInhale === null) {
    errors.breathingHoldAfterInhale = '׳³ג„¢׳³ֲ© ׳³ֲ׳³ג€׳³ג€“׳³ג„¢׳³ֲ ׳³ֲ¢׳³ֲ¨׳³ֲ ׳³ֲ׳³ֲ¡׳³ג‚×׳³ֲ¨׳³ג„¢';
  }

  if (values.breathingExhale !== '' && breathingExhale === null) {
    errors.breathingExhale = '׳³ג„¢׳³ֲ© ׳³ֲ׳³ג€׳³ג€“׳³ג„¢׳³ֲ ׳³ֲ¢׳³ֲ¨׳³ֲ ׳³ֲ׳³ֲ¡׳³ג‚×׳³ֲ¨׳³ג„¢';
  }

  if (values.breathingHoldAfterExhale !== '' && breathingHoldAfterExhale === null) {
    errors.breathingHoldAfterExhale = '׳³ג„¢׳³ֲ© ׳³ֲ׳³ג€׳³ג€“׳³ג„¢׳³ֲ ׳³ֲ¢׳³ֲ¨׳³ֲ ׳³ֲ׳³ֲ¡׳³ג‚×׳³ֲ¨׳³ג„¢';
  }

  const hasStress = stress !== null;
  const hasMid = mid !== null;
  const hasRelax = relax !== null;

  if (hasStress && (stress < 0 || stress > 100)) {
    errors.hrvStressPercent = '׳³ג„¢׳³ֲ© ׳³ֲ׳³ג€׳³ג€“׳³ג„¢׳³ֲ ׳³ֲ¢׳³ֲ¨׳³ֲ ׳³ג€˜׳³ג„¢׳³ֲ 0 ׳³ֲ-100';
  }

  if (hasMid && (mid < 0 || mid > 100)) {
    errors.hrvMidRangePercent = '׳³ג„¢׳³ֲ© ׳³ֲ׳³ג€׳³ג€“׳³ג„¢׳³ֲ ׳³ֲ¢׳³ֲ¨׳³ֲ ׳³ג€˜׳³ג„¢׳³ֲ 0 ׳³ֲ-100';
  }

  if (hasRelax && (relax < 0 || relax > 100)) {
    errors.hrvRelaxationPercent = '׳³ג„¢׳³ֲ© ׳³ֲ׳³ג€׳³ג€“׳³ג„¢׳³ֲ ׳³ֲ¢׳³ֲ¨׳³ֲ ׳³ג€˜׳³ג„¢׳³ֲ 0 ׳³ֲ-100';
  }

  const hasExtraValues = hasStress || hasMid;

  if (!hasRelax && hasExtraValues) {
    errors.hrvRelaxationPercent = '׳³ֲ׳³ֲ ׳³ֲ׳³ג€“׳³ג„¢׳³ֲ ׳³ג„¢׳³ֲ ׳³ג€˜׳³ג„¢׳³ֲ ׳³ג„¢׳³ג„¢׳³ֲ ׳³ֲ׳³ג€¢ ׳³ֲ׳³ג€”׳³ֲ¥, ׳³ֲ¦׳³ֲ¨׳³ג„¢׳³ֲ ׳³ג€™׳³ֲ ׳³ֲ¢׳³ֲ¨׳³ֲ ׳³ֲ¨׳³ג€™׳³ג„¢׳³ֲ¢׳³ג€';
  }

  if (hasRelax && hasExtraValues) {
    const total = (stress ?? 0) + (mid ?? 0) + (relax ?? 0);

    if (Math.abs(total - 100) > 2) {
      const message = '׳³ג€÷׳³ֲ©׳³ֲ׳³ֲ׳³ֲ׳³ֲ׳³ג„¢׳³ֲ ׳³ג„¢׳³ג€¢׳³ֳ—׳³ֲ¨ ׳³ֲ׳³ֲ¨׳³ג€™׳³ג„¢׳³ֲ¢׳³ג€ ׳³ג€˜׳³ֲ׳³ג€˜׳³ג€, ׳³ג€׳³ֲ¡׳³ג€÷׳³ג€¢׳³ֲ ׳³ֲ¦׳³ֲ¨׳³ג„¢׳³ֲ ׳³ֲ׳³ג€׳³ג„¢׳³ג€¢׳³ֳ— 100 ׳³ֲ¢׳³ֲ ׳³ֲ¡׳³ֻ׳³ג„¢׳³ג„¢׳³ג€ ׳³ֲ©׳³ֲ ׳³ֲ¢׳³ג€ 2';

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
