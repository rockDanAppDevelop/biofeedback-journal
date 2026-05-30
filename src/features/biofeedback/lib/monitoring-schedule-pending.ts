import type { MonitoringSchedule } from '../types/monitoring-schedule.types';

export function shouldMarkMonitoringSchedulePending(
  schedule: MonitoringSchedule,
  todayDateKey: string,
): boolean {
  return (
    schedule.isActive &&
    schedule.monitoringType === 'morning' &&
    schedule.pendingSinceDateKey === null &&
    schedule.nextDueDateKey < todayDateKey
  );
}

export function markMonitoringSchedulePendingInMemory(
  schedule: MonitoringSchedule,
): MonitoringSchedule {
  return {
    ...schedule,
    pendingSinceDateKey: schedule.nextDueDateKey,
  };
}
