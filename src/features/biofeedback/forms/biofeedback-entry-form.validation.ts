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
    errors.measurementDate = '׳™׳© ׳׳‘׳—׳•׳¨ ׳×׳׳¨׳™׳';
  } else if (!isValidDateInput(values.measurementDate)) {
    errors.measurementDate = '׳₪׳•׳¨׳׳˜ ׳×׳׳¨׳™׳ ׳¦׳¨׳™׳ ׳׳”׳™׳•׳× YYYY-MM-DD';
  }

  if (!values.measurementTime) {
    errors.measurementTime = '׳™׳© ׳׳‘׳—׳•׳¨ ׳©׳¢׳”';
  } else if (!isValidTimeInput(values.measurementTime)) {
    errors.measurementTime = '׳₪׳•׳¨׳׳˜ ׳©׳¢׳” ׳¦׳¨׳™׳ ׳׳”׳™׳•׳× HH:mm';
  }

  if (!values.exerciseName.trim()) {
    errors.exerciseName = '׳™׳© ׳׳”׳–׳™׳ ׳©׳ ׳×׳¨׳’׳™׳ ׳׳• ׳¡׳•׳’ ׳׳“׳™׳“׳”';
  }

  if (
    values.selectedCategoryId === 'custom' &&
    !values.customExerciseName.trim() &&
    !values.exerciseName.trim()
  ) {
    errors.customExerciseName = '׳™׳© ׳׳”׳–׳™׳ ׳©׳ ׳׳×׳¨׳’׳™׳ ׳׳™׳©׳™';
  }

  if (values.selectedCategoryId === 'custom' && values.customMeasurementType === '') {
    errors.customMeasurementType = '׳™׳© ׳׳‘׳—׳•׳¨ ׳¡׳•׳’ ׳׳“׳™׳“׳” ׳׳×׳¨׳’׳™׳ ׳׳™׳©׳™';
  }

  if (values.selectedCategoryId === 'monitoring' && values.monitoringType === '') {
    errors.monitoringType = '׳™׳© ׳׳‘׳—׳•׳¨ ׳¡׳•׳’ ׳ ׳™׳˜׳•׳¨';
  }

  if (!Number.isFinite(values.durationMinutes) || values.durationMinutes <= 0) {
    errors.durationMinutes = '׳׳©׳ ׳”׳–׳׳ ׳—׳™׳™׳‘ ׳׳”׳™׳•׳× ׳’׳“׳•׳ ׳-0';
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
    errors.rlxStartValue = '׳¢׳¨׳ RLX ׳”׳×׳—׳׳×׳™ ׳—׳™׳™׳‘ ׳׳”׳™׳•׳× ׳׳¡׳₪׳¨';
  }

  if (rlxEnd !== null && !Number.isFinite(rlxEnd)) {
    errors.rlxEndValue = '׳¢׳¨׳ RLX ׳¡׳™׳•׳ ׳—׳™׳™׳‘ ׳׳”׳™׳•׳× ׳׳¡׳₪׳¨';
  }

  if (values.breathingInhale !== '' && breathingInhale === null) {
    errors.breathingInhale = '׳™׳© ׳׳”׳–׳™׳ ׳¢׳¨׳ ׳׳¡׳₪׳¨׳™';
  }

  if (values.breathingHoldAfterInhale !== '' && breathingHoldAfterInhale === null) {
    errors.breathingHoldAfterInhale = '׳™׳© ׳׳”׳–׳™׳ ׳¢׳¨׳ ׳׳¡׳₪׳¨׳™';
  }

  if (values.breathingExhale !== '' && breathingExhale === null) {
    errors.breathingExhale = '׳™׳© ׳׳”׳–׳™׳ ׳¢׳¨׳ ׳׳¡׳₪׳¨׳™';
  }

  if (values.breathingHoldAfterExhale !== '' && breathingHoldAfterExhale === null) {
    errors.breathingHoldAfterExhale = '׳™׳© ׳׳”׳–׳™׳ ׳¢׳¨׳ ׳׳¡׳₪׳¨׳™';
  }

  const hasStress = stress !== null;
  const hasMid = mid !== null;
  const hasRelax = relax !== null;

  if (hasStress && (stress < 0 || stress > 100)) {
    errors.hrvStressPercent = '׳™׳© ׳׳”׳–׳™׳ ׳¢׳¨׳ ׳‘׳™׳ 0 ׳-100';
  }

  if (hasMid && (mid < 0 || mid > 100)) {
    errors.hrvMidRangePercent = '׳™׳© ׳׳”׳–׳™׳ ׳¢׳¨׳ ׳‘׳™׳ 0 ׳-100';
  }

  if (hasRelax && (relax < 0 || relax > 100)) {
    errors.hrvRelaxationPercent = '׳™׳© ׳׳”׳–׳™׳ ׳¢׳¨׳ ׳‘׳™׳ 0 ׳-100';
  }

  const hasExtraValues = hasStress || hasMid;

  if (!hasRelax && hasExtraValues) {
    errors.hrvRelaxationPercent = '׳׳ ׳׳–׳™׳ ׳™׳ ׳‘׳™׳ ׳™׳™׳ ׳׳• ׳׳—׳¥, ׳¦׳¨׳™׳ ׳’׳ ׳¢׳¨׳ ׳¨׳’׳™׳¢׳”';
  }

  if (hasRelax && hasExtraValues) {
    const total = (stress ?? 0) + (mid ?? 0) + (relax ?? 0);

    if (Math.abs(total - 100) > 2) {
      const message = '׳›׳©׳׳׳׳׳™׳ ׳™׳•׳×׳¨ ׳׳¨׳’׳™׳¢׳” ׳‘׳׳‘׳“, ׳”׳¡׳›׳•׳ ׳¦׳¨׳™׳ ׳׳”׳™׳•׳× 100 ׳¢׳ ׳¡׳˜׳™׳™׳” ׳©׳ ׳¢׳“ 2';

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
