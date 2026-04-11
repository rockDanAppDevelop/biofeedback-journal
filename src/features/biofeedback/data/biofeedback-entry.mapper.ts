import type { BiofeedbackEntry } from '../types/biofeedback-entry.types';
import type { MeasurementType } from '../constants/exercise-options';
import { deriveTimeOfDay } from '../lib/biofeedback-date.utils';

export type FirebaseBiofeedbackEntryLike = {
  id: string;
  measurementDate?: string | null;
  measurementTime?: string | null;
  dateKey: string;
  measuredAt: string;
  exerciseName: string;
  measurementType?: MeasurementType | null;
  durationMinutes: number;
  hrvStressPercent?: string | null;
  hrvMidRangePercent?: string | null;
  hrvRelaxationPercent?: string | null;
  rlxStartValue?: string | null;
  rlxEndValue?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt?: string | null;
};

type MapOptions = {
  userId?: string | null;
};

export function toOptionalNumber(value: string | null | undefined): number | null {
  if (value === null || value === undefined) {
    return null;
  }

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

export function mapFirebaseBiofeedbackEntryToDomain(
  entry: FirebaseBiofeedbackEntryLike,
  options: MapOptions = {},
): BiofeedbackEntry {
  return {
    id: entry.id,
    userId: options.userId ?? '',
    measuredAt: entry.measuredAt,
    dateKey: entry.dateKey,
    timeOfDay: deriveTimeOfDay(entry.measuredAt),
    exerciseName: entry.exerciseName,
    measurementType: entry.measurementType ?? null,
    durationMinutes: entry.durationMinutes,
    hrvDistribution: {
      stressPercent: toOptionalNumber(entry.hrvStressPercent),
      midRangePercent: toOptionalNumber(entry.hrvMidRangePercent),
      relaxationPercent: toOptionalNumber(entry.hrvRelaxationPercent),
    },
    rlx: {
      startValue: toOptionalNumber(entry.rlxStartValue),
      endValue: toOptionalNumber(entry.rlxEndValue),
    },
    notes: entry.notes ?? '',
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt ?? entry.createdAt,
  };
}
