import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { listActiveMonitoringSchedules } from '../../biofeedback/data/firebase-monitoring-schedules-repository';
import type { MonitoringSchedule } from '../../biofeedback/types/monitoring-schedule.types';
import { DAILY_REMINDER_CHANNEL_ID } from './daily-reminder';

export const MONITORING_MORNING_REMINDER_NOTIFICATION_KIND =
  'monitoring-morning-reminder';

type ReminderTime = {
  hour: number;
  minute: number;
};

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

function isMonitoringMorningReminderKind(kind: unknown): boolean {
  return kind === MONITORING_MORNING_REMINDER_NOTIFICATION_KIND;
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

async function syncMonitoringMorningRemindersInternal(): Promise<void> {
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

  const now = new Date();
  const schedules = await listActiveMonitoringSchedules();
  const reminderSchedules = schedules.filter(
    (schedule) =>
      schedule.monitoringType === 'morning' &&
      schedule.pendingSinceDateKey === null,
  );

  await Promise.all(
    reminderSchedules.map((schedule) => {
      const reminderDate = getEveningBeforeReminderDate(
        schedule.nextDueDateKey,
        getReminderTime(schedule),
      );

      if (reminderDate <= now) {
        return Promise.resolve();
      }

      return Notifications.scheduleNotificationAsync({
        content: {
          title: 'ניטור בוקר',
          body: 'מחר מתוכנן ניטור בוקר.',
          data: {
            kind: MONITORING_MORNING_REMINDER_NOTIFICATION_KIND,
            monitoringScheduleId: schedule.id,
            monitoringType: 'morning',
            dueDateKey: schedule.nextDueDateKey,
          },
          sound: false,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: reminderDate,
          channelId: DAILY_REMINDER_CHANNEL_ID,
        },
      });
    }),
  );
}
