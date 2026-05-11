import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import {
  createRoutine,
  type CreateRoutineInput,
  type CreateRoutineItemInput,
} from './firebase-routines-repository';
import type { Routine, RoutineItem } from '../types/routine.types';

type RoutineTemplateItemJson = {
  dayOffset: number;
  sortOrder: number;
  activityType: RoutineItem['activityType'];
  measurementType: RoutineItem['measurementType'];
  catalogItemId: string | null;
  customExerciseName: string | null;
  monitoringType: RoutineItem['monitoringType'];
  durationMinutes: number | null;
  exerciseParameters: RoutineItem['exerciseParameters'];
};

type RoutineTemplateJson = {
  type: 'biofeedback-routine-template';
  schemaVersion: 1;
  exportedAt: string;
  name: string;
  cycleLengthDays: number;
  items: RoutineTemplateItemJson[];
};

export type RoutineTemplatePreview = {
  name: string;
  cycleLengthDays: number;
  items: RoutineTemplateItemJson[];
};

const TEMPLATE_TYPE = 'biofeedback-routine-template';
const TEMPLATE_SCHEMA_VERSION = 1;
const MAX_TEMPLATE_ITEMS = 200;

const EXERCISE_PARAMETER_KEYS = [
  'inhale',
  'holdAfterInhale',
  'exhale',
  'holdAfterExhale',
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function assertString(value: unknown, fieldName: string): string {
  if (typeof value !== 'string') {
    throw new Error(`${fieldName} must be a string`);
  }

  return value;
}

function assertStringOrNull(value: unknown, fieldName: string): string | null {
  if (value === null || typeof value === 'string') {
    return value;
  }

  throw new Error(`${fieldName} must be a string or null`);
}

function assertIntegerInRange(
  value: unknown,
  fieldName: string,
  min: number,
  max: number,
): number {
  if (!Number.isInteger(value) || typeof value !== 'number' || value < min || value > max) {
    throw new Error(`${fieldName} must be an integer between ${min} and ${max}`);
  }

  return value;
}

function assertPositiveNumberOrNull(value: unknown, fieldName: string): number | null {
  if (value === null) {
    return null;
  }

  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return value;
  }

  throw new Error(`${fieldName} must be a positive number or null`);
}

function assertActivityType(value: unknown): RoutineItem['activityType'] {
  if (value === 'training' || value === 'monitoring') {
    return value;
  }

  throw new Error('activityType is invalid');
}

function assertMeasurementType(value: unknown): RoutineItem['measurementType'] {
  if (value === 'hrv' || value === 'rlx' || value === 'none') {
    return value;
  }

  throw new Error('measurementType is invalid');
}

function assertMonitoringType(value: unknown): RoutineItem['monitoringType'] {
  if (value === 'morning' || value === 'short' || value === null) {
    return value;
  }

  throw new Error('monitoringType is invalid');
}

function sanitizeExerciseParameters(value: unknown): RoutineItem['exerciseParameters'] {
  if (value === null) {
    return null;
  }

  if (!isRecord(value)) {
    throw new Error('exerciseParameters must be an object or null');
  }

  const nextParameters: NonNullable<RoutineItem['exerciseParameters']> = {};

  for (const key of EXERCISE_PARAMETER_KEYS) {
    const parameterValue = value[key];

    if (parameterValue === undefined) {
      continue;
    }

    if (parameterValue !== null && typeof parameterValue !== 'number') {
      throw new Error(`exerciseParameters.${key} must be a number or null`);
    }

    nextParameters[key] = parameterValue;
  }

  return nextParameters;
}

function toDateFilePart(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function createRoutineTemplateFileName(routineName: string): string {
  const slug = routineName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);

  return `biofeedback-routine-template-${slug || 'routine'}-${toDateFilePart(new Date())}.json`;
}

function createTemplateFromRoutine(routine: Routine): RoutineTemplateJson {
  return {
    type: TEMPLATE_TYPE,
    schemaVersion: TEMPLATE_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    name: routine.name,
    cycleLengthDays: routine.cycleLengthDays,
    items: routine.items
      .filter((item) => item.removedFromDateKey === null)
      .map((item) => ({
        dayOffset: item.dayOffset,
        sortOrder: item.sortOrder,
        activityType: item.activityType,
        measurementType: item.measurementType,
        catalogItemId: item.catalogItemId,
        customExerciseName: item.customExerciseName,
        monitoringType: item.monitoringType,
        durationMinutes: item.durationMinutes,
        exerciseParameters: item.exerciseParameters,
      })),
  };
}

function parseTemplateItem(
  value: unknown,
  cycleLengthDays: number,
  index: number,
): RoutineTemplateItemJson {
  if (!isRecord(value)) {
    throw new Error(`items[${index}] must be an object`);
  }

  const item: RoutineTemplateItemJson = {
    dayOffset: assertIntegerInRange(
      value.dayOffset,
      `items[${index}].dayOffset`,
      0,
      cycleLengthDays - 1,
    ),
    sortOrder: assertIntegerInRange(value.sortOrder, `items[${index}].sortOrder`, 0, 10000),
    activityType: assertActivityType(value.activityType),
    measurementType: assertMeasurementType(value.measurementType),
    catalogItemId: assertStringOrNull(value.catalogItemId, `items[${index}].catalogItemId`),
    customExerciseName: assertStringOrNull(
      value.customExerciseName,
      `items[${index}].customExerciseName`,
    ),
    monitoringType: assertMonitoringType(value.monitoringType),
    durationMinutes: assertPositiveNumberOrNull(
      value.durationMinutes,
      `items[${index}].durationMinutes`,
    ),
    exerciseParameters: sanitizeExerciseParameters(value.exerciseParameters),
  };

  if (!item.catalogItemId && !item.customExerciseName?.trim() && !item.monitoringType) {
    throw new Error(`items[${index}] must include a catalog item, custom name, or monitoring type`);
  }

  return item;
}

function parseRoutineTemplateJson(jsonText: string): RoutineTemplateJson {
  const parsed = JSON.parse(jsonText) as unknown;

  if (!isRecord(parsed)) {
    throw new Error('Template must be a JSON object');
  }

  if (parsed.type !== TEMPLATE_TYPE) {
    throw new Error('Unsupported template type');
  }

  if (parsed.schemaVersion !== TEMPLATE_SCHEMA_VERSION) {
    throw new Error('Unsupported template version');
  }

  const name = assertString(parsed.name, 'name').trim();
  if (!name) {
    throw new Error('name is required');
  }

  const cycleLengthDays = assertIntegerInRange(
    parsed.cycleLengthDays,
    'cycleLengthDays',
    1,
    365,
  );

  if (!Array.isArray(parsed.items)) {
    throw new Error('items must be an array');
  }

  if (parsed.items.length > MAX_TEMPLATE_ITEMS) {
    throw new Error(`items must include ${MAX_TEMPLATE_ITEMS} items or fewer`);
  }

  return {
    type: TEMPLATE_TYPE,
    schemaVersion: TEMPLATE_SCHEMA_VERSION,
    exportedAt: assertString(parsed.exportedAt, 'exportedAt'),
    name,
    cycleLengthDays,
    items: parsed.items.map((item, index) =>
      parseTemplateItem(item, cycleLengthDays, index),
    ),
  };
}

function createRoutineInputFromTemplate(
  template: RoutineTemplatePreview,
  name: string,
  startDateKey: string,
): CreateRoutineInput {
  const items: CreateRoutineItemInput[] = template.items.map((item) => ({
    dayOffset: item.dayOffset,
    sortOrder: item.sortOrder,
    activityType: item.activityType,
    measurementType: item.measurementType,
    catalogItemId: item.catalogItemId,
    userCustomActivityId: null,
    customExerciseName: item.customExerciseName?.trim() || null,
    monitoringType: item.monitoringType,
    durationMinutes: item.durationMinutes,
    exerciseParameters: item.exerciseParameters,
  }));

  return {
    name,
    startDateKey,
    cycleLengthDays: template.cycleLengthDays,
    items,
  };
}

export async function exportRoutineTemplateAsJson(routine: Routine): Promise<void> {
  const template = createTemplateFromRoutine(routine);
  const json = JSON.stringify(template, null, 2);
  const fileName = createRoutineTemplateFileName(routine.name);

  if (Platform.OS === 'web') {
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = fileName;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);

    URL.revokeObjectURL(url);
    return;
  }

  const file = new File(Paths.cache, fileName);
  file.write(json);

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error('Sharing is not available on this device');
  }

  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    dialogTitle: 'ייצוא תבנית רוטינה',
  });
}

export async function importRoutineTemplateFromJson(
  jsonText: string,
  startDateKey: string,
): Promise<Routine> {
  const template = parseRoutineTemplateJson(jsonText);
  const input = createRoutineInputFromTemplate(template, template.name, startDateKey);

  return createRoutine(input);
}

export function parseRoutineTemplatePreviewFromJson(jsonText: string): RoutineTemplatePreview {
  const template = parseRoutineTemplateJson(jsonText);

  return {
    name: template.name,
    cycleLengthDays: template.cycleLengthDays,
    items: template.items,
  };
}

export async function createRoutineFromTemplatePreview(
  template: RoutineTemplatePreview,
  name: string,
  startDateKey: string,
): Promise<Routine> {
  const trimmedName = name.trim();

  if (!trimmedName) {
    throw new Error('שם הרוטינה נדרש');
  }

  const input = createRoutineInputFromTemplate(template, trimmedName, startDateKey);

  return createRoutine(input);
}

export async function readRoutineTemplateFromFile(): Promise<RoutineTemplatePreview> {
  if (Platform.OS !== 'web') {
    throw new Error('ייבוא תבנית זמין כרגע בווב');
  }

  return new Promise<RoutineTemplatePreview>((resolve, reject) => {
    const input = document.createElement('input');

    input.type = 'file';
    input.accept = 'application/json,.json';
    input.style.display = 'none';

    input.onchange = () => {
      const file = input.files?.[0];
      document.body.removeChild(input);

      if (!file) {
        reject(new Error('לא נבחר קובץ'));
        return;
      }

      const reader = new FileReader();

      reader.onerror = () => {
        reject(new Error('קריאת הקובץ נכשלה'));
      };

      reader.onload = () => {
        const text = typeof reader.result === 'string' ? reader.result : '';

        try {
          resolve(parseRoutineTemplatePreviewFromJson(text));
        } catch (error) {
          reject(error);
        }
      };

      reader.readAsText(file);
    };

    document.body.appendChild(input);
    input.click();
  });
}
