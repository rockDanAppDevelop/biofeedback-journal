import {
  listActiveMonitoringSchedules,
  updateMonitoringSchedule,
} from '../data/firebase-monitoring-schedules-repository';
import type { BiofeedbackEntry } from '../types/biofeedback-entry.types';
import {
  doesEntryCompleteMonitoringSchedule,
  getNextMonitoringDueDateKeyAfterCompletion,
  isMonitoringScheduleDue,
  isMonitoringSchedulePending,
  isMorningMonitoringEntry,
} from './monitoring-schedule-status';

export async function completeMonitoringSchedulesForEntry(
  entry: BiofeedbackEntry,
): Promise<void> {
  if (!isMorningMonitoringEntry(entry)) {
    return;
  }

  const schedules = await listActiveMonitoringSchedules();
  const matchingSchedules = schedules.filter(
    (schedule) =>
      schedule.monitoringType === 'morning' &&
      (isMonitoringSchedulePending(schedule) ||
        isMonitoringScheduleDue(schedule, entry.dateKey)) &&
      doesEntryCompleteMonitoringSchedule(schedule, entry),
  );

  const results = await Promise.allSettled(
    matchingSchedules.map((schedule) =>
      updateMonitoringSchedule(schedule.id, {
        nextDueDateKey: getNextMonitoringDueDateKeyAfterCompletion(
          schedule,
          entry.dateKey,
        ),
        pendingSinceDateKey: null,
      }),
    ),
  );

  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      console.warn('MONITORING SCHEDULE COMPLETION FAILED:', {
        scheduleId: matchingSchedules[index]?.id ?? null,
        error: result.reason,
      });
    }
  });
}
