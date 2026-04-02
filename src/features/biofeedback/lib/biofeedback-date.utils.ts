// src\features\biofeedback\lib\biofeedback-date.utils.ts

import { TimeOfDay } from '../types/biofeedback-entry.types';

export function deriveTimeOfDay(measuredAt: string): TimeOfDay {
  const date = new Date(measuredAt);
  const hour = date.getHours();

  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'noon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

export function deriveDateKey(measuredAt: string): string {
  const date = new Date(measuredAt);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}