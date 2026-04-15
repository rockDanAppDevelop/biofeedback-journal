export type ActivityType = 'training' | 'monitoring';

export type ActivityCategoryId =
  | 'trainers'
  | 'relaxation'
  | 'guided'
  | 'monitoring'
  | 'custom';

export type CatalogMeasurementType = 'hrv' | 'rlx' | 'none';

export type TrainingExerciseType = 'preset' | 'parameterized';

export type MonitoringType = 'morning' | 'short';

export type ActivityParameterFieldId =
  | 'inhale'
  | 'holdAfterInhale'
  | 'exhale'
  | 'holdAfterExhale';

export type ActivityParameterSchemaField = {
  id: ActivityParameterFieldId;
  label: string;
  defaultValue: number;
};

export type ActivityCatalogItem =
  | {
      id: string;
      activityType: 'training';
      categoryId: Exclude<ActivityCategoryId, 'monitoring'>;
      label: string;
      measurementType: CatalogMeasurementType;
      exerciseType?: TrainingExerciseType;
      parameterSchema?: ActivityParameterSchemaField[];
      isActive: boolean;
    }
  | {
      id: string;
      activityType: 'monitoring';
      categoryId: 'monitoring';
      label: string;
      measurementType: 'none';
      monitoringType: MonitoringType;
      isActive: boolean;
    };

export const ACTIVITY_CATALOG: ActivityCatalogItem[] = [
  {
    id: 'muscle_tension_release_trainer',
    activityType: 'training',
    categoryId: 'trainers',
    label: 'מאמן לשחרור מתח שרירים',
    measurementType: 'rlx',
    exerciseType: 'preset',
    isActive: true,
  },
  {
    id: 'relaxation_trainer',
    activityType: 'training',
    categoryId: 'trainers',
    label: 'מאמן רגיעה',
    measurementType: 'hrv',
    exerciseType: 'preset',
    isActive: true,
  },
  {
    id: 'colors_trainer',
    activityType: 'training',
    categoryId: 'trainers',
    label: 'מאמן צבעים',
    measurementType: 'hrv',
    exerciseType: 'preset',
    isActive: true,
  },
  {
    id: 'aquariums_trainer',
    activityType: 'training',
    categoryId: 'trainers',
    label: 'מאמן אקווריומים',
    measurementType: 'hrv',
    exerciseType: 'preset',
    isActive: true,
  },
  {
    id: 'sleep_trainer',
    activityType: 'training',
    categoryId: 'trainers',
    label: 'מאמן שינה',
    measurementType: 'hrv',
    exerciseType: 'preset',
    isActive: true,
  },
  {
    id: 'relaxation_range_trainer',
    activityType: 'training',
    categoryId: 'trainers',
    label: 'מאמן טווחי רגיעה',
    measurementType: 'hrv',
    exerciseType: 'preset',
    isActive: true,
  },
  {
    id: 'candy_crush',
    activityType: 'training',
    categoryId: 'trainers',
    label: 'קנדי קראש',
    measurementType: 'hrv',
    exerciseType: 'preset',
    isActive: true,
  },
  {
    id: 'manual_pacing',
    activityType: 'training',
    categoryId: 'trainers',
    label: 'מאמן קוצב ידני',
    measurementType: 'hrv',
    exerciseType: 'parameterized',
    parameterSchema: [
      { id: 'inhale', label: 'שאיפה', defaultValue: 4 },
      { id: 'holdAfterInhale', label: 'עצירה אחרי שאיפה', defaultValue: 4 },
      { id: 'exhale', label: 'נשיפה', defaultValue: 4 },
      { id: 'holdAfterExhale', label: 'עצירה אחרי נשיפה', defaultValue: 4 },
    ],
    isActive: true,
  },
  {
    id: 'graphical_trainer',
    activityType: 'training',
    categoryId: 'trainers',
    label: 'מאמן גרפי',
    measurementType: 'hrv',
    exerciseType: 'preset',
    isActive: true,
  },
  {
    id: 'relaxation',
    activityType: 'training',
    categoryId: 'relaxation',
    label: 'רגיעה',
    measurementType: 'rlx',
    exerciseType: 'preset',
    isActive: true,
  },
  {
    id: 'body_scan_sleep_induction',
    activityType: 'training',
    categoryId: 'guided',
    label: 'סריקת גוף והשראת שינה',
    measurementType: 'rlx',
    exerciseType: 'preset',
    isActive: true,
  },
  {
    id: 'sleep_mindfulness',
    activityType: 'training',
    categoryId: 'guided',
    label: 'מיינדפולנס לשינה',
    measurementType: 'rlx',
    exerciseType: 'preset',
    isActive: true,
  },
  {
    id: 'sound_awareness',
    activityType: 'training',
    categoryId: 'guided',
    label: 'קשיבות לצלילים',
    measurementType: 'rlx',
    exerciseType: 'preset',
    isActive: true,
  },
  {
    id: 'progressive_muscle_relaxation',
    activityType: 'training',
    categoryId: 'guided',
    label: 'הרפיית שרירים מתקדמת',
    measurementType: 'rlx',
    exerciseType: 'preset',
    isActive: true,
  },
  {
    id: 'short_muscle_relaxation',
    activityType: 'training',
    categoryId: 'guided',
    label: 'הרפיית שרירים מקוצרת',
    measurementType: 'rlx',
    exerciseType: 'preset',
    isActive: true,
  },
  {
    id: 'reduce_arousal_training',
    activityType: 'training',
    categoryId: 'guided',
    label: 'אימון להפחתת עוררות',
    measurementType: 'rlx',
    exerciseType: 'preset',
    isActive: true,
  },
  {
    id: 'morning_monitoring',
    activityType: 'monitoring',
    categoryId: 'monitoring',
    label: 'ניטור בוקר',
    measurementType: 'none',
    monitoringType: 'morning',
    isActive: true,
  },
  {
    id: 'short_monitoring',
    activityType: 'monitoring',
    categoryId: 'monitoring',
    label: 'ניטור קצר',
    measurementType: 'none',
    monitoringType: 'short',
    isActive: true,
  },
];
