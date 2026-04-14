// src\features\biofeedback\forms\biofeedback-entry-form.mapper.ts

import { ACTIVITY_CATALOG } from '../constants/activity-catalog';
import { BiofeedbackEntryFormValues } from '../types/biofeedback-entry-form.types';
import type { EntryActivity } from '../types/biofeedback-entry.types';

export type CreateBiofeedbackEntryInput = {
  measuredAt: string;
  exerciseName: string;
  activity?: EntryActivity;
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

function buildMeasuredAt(dateValue: string, timeValue: string): string {
  return `${dateValue}T${timeValue}:00`;
}

export function toCreateBiofeedbackEntryInput(
  values: BiofeedbackEntryFormValues,
): CreateBiofeedbackEntryInput {
  const selectedCatalogItem =
    values.selectedCatalogItemId !== ''
      ? ACTIVITY_CATALOG.find((item) => item.id === values.selectedCatalogItemId) ?? null
      : null;

  const finalMeasurementType: 'hrv' | 'rlx' | 'none' | null =
    values.selectedCategoryId === 'monitoring'
      ? 'none'
      : values.selectedCategoryId === 'custom'
        ? values.customMeasurementType !== ''
          ? values.customMeasurementType
          : null
        : selectedCatalogItem
          ? selectedCatalogItem.measurementType
          : null;

  const trimmedCustomExerciseName = values.customExerciseName.trim();
  const trimmedExerciseName = values.exerciseName.trim();

  const finalExerciseName = selectedCatalogItem
    ? selectedCatalogItem.label
    : values.selectedCategoryId === 'custom' && trimmedCustomExerciseName !== ''
      ? trimmedCustomExerciseName
      : trimmedExerciseName;

  return {
    measuredAt: buildMeasuredAt(values.measurementDate, values.measurementTime),
    exerciseName: finalExerciseName,
    measurementType: finalMeasurementType === 'none' ? null : finalMeasurementType,
    activity:
      values.selectedCategoryId !== '' ||
      values.selectedCatalogItemId !== '' ||
      values.userCustomActivityId !== '' ||
      values.customExerciseName.trim() !== '' ||
      values.monitoringType !== ''
        ? {
            activityType: values.selectedCategoryId === 'monitoring' ? 'monitoring' : 'training',
            catalogItemId: values.selectedCatalogItemId || null,
            userCustomActivityId: values.userCustomActivityId || null,
            measurementType: finalMeasurementType ?? 'none',
            customExerciseName: values.customExerciseName.trim() || null,
            exerciseParameters:
              values.breathingInhale !== '' ||
              values.breathingHoldAfterInhale !== '' ||
              values.breathingExhale !== '' ||
              values.breathingHoldAfterExhale !== ''
                ? {
                    inhale:
                      values.breathingInhale === '' ? null : Number(values.breathingInhale),
                    holdAfterInhale:
                      values.breathingHoldAfterInhale === ''
                        ? null
                        : Number(values.breathingHoldAfterInhale),
                    exhale:
                      values.breathingExhale === '' ? null : Number(values.breathingExhale),
                    holdAfterExhale:
                      values.breathingHoldAfterExhale === ''
                        ? null
                        : Number(values.breathingHoldAfterExhale),
                  }
                : null,
            monitoringType: values.monitoringType || null,
          }
        : undefined,
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
