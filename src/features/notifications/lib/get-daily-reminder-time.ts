import { getCurrentUserProfile } from '../../auth/data/get-current-user-profile';

export type DailyReminderTimePreference = {
  hour: number;
  minute: number;
};

export const DEFAULT_DAILY_REMINDER_TIME: DailyReminderTimePreference = {
  hour: 21,
  minute: 0,
};

export async function getDailyReminderTime(): Promise<DailyReminderTimePreference> {
  try {
    const profile = await getCurrentUserProfile();

    return {
      hour: profile?.dailyReminderHour ?? DEFAULT_DAILY_REMINDER_TIME.hour,
      minute: profile?.dailyReminderMinute ?? DEFAULT_DAILY_REMINDER_TIME.minute,
    };
  } catch (error) {
    console.warn('DAILY REMINDER PROFILE LOAD FAILED:', error);

    return DEFAULT_DAILY_REMINDER_TIME;
  }
}
