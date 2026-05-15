import type { BiofeedbackEntry } from '../types/biofeedback-entry.types';

export function isMonitoringEntry(entry: BiofeedbackEntry): boolean {
  return entry.activity?.activityType === 'monitoring';
}

export function isPracticeEntry(entry: BiofeedbackEntry): boolean {
  return !isMonitoringEntry(entry);
}
