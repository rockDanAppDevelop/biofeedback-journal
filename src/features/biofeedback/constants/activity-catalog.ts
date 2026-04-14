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
    id: 'muscle_tension_no_clench',
    activityType: 'training',
    categoryId: 'trainers',
    label: 'מאמן מתח שרירים ללא כיווץ',
    measurementType: 'rlx',
    exerciseType: 'preset',
    isActive: true,
  },
  {
    id: 'muscle_tension_with_clench',
    activityType: 'training',
    categoryId: 'trainers',
    label: 'מאמן מתח שרירים עם כיווץ',
    measurementType: 'rlx',
    exerciseType: 'preset',
    isActive: true,
  },
  {
    id: 'sleep_coach',
    activityType: 'training',
    categoryId: 'trainers',
    label: 'מאמן שינה',
    measurementType: 'hrv',
    exerciseType: 'preset',
    isActive: true,
  },
  {
    id: 'manual_pacing',
    activityType: 'training',
    categoryId: 'trainers',
    label: 'מאמן קצב ידני',
    measurementType: 'hrv',
    exerciseType: 'preset',
    isActive: true,
  },
  {
    id: 'breathing_pacer',
    activityType: 'training',
    categoryId: 'trainers',
    label: 'קוצב נשימה',
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
    id: 'custom_training',
    activityType: 'training',
    categoryId: 'custom',
    label: 'תרגיל מותאם אישית',
    measurementType: 'none',
    isActive: true,
  },
  {
    id: 'floating_thoughts_on_water',
    activityType: 'training',
    categoryId: 'relaxation',
    label: 'מחשבות צפות על המים',
    measurementType: 'rlx',
    exerciseType: 'preset',
    isActive: true,
  },
  {
    id: 'warming_hands',
    activityType: 'training',
    categoryId: 'relaxation',
    label: 'חימום כפות ידיים',
    measurementType: 'rlx',
    exerciseType: 'preset',
    isActive: true,
  },
  {
    id: 'safe_place',
    activityType: 'training',
    categoryId: 'relaxation',
    label: 'יצירת מקום בטוח',
    measurementType: 'rlx',
    exerciseType: 'preset',
    isActive: true,
  },
  {
    id: 'guided_reduce_arousal',
    activityType: 'training',
    categoryId: 'guided',
    label: 'מונחה: הפחתת עוררות',
    measurementType: 'rlx',
    exerciseType: 'preset',
    isActive: true,
  },
  {
    id: 'candy_crush',
    activityType: 'training',
    categoryId: 'guided',
    label: 'קנדי קראש',
    measurementType: 'hrv',
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
