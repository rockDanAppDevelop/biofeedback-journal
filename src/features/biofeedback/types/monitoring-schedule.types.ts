export type MonitoringScheduleFrequency = 'weekly' | 'biweekly' | 'monthly';

export type MonitoringSchedule = {
  id: string;
  userId: string;

  monitoringType: 'morning';
  frequency: MonitoringScheduleFrequency;

  reminderHour: number;
  reminderMinute: number;

  nextDueDateKey: string;
  pendingSinceDateKey: string | null;

  isActive: boolean;

  createdAt: string;
  updatedAt: string;
};
