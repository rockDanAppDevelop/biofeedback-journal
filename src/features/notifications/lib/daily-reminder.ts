import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { hasPlannedItemsForDate } from '../../biofeedback/lib/routine-plan-status';

const DAILY_REMINDER_NOTIFICATION_KIND = 'daily-reminder';
const PLANNED_ITEMS_MORNING_REMINDER_NOTIFICATION_KIND = 'planned-items-morning-reminder';
const DAILY_REMINDER_CHANNEL_ID = 'daily-reminder';
const DAILY_REMINDER_HOUR = 21;
const DAILY_REMINDER_MINUTE = 0;
const PLANNED_ITEMS_MORNING_REMINDER_HOUR = 6;
const PLANNED_ITEMS_MORNING_REMINDER_MINUTE = 0;
const isDebugReminder = false;
const DEBUG_REMINDER_DELAY_MINUTES = 2;

type DailyReminderTime = {
  hour: number;
  minute: number;
};

type PlannedReminderTime = {
  hour: number;
  minute: number;
};

const ENCOURAGING_MESSAGES = [
  'זה זמן טוב לעצור לרגע ולמלא entry קטן לעצמך.',
  'עוד כמה דקות של תשומת לב לעצמך יכולות לעשות הבדל גדול.',
  'אם עדיין לא מילאת היום entry, זה רגע נעים לעשות את זה.',
  'תזכורת קטנה ועדינה: כדאי לבדוק איך עבר עליך היום.',
];

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

function getRandomEncouragingMessage(): string {
  const randomIndex = Math.floor(Math.random() * ENCOURAGING_MESSAGES.length);
  return ENCOURAGING_MESSAGES[randomIndex];
}

function getDefaultDailyReminderTime(): DailyReminderTime {
  return {
    hour: DAILY_REMINDER_HOUR,
    minute: DAILY_REMINDER_MINUTE,
  };
}

function normalizeDailyReminderTime(
  reminderTime?: Partial<DailyReminderTime> | null,
): DailyReminderTime {
  const defaultReminderTime = getDefaultDailyReminderTime();

  if (!reminderTime) {
    return defaultReminderTime;
  }

  const hour = Number(reminderTime.hour);
  const minute = Number(reminderTime.minute);

  if (
    !Number.isInteger(hour) ||
    !Number.isInteger(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return defaultReminderTime;
  }

  return {
    hour,
    minute,
  };
}

function getDefaultPlannedReminderTime(): PlannedReminderTime {
  return {
    hour: PLANNED_ITEMS_MORNING_REMINDER_HOUR,
    minute: PLANNED_ITEMS_MORNING_REMINDER_MINUTE,
  };
}

function normalizePlannedReminderTime(
  reminderTime?: Partial<PlannedReminderTime> | null,
): PlannedReminderTime {
  const defaultReminderTime = getDefaultPlannedReminderTime();

  if (!reminderTime) {
    return defaultReminderTime;
  }

  const hour = Number(reminderTime.hour);
  const minute = Number(reminderTime.minute);

  if (
    !Number.isInteger(hour) ||
    !Number.isInteger(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return defaultReminderTime;
  }

  return {
    hour,
    minute,
  };
}

function getTomorrowAtReminderTime(now: Date, reminderTime: DailyReminderTime): Date {
  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
    reminderTime.hour,
    reminderTime.minute,
    0,
    0,
  );
}

function getTodayAtReminderTime(now: Date, reminderTime: DailyReminderTime): Date {
  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    reminderTime.hour,
    reminderTime.minute,
    0,
    0,
  );
}

function getMorningReminderDate(
  now: Date,
  daysFromToday: number,
  reminderTime: PlannedReminderTime,
): Date {
  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + daysFromToday,
    reminderTime.hour,
    reminderTime.minute,
    0,
    0,
  );
}

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getDebugReminderDate(now: Date): Date {
  return new Date(now.getTime() + DEBUG_REMINDER_DELAY_MINUTES * 60 * 1000);
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

async function cancelExistingDailyReminder(
  Notifications: typeof import('expo-notifications'),
): Promise<void> {
  const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();

  const reminderNotifications = scheduledNotifications.filter(
    (notification) =>
      notification.content.data?.kind === DAILY_REMINDER_NOTIFICATION_KIND,
  );

  await Promise.all(
    reminderNotifications.map((notification) =>
      Notifications.cancelScheduledNotificationAsync(notification.identifier),
    ),
  );
}

async function cancelExistingPlannedItemsMorningReminder(
  Notifications: typeof import('expo-notifications'),
): Promise<void> {
  const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();

  const reminderNotifications = scheduledNotifications.filter(
    (notification) =>
      notification.content.data?.kind ===
      PLANNED_ITEMS_MORNING_REMINDER_NOTIFICATION_KIND,
  );

  await Promise.all(
    reminderNotifications.map((notification) =>
      Notifications.cancelScheduledNotificationAsync(notification.identifier),
    ),
  );
}

function getNextReminderDate(
  hasEntryForToday: boolean,
  now: Date,
  reminderTime: DailyReminderTime,
): Date {
  if (hasEntryForToday) {
    return getTomorrowAtReminderTime(now, reminderTime);
  }

  if (isDebugReminder) {
    return getDebugReminderDate(now);
  }

  const todayAtReminderTime = getTodayAtReminderTime(now, reminderTime);

  if (now < todayAtReminderTime) {
    return todayAtReminderTime;
  }

  return getTomorrowAtReminderTime(now, reminderTime);
}

async function findNextPlannedItemsMorningReminderDate(
  daysAhead: number,
  now: Date,
  reminderTime: PlannedReminderTime,
): Promise<Date | null> {
  const startOffset = now < getMorningReminderDate(now, 0, reminderTime) ? 0 : 1;
  const daysToCheck = Math.max(0, daysAhead);

  for (let offset = startOffset; offset < startOffset + daysToCheck; offset += 1) {
    const reminderDate = getMorningReminderDate(now, offset, reminderTime);
    const dateKey = toDateKey(reminderDate);
    const hasOpenPlannedItems = await hasPlannedItemsForDate(dateKey);

    if (hasOpenPlannedItems) {
      return reminderDate;
    }
  }

  return null;
}

export async function syncDailyReminderForToday(
  hasEntryForToday: boolean,
  reminderTime?: Partial<DailyReminderTime> | null,
): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }

  if (isExpoGo()) {
    return;
  }

  const Notifications = await loadNotificationsModule();
  await ensureNotificationHandlerConfigured(Notifications);

  const now = new Date();

  const hasPermissions = await ensureNotificationPermissions(Notifications);

  if (!hasPermissions) {
    return;
  }

  await ensureAndroidNotificationChannel(Notifications);
  await cancelExistingDailyReminder(Notifications);

  const nextReminderDate = getNextReminderDate(
    hasEntryForToday,
    now,
    normalizeDailyReminderTime(reminderTime),
  );

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Biofeedback Journal',
      body: getRandomEncouragingMessage(),
      data: {
        kind: DAILY_REMINDER_NOTIFICATION_KIND,
      },
      sound: false,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: nextReminderDate,
      channelId: DAILY_REMINDER_CHANNEL_ID,
    },
  });
}

export async function syncPlannedItemsMorningReminder(
  daysAhead = 7,
  reminderTime?: Partial<PlannedReminderTime> | null,
): Promise<void> {
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
  await cancelExistingPlannedItemsMorningReminder(Notifications);

  const nextReminderDate = await findNextPlannedItemsMorningReminderDate(
    daysAhead,
    new Date(),
    normalizePlannedReminderTime(reminderTime),
  );

  if (!nextReminderDate) {
    return;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Biofeedback Journal',
      body: 'יש לך תרגולים מתוכננים להיום.',
      data: {
        kind: PLANNED_ITEMS_MORNING_REMINDER_NOTIFICATION_KIND,
        plannedPracticeId: null,
        routineItemId: null,
        dateKey: toDateKey(nextReminderDate),
      },
      sound: false,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: nextReminderDate,
      channelId: DAILY_REMINDER_CHANNEL_ID,
    },
  });
}
