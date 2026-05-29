import type { MonitoringSchedule } from '../types/monitoring-schedule.types';

export type VisibleMonitoringScheduleState = 'scheduled' | 'due' | 'pending';

export type VisibleMonitoringSchedule = {
  schedule: MonitoringSchedule;
  state: VisibleMonitoringScheduleState;
};

export function getVisibleMorningMonitoringSchedulesForDate(
  schedules: MonitoringSchedule[],
  dateKey: string,
): VisibleMonitoringSchedule[] {
  return schedules
    .filter((schedule) => schedule.isActive && schedule.monitoringType === 'morning')
    .flatMap((schedule): VisibleMonitoringSchedule[] => {
      if (schedule.pendingSinceDateKey !== null && schedule.pendingSinceDateKey <= dateKey) {
        return [{ schedule, state: 'pending' as const }];
      }

      if (schedule.pendingSinceDateKey === null && schedule.nextDueDateKey === dateKey) {
        return [{ schedule, state: 'scheduled' as const }];
      }

      if (schedule.pendingSinceDateKey === null && schedule.nextDueDateKey < dateKey) {
        return [{ schedule, state: 'due' as const }];
      }

      return [];
    });
}
