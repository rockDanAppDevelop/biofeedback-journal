import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { ACTIVITY_CATALOG } from '../../biofeedback/constants/activity-catalog';
import { listBiofeedbackEntriesByDateKeyFromFirestore } from '../../biofeedback/data/firebase-biofeedback-read-repository';
import { getPlannedPracticeById } from '../../biofeedback/data/firebase-planned-practices-repository';
import type { PlannedPractice } from '../../biofeedback/types/planned-practice.types';
import {
  DAILY_REMINDER_CHANNEL_ID,
  PLANNED_ITEMS_MORNING_REMINDER_NOTIFICATION_KIND,
  PLANNED_ITEMS_MORNING_REMINDER_RETRY_NOTIFICATION_KIND,
} from './daily-reminder';
import { getDailyReminderTime } from './get-daily-reminder-time';

type PlannedReminderResponseData = {
  kind?: unknown;
  plannedPracticeId?: unknown;
  dateKey?: unknown;
  routineItemId?: unknown;
};

const MINIMUM_RETRY_DELAY_MS = 60 * 60 * 1000;
const RETRY_WINDOW_END_OFFSET_MS = 60 * 60 * 1000;

function isExpoGo(): boolean {
  return Constants.appOwnership === 'expo';
}

async function loadNotificationsModule() {
  return import('expo-notifications');
}

function isOriginalPlannedReminderData(
  data: PlannedReminderResponseData,
): data is {
  kind: typeof PLANNED_ITEMS_MORNING_REMINDER_NOTIFICATION_KIND;
  plannedPracticeId: string;
  dateKey: string;
  routineItemId?: string;
} {
  return (
    data.kind === PLANNED_ITEMS_MORNING_REMINDER_NOTIFICATION_KIND &&
    typeof data.plannedPracticeId === 'string' &&
    data.plannedPracticeId.length > 0 &&
    typeof data.dateKey === 'string' &&
    data.dateKey.length > 0
  );
}

async function isPlannedPracticeOpen(plannedPractice: PlannedPractice): Promise<boolean> {
  if (plannedPractice.completedEntryId === null) {
    return true;
  }

  const entries = await listBiofeedbackEntriesByDateKeyFromFirestore(plannedPractice.dateKey);
  return !entries.some((entry) => entry.id === plannedPractice.completedEntryId);
}

function getRetryDate(now: Date, dailyReminderTime: { hour: number; minute: number }): Date | null {
  const minimumRetryDate = new Date(now.getTime() + MINIMUM_RETRY_DELAY_MS);
  const retryWindowEndDate = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    dailyReminderTime.hour,
    dailyReminderTime.minute,
    0,
    0,
  );
  retryWindowEndDate.setTime(retryWindowEndDate.getTime() - RETRY_WINDOW_END_OFFSET_MS);

  if (minimumRetryDate >= retryWindowEndDate) {
    return null;
  }

  return new Date(
    minimumRetryDate.getTime() +
      (retryWindowEndDate.getTime() - minimumRetryDate.getTime()) / 2,
  );
}

function getMonitoringLabel(
  monitoringType: PlannedPractice['monitoringType'],
): string | null {
  if (monitoringType === 'morning') {
    return 'ניטור בוקר';
  }

  if (monitoringType === 'short') {
    return 'ניטור קצר';
  }

  if (monitoringType === 'resting_heart_rate') {
    return 'ניטור דופק מנוחה';
  }

  return null;
}

function getPlannedPracticeLabel(plannedPractice: PlannedPractice): string {
  if (plannedPractice.customExerciseName) {
    return plannedPractice.customExerciseName;
  }

  const catalogItem = plannedPractice.catalogItemId
    ? ACTIVITY_CATALOG.find((currentItem) => currentItem.id === plannedPractice.catalogItemId)
    : null;

  if (catalogItem) {
    return catalogItem.label;
  }

  return getMonitoringLabel(plannedPractice.monitoringType) ?? 'תרגול מתוכנן';
}

async function hasScheduledRetryForPlannedPractice(
  Notifications: typeof import('expo-notifications'),
  plannedPracticeId: string,
): Promise<boolean> {
  const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();

  return scheduledNotifications.some(
    (notification) =>
      notification.content.data?.kind ===
        PLANNED_ITEMS_MORNING_REMINDER_RETRY_NOTIFICATION_KIND &&
      notification.content.data?.plannedPracticeId === plannedPracticeId,
  );
}

export async function handlePlannedReminderNotificationResponse(
  data: PlannedReminderResponseData,
): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }

  if (isExpoGo()) {
    return;
  }

  if (!isOriginalPlannedReminderData(data)) {
    return;
  }

  try {
    const plannedPractice = await getPlannedPracticeById(data.plannedPracticeId);

    if (!plannedPractice) {
      return;
    }

    const isOpen = await isPlannedPracticeOpen(plannedPractice);

    if (!isOpen) {
      return;
    }

    const Notifications = await loadNotificationsModule();
    const hasScheduledRetry = await hasScheduledRetryForPlannedPractice(
      Notifications,
      data.plannedPracticeId,
    );

    if (hasScheduledRetry) {
      return;
    }

    const dailyReminderTime = await getDailyReminderTime();
    const retryDate = getRetryDate(new Date(), dailyReminderTime);

    if (!retryDate) {
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'תרגול מתוכנן להיום',
        body: getPlannedPracticeLabel(plannedPractice),
        data: {
          kind: PLANNED_ITEMS_MORNING_REMINDER_RETRY_NOTIFICATION_KIND,
          plannedPracticeId: data.plannedPracticeId,
          dateKey: data.dateKey,
          routineItemId:
            typeof data.routineItemId === 'string'
              ? data.routineItemId
              : plannedPractice.routineItemId,
        },
        sound: false,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: retryDate,
        channelId: DAILY_REMINDER_CHANNEL_ID,
      },
    });
  } catch (error) {
    console.warn('PLANNED REMINDER RETRY SCHEDULE FAILED:', error);
  }
}

export async function registerPlannedReminderRetryListener(): Promise<() => void> {
  if (Platform.OS === 'web') {
    return () => {};
  }

  if (isExpoGo()) {
    return () => {};
  }

  const Notifications = await loadNotificationsModule();
  const handleResponse = (data: PlannedReminderResponseData) => {
    void handlePlannedReminderNotificationResponse(data).finally(() => {
      Notifications.clearLastNotificationResponse();
    });
  };
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    handleResponse(response.notification.request.content.data as PlannedReminderResponseData);
  });
  const lastResponse = await Notifications.getLastNotificationResponseAsync();

  if (lastResponse) {
    handleResponse(lastResponse.notification.request.content.data as PlannedReminderResponseData);
  }

  return () => {
    subscription.remove();
  };
}
