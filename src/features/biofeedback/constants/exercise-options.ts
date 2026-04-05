//src\features\biofeedback\constants\exercise-options.ts

export type MeasurementType = 'hrv' | 'rlx';

export type ExerciseOption = {
  id: string;
  label: string;
  measurementType: MeasurementType;
};

export const EXERCISE_OPTIONS: ExerciseOption[] = [
  { id: 'muscle_tension_no_clench', label: 'מאמן מתח שרירים ללא כיווץ', measurementType: 'rlx' },
  { id: 'muscle_tension_with_clench', label: 'מאמן מתח שרירים עם כיווץ', measurementType: 'rlx' },
  { id: 'sleep_coach', label: 'מאמן שינה', measurementType: 'hrv' },
  { id: 'floating_thoughts_on_water', label: 'מחשבות צפות על המים', measurementType: 'rlx' },
  { id: 'warming_hands', label: 'חימום כפות ידיים', measurementType: 'rlx' },
  { id: 'manual_pacing', label: 'מאמן קצב ידני', measurementType: 'hrv' },
  { id: 'safe_place', label: 'יצירת מקום בטוח', measurementType: 'rlx' },
  { id: 'guided_reduce_arousal', label: 'מונחה: הפחתת עוררות', measurementType: 'rlx' },
  { id: 'candy_crush', label: 'קנדי קראש', measurementType: 'hrv' },
];