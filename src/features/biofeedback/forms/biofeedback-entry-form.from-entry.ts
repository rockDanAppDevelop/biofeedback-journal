//src\features\biofeedback\forms\biofeedback-entry-form.from-entry.ts

import { BiofeedbackEntry } from '../types/biofeedback-entry.types';
import { BiofeedbackEntryFormValues } from '../types/biofeedback-entry-form.types';

function toDateInputValue(isoString: string): string {
  return isoString.slice(0, 10);
}

function toTimeInputValue(isoString: string): string {
  return isoString.slice(11, 16);
}

export function createBiofeedbackEntryFormValuesFromEntry(
  entry: BiofeedbackEntry,
): BiofeedbackEntryFormValues {
  return {
    measurementDate: toDateInputValue(entry.measuredAt),
    measurementTime: toTimeInputValue(entry.measuredAt),
    selectedCategoryId: '',
    selectedCatalogItemId: entry.activity?.catalogItemId ?? '',
    userCustomActivityId: entry.activity?.userCustomActivityId ?? '',
    exerciseName: entry.exerciseName,
    customExerciseName: entry.activity?.customExerciseName ?? '',
    customMeasurementType:
      entry.activity?.measurementType === undefined ? '' : entry.activity.measurementType,
    breathingInhale:
      entry.activity?.exerciseParameters?.inhale === undefined ||
      entry.activity.exerciseParameters.inhale === null
        ? ''
        : String(entry.activity.exerciseParameters.inhale),
    breathingHoldAfterInhale:
      entry.activity?.exerciseParameters?.holdAfterInhale === undefined ||
      entry.activity.exerciseParameters.holdAfterInhale === null
        ? ''
        : String(entry.activity.exerciseParameters.holdAfterInhale),
    breathingExhale:
      entry.activity?.exerciseParameters?.exhale === undefined ||
      entry.activity.exerciseParameters.exhale === null
        ? ''
        : String(entry.activity.exerciseParameters.exhale),
    breathingHoldAfterExhale:
      entry.activity?.exerciseParameters?.holdAfterExhale === undefined ||
      entry.activity.exerciseParameters.holdAfterExhale === null
        ? ''
        : String(entry.activity.exerciseParameters.holdAfterExhale),
    monitoringType: entry.activity?.monitoringType ?? '',
    durationMinutes: entry.durationMinutes,
    hrvStressPercent:
      entry.hrvDistribution.stressPercent === null
        ? ''
        : String(entry.hrvDistribution.stressPercent),
    hrvMidRangePercent:
      entry.hrvDistribution.midRangePercent === null
        ? ''
        : String(entry.hrvDistribution.midRangePercent),
    hrvRelaxationPercent:
      entry.hrvDistribution.relaxationPercent === null
        ? ''
        : String(entry.hrvDistribution.relaxationPercent),
    rlxStartValue: entry.rlx.startValue === null ? '' : String(entry.rlx.startValue),
    rlxEndValue: entry.rlx.endValue === null ? '' : String(entry.rlx.endValue),
    notes: entry.notes,
  };
}
