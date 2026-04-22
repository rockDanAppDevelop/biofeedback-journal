import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const DAILY_REMINDER_NOTIFICATION_KIND = 'daily-reminder';
const DAILY_REMINDER_CHANNEL_ID = 'daily-reminder';
const DAILY_REMINDER_HOUR = 21;
const DAILY_REMINDER_MINUTE = 0;
const isDebugReminder = false;
const DEBUG_REMINDER_DELAY_MINUTES = 2;

const ENCOURAGING_MESSAGES = [
  'זה זמן טוב לעצור לרגע ולמלא entry קטן לעצמך.',
  'עוד כמה דקות של תשומת לב לעצמך יכולות לעשות הבדל גדול.',
  'אם עדיין לא מילאת היום entry, זה רגע נעים לעשות את זה.',
  'תזכורת קטנה ועדינה: כדאי לבדוק איך עבר עליך היום.',
];

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

function getRandomEncouragingMessage(): string {
  const randomIndex = Math.floor(Math.random() * ENCOURAGING_MESSAGES.length);
  return ENCOURAGING_MESSAGES[randomIndex];
}

function getTomorrowAtNinePm(now: Date): Date {
  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
    DAILY_REMINDER_HOUR,
    DAILY_REMINDER_MINUTE,
    0,
    0,
  );
}

function getTodayAtNinePm(now: Date): Date {
  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    DAILY_REMINDER_HOUR,
    DAILY_REMINDER_MINUTE,
    0,
    0,
  );
}

function getDebugReminderDate(now: Date): Date {
  return new Date(now.getTime() + DEBUG_REMINDER_DELAY_MINUTES * 60 * 1000);
}

async function ensureNotificationPermissions(): Promise<boolean> {
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

async function ensureAndroidNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  await Notifications.setNotificationChannelAsync(DAILY_REMINDER_CHANNEL_ID, {
    name: 'Daily Reminder',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

async function cancelExistingDailyReminder(): Promise<void> {
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

function getNextReminderDate(hasEntryForToday: boolean, now: Date): Date {
  if (hasEntryForToday) {
    return getTomorrowAtNinePm(now);
  }

  if (isDebugReminder) {
    return getDebugReminderDate(now);
  }

  const todayAtNinePm = getTodayAtNinePm(now);

  if (now < todayAtNinePm) {
    return todayAtNinePm;
  }

  return getTomorrowAtNinePm(now);
}

export async function syncDailyReminderForToday(
  hasEntryForToday: boolean,
): Promise<void> {
  const now = new Date();

  const hasPermissions = await ensureNotificationPermissions();

  if (!hasPermissions) {
    return;
  }

  await ensureAndroidNotificationChannel();
  await cancelExistingDailyReminder();

  const nextReminderDate = getNextReminderDate(hasEntryForToday, now);

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
