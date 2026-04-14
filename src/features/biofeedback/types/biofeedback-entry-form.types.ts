// src\features\biofeedback\types\biofeedback-entry-form.types.ts

export type BiofeedbackEntryFormValues = {
  measurementDate: string;
  measurementTime: string;
  selectedCategoryId: 'trainers' | 'relaxation' | 'guided' | 'monitoring' | 'custom' | '';
  selectedCatalogItemId: string;
  userCustomActivityId: string;
  exerciseName: string;
  customExerciseName: string;
  customMeasurementType: 'hrv' | 'rlx' | 'none' | '';
  breathingInhale: string;
  breathingHoldAfterInhale: string;
  breathingExhale: string;
  breathingHoldAfterExhale: string;
  monitoringType: 'morning' | 'short' | '';
  durationMinutes: number;
  hrvStressPercent: string;
  hrvMidRangePercent: string;
  hrvRelaxationPercent: string;
  rlxStartValue: string;
  rlxEndValue: string;
  notes: string;
};
