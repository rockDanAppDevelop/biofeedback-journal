import type { BiofeedbackEntry } from '../types/biofeedback-entry.types';
import type { MonitoringSchedule } from '../types/monitoring-schedule.types';
import type { VisibleMonitoringScheduleState } from './monitoring-schedule-visibility';
import { isMorningMonitoringEntry } from './monitoring-schedule-status';

export type MonitoringScheduleCardSummary = {
  scheduleId: string;
  frequencyLabel: string;
  lastCompletedDateKey: string | null;
  nextDueDateKey: string;
  pendingSinceDateKey: string | null;
  status: VisibleMonitoringScheduleState;
  overdueDays: number | null;
};

function getFrequencyLabel(frequency: MonitoringSchedule['frequency']): string {
  if (frequency === 'weekly') {
    return 'שבועי';
  }

  if (frequency === 'biweekly') {
    return 'דו-שבועי';
  }

  return 'חודשי';
}

function getDaysBetweenDateKeys(fromDateKey: string, toDateKey: string): number {
  const fromDate = new Date(`${fromDateKey}T00:00:00`);
  const toDate = new Date(`${toDateKey}T00:00:00`);

  return Math.max(
    0,
    Math.floor((toDate.getTime() - fromDate.getTime()) / 86400000),
  );
}

export function getLastCompletedMorningMonitoringDateKey(
  entries: BiofeedbackEntry[],
): string | null {
  return entries
    .filter(isMorningMonitoringEntry)
    .map((entry) => entry.dateKey)
    .sort()
    .at(-1) ?? null;
}

export function getMonitoringScheduleCardSummary(
  schedule: MonitoringSchedule,
  status: VisibleMonitoringScheduleState,
  todayDateKey: string,
  entries: BiofeedbackEntry[],
): MonitoringScheduleCardSummary {
  const overdueAnchorDateKey = schedule.pendingSinceDateKey ?? schedule.nextDueDateKey;
  const overdueDays =
    status === 'due' || status === 'pending'
      ? getDaysBetweenDateKeys(overdueAnchorDateKey, todayDateKey)
      : null;

  return {
    scheduleId: schedule.id,
    frequencyLabel: getFrequencyLabel(schedule.frequency),
    lastCompletedDateKey: getLastCompletedMorningMonitoringDateKey(entries),
    nextDueDateKey: schedule.nextDueDateKey,
    pendingSinceDateKey: schedule.pendingSinceDateKey,
    status,
    overdueDays,
  };
}
