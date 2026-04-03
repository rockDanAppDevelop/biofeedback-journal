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
    exerciseName: entry.exerciseName,
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