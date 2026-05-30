import Constants from 'expo-constants';
import { Platform } from 'react-native';

import {
  listActiveMonitoringSchedules,
  updateMonitoringSchedule,
} from '../../biofeedback/data/firebase-monitoring-schedules-repository';
import {
  markMonitoringSchedulePendingInMemory,
  shouldMarkMonitoringSchedulePending,
} from '../../biofeedback/lib/monitoring-schedule-pending';
import type { MonitoringSchedule } from '../../biofeedback/types/monitoring-schedule.types';
import { DAILY_REMINDER_CHANNEL_ID } from './daily-reminder';

export const MONITORING_MORNING_REMINDER_NOTIFICATION_KIND =
  'monitoring-morning-reminder';

type ReminderTime = {
  hour: number;
  minute: number;
};

type MonitoringReminderState = 'scheduled' | 'pending';

let monitoringMorningReminderSyncPromise: Promise<void> | null = null;

function isExpoGo(): boolean {
  return Constants.appOwnership === 'expo';
}

async function loadNotificationsModule() {
  return import('expo-notifications');
}

async function ensureNotificationHandlerConfigured(
  Notifications: typeof import('expo-notifications'),
): Promise<void> {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

async function ensureNotificationPermissions(
  Notifications: typeof import('expo-notifications'),
): Promise<boolean> {
  const existingPermissions = await Notifications.getPermissionsAsync();

  if (existingPermissions.granted) {
    return true;
  }

  const requestedPermissions = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    },
  });

  return requestedPermissions.granted;
}

async function ensureAndroidNotificationChannel(
  Notifications: typeof import('expo-notifications'),
): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  await Notifications.setNotificationChannelAsync(DAILY_REMINDER_CHANNEL_ID, {
    name: 'Daily Reminder',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getReminderTime(schedule: MonitoringSchedule): ReminderTime {
  return {
    hour: schedule.reminderHour,
    minute: schedule.reminderMinute,
  };
}

function getEveningBeforeReminderDate(
  dueDateKey: string,
  reminderTime: ReminderTime,
): Date {
  const [year, month, day] = dueDateKey.split('-').map(Number);

  return new Date(
    year,
    month - 1,
    day - 1,
    reminderTime.hour,
    reminderTime.minute,
    0,
    0,
  );
}

function getPendingReminderDate(now: Date, reminderTime: ReminderTime): Date {
  const reminderDate = new Date(now);
  reminderDate.setHours(reminderTime.hour, reminderTime.minute, 0, 0);

  if (reminderDate <= now) {
    reminderDate.setDate(reminderDate.getDate() + 1);
  }

  return reminderDate;
}

function isMonitoringMorningReminderKind(kind: unknown): boolean {
  return kind === MONITORING_MORNING_REMINDER_NOTIFICATION_KIND;
}

async function materializePendingMorningMonitoringSchedules(
  schedules: MonitoringSchedule[],
  todayDateKey: string,
): Promise<MonitoringSchedule[]> {
  return Promise.all(
    schedules.map(async (schedule) => {
      if (!shouldMarkMonitoringSchedulePending(schedule, todayDateKey)) {
        return schedule;
      }

      await updateMonitoringSchedule(schedule.id, {
        pendingSinceDateKey: schedule.nextDueDateKey,
      });

      return markMonitoringSchedulePendingInMemory(schedule);
    }),
  );
}

async function cancelExistingMonitoringMorningReminders(
  Notifications: typeof import('expo-notifications'),
): Promise<void> {
  const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();

  const reminderNotifications = scheduledNotifications.filter((notification) =>
    isMonitoringMorningReminderKind(notification.content.data?.kind),
  );

  await Promise.all(
    reminderNotifications.map((notification) =>
      Notifications.cancelScheduledNotificationAsync(notification.identifier),
    ),
  );
}

export async function clearMonitoringScheduleReminders(
  scheduleId: string,
): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }

  if (isExpoGo()) {
    return;
  }

  const Notifications = await loadNotificationsModule();
  const [scheduledNotifications, presentedNotifications] = await Promise.all([
    Notifications.getAllScheduledNotificationsAsync(),
    Notifications.getPresentedNotificationsAsync(),
  ]);

  const scheduledReminderNotifications = scheduledNotifications.filter(
    (notification) =>
      isMonitoringMorningReminderKind(notification.content.data?.kind) &&
      notification.content.data?.monitoringScheduleId === scheduleId,
  );
  const presentedReminderNotifications = presentedNotifications.filter(
    (notification) =>
      isMonitoringMorningReminderKind(notification.request.content.data?.kind) &&
      notification.request.content.data?.monitoringScheduleId === scheduleId,
  );

  await Promise.all([
    ...scheduledReminderNotifications.map((notification) =>
      Notifications.cancelScheduledNotificationAsync(notification.identifier),
    ),
    ...presentedReminderNotifications.map((notification) =>
      Notifications.dismissNotificationAsync(notification.request.identifier),
    ),
  ]);
}

export async function syncMonitoringMorningReminders(): Promise<void> {
  if (monitoringMorningReminderSyncPromise) {
    return monitoringMorningReminderSyncPromise;
  }

  monitoringMorningReminderSyncPromise = syncMonitoringMorningRemindersInternal().finally(
    () => {
      monitoringMorningReminderSyncPromise = null;
    },
  );

  return monitoringMorningReminderSyncPromise;
}

async function scheduleMonitoringMorningReminder(
  Notifications: typeof import('expo-notifications'),
  schedule: MonitoringSchedule,
  reminderState: MonitoringReminderState,
  reminderDate: Date,
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title:
        reminderState === 'pending'
          ? 'ניטור הבוקר עדיין ממתין'
          : 'ניטור בוקר',
      body:
        reminderState === 'pending'
          ? 'כדאי לבצע אותו בבוקר הבא כשמתאים לך'
          : 'מחר בבוקר יש ניטור בוקר',
      data: {
        kind: MONITORING_MORNING_REMINDER_NOTIFICATION_KIND,
        monitoringScheduleId: schedule.id,
        monitoringType: 'morning',
        dueDateKey: schedule.nextDueDateKey,
        pendingSinceDateKey: schedule.pendingSinceDateKey,
        reminderState,
      },
      sound: false,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: reminderDate,
      channelId: DAILY_REMINDER_CHANNEL_ID,
    },
  });
}

async function syncMonitoringMorningRemindersInternal(): Promise<void> {
  const now = new Date();
  const todayDateKey = toDateKey(now);
  const schedules = await materializePendingMorningMonitoringSchedules(
    await listActiveMonitoringSchedules(),
    todayDateKey,
  );

  if (Platform.OS === 'web') {
    return;
  }

  if (isExpoGo()) {
    return;
  }

  const Notifications = await loadNotificationsModule();
  await ensureNotificationHandlerConfigured(Notifications);

  const hasPermissions = await ensureNotificationPermissions(Notifications);

  if (!hasPermissions) {
    return;
  }

  await ensureAndroidNotificationChannel(Notifications);
  await cancelExistingMonitoringMorningReminders(Notifications);

  const reminderSchedules = schedules.filter(
    (schedule) => schedule.monitoringType === 'morning',
  );

  await Promise.all(
    reminderSchedules.map((schedule) => {
      const reminderState: MonitoringReminderState =
        schedule.pendingSinceDateKey === null ? 'scheduled' : 'pending';
      const reminderDate =
        reminderState === 'scheduled'
          ? getEveningBeforeReminderDate(schedule.nextDueDateKey, getReminderTime(schedule))
          : getPendingReminderDate(now, getReminderTime(schedule));

      if (reminderDate <= now) {
        return Promise.resolve();
      }

      return scheduleMonitoringMorningReminder(
        Notifications,
        schedule,
        reminderState,
        reminderDate,
      );
    }),
  );
}
