import { getCurrentUserProfile } from '../../auth/data/get-current-user-profile';

export type PlannedReminderTimePreference = {
  hour: number;
  minute: number;
};

export const DEFAULT_PLANNED_REMINDER_TIME: PlannedReminderTimePreference = {
  hour: 6,
  minute: 0,
};

export async function getPlannedReminderTime(): Promise<PlannedReminderTimePreference> {
  try {
    const profile = await getCurrentUserProfile();

    return {
      hour: profile?.plannedReminderHour ?? DEFAULT_PLANNED_REMINDER_TIME.hour,
      minute: profile?.plannedReminderMinute ?? DEFAULT_PLANNED_REMINDER_TIME.minute,
    };
  } catch (error) {
    console.warn('PLANNED REMINDER PROFILE LOAD FAILED:', error);

    return DEFAULT_PLANNED_REMINDER_TIME;
  }
}
