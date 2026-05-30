import type { BiofeedbackEntry } from '../types/biofeedback-entry.types';
import type {
  MonitoringSchedule,
  MonitoringScheduleFrequency,
} from '../types/monitoring-schedule.types';

export type MonitoringScheduleState = 'inactive' | 'scheduled' | 'due' | 'pending';

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function addDaysToDateKey(dateKey: string, days: number): string {
  const date = new Date(`${dateKey}T00:00:00`);
  date.setDate(date.getDate() + days);

  return toDateKey(date);
}

function getNextSundayAfterDateKeyWeek(dateKey: string): string {
  const date = new Date(`${dateKey}T00:00:00`);
  const daysUntilNextSunday = 7 - date.getDay();

  return addDaysToDateKey(dateKey, daysUntilNextSunday);
}

function getAdditionalWeeksAfterNextSunday(
  frequency: MonitoringScheduleFrequency,
): number {
  if (frequency === 'weekly') {
    return 0;
  }

  if (frequency === 'biweekly') {
    return 1;
  }

  if (frequency === 'triweekly') {
    return 2;
  }

  return 3;
}

export function isMonitoringSchedulePending(schedule: MonitoringSchedule): boolean {
  return schedule.isActive && schedule.pendingSinceDateKey !== null;
}

export function isMonitoringScheduleDue(
  schedule: MonitoringSchedule,
  todayDateKey: string,
): boolean {
  return (
    schedule.isActive &&
    schedule.pendingSinceDateKey === null &&
    schedule.nextDueDateKey === todayDateKey
  );
}

export function getMonitoringScheduleState(
  schedule: MonitoringSchedule,
  todayDateKey: string,
): MonitoringScheduleState {
  if (!schedule.isActive) {
    return 'inactive';
  }

  if (isMonitoringSchedulePending(schedule)) {
    return 'pending';
  }

  if (isMonitoringScheduleDue(schedule, todayDateKey)) {
    return 'due';
  }

  return 'scheduled';
}

export function getNextMonitoringDueDateKey(
  fromDateKey: string,
  frequency: MonitoringScheduleFrequency,
): string {
  const nextSundayDateKey = getNextSundayAfterDateKeyWeek(fromDateKey);
  const additionalWeeks = getAdditionalWeeksAfterNextSunday(frequency);

  return addDaysToDateKey(nextSundayDateKey, additionalWeeks * 7);
}

export function getNextMonitoringDueDateKeyAfterCompletion(
  schedule: MonitoringSchedule,
  completedDateKey: string,
): string {
  let nextDueDateKey = getNextMonitoringDueDateKey(completedDateKey, schedule.frequency);

  while (nextDueDateKey <= completedDateKey) {
    nextDueDateKey = getNextMonitoringDueDateKey(nextDueDateKey, schedule.frequency);
  }

  return nextDueDateKey;
}

export function isMorningMonitoringEntry(entry: BiofeedbackEntry): boolean {
  return (
    entry.activity?.activityType === 'monitoring' &&
    entry.activity.monitoringType === 'morning'
  );
}

export function doesEntryCompleteMonitoringSchedule(
  schedule: MonitoringSchedule,
  entry: BiofeedbackEntry,
): boolean {
  if (!schedule.isActive || schedule.monitoringType !== 'morning') {
    return false;
  }

  if (!isMorningMonitoringEntry(entry)) {
    return false;
  }

  const anchorDateKey = schedule.pendingSinceDateKey ?? schedule.nextDueDateKey;

  return entry.dateKey >= anchorDateKey;
}
