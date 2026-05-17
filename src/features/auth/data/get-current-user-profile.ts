//src\features\auth\data\get-current-user-profile.ts

import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../../lib/firebase';

export type CurrentUserProfile = {
  email: string | null;
  firstSeenAt: string;
  firstSeenDateKey: string;
  dailyReminderHour: number;
  dailyReminderMinute: number;
  plannedReminderHour: number;
  plannedReminderMinute: number;
  createdAt: string;
  updatedAt: string;
};

function toReminderHour(value: unknown): number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 23
    ? value
    : 21;
}

function toReminderMinute(value: unknown): number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 59
    ? value
    : 0;
}

function toPlannedReminderHour(value: unknown): number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 23
    ? value
    : 6;
}

function toPlannedReminderMinute(value: unknown): number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 59
    ? value
    : 0;
}

export async function getCurrentUserProfile(): Promise<CurrentUserProfile | null> {
  const user = auth.currentUser;

  if (!user) {
    throw new Error('No authenticated user');
  }

  const userRef = doc(db, 'users', user.uid);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.data();

  return {
    email: typeof data.email === 'string' ? data.email : null,
    firstSeenAt: String(data.firstSeenAt ?? ''),
    firstSeenDateKey: String(data.firstSeenDateKey ?? ''),
    dailyReminderHour: toReminderHour(data.dailyReminderHour),
    dailyReminderMinute: toReminderMinute(data.dailyReminderMinute),
    plannedReminderHour: toPlannedReminderHour(data.plannedReminderHour),
    plannedReminderMinute: toPlannedReminderMinute(data.plannedReminderMinute),
    createdAt: String(data.createdAt ?? ''),
    updatedAt: String(data.updatedAt ?? ''),
  };
}
