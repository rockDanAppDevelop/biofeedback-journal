//src\features\auth\data\update-current-user-reminder-time.ts

import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../../lib/firebase';

type ReminderTimeInput = {
  hour: number;
  minute: number;
};

function assertValidReminderTime(input: ReminderTimeInput): void {
  if (
    !Number.isInteger(input.hour) ||
    !Number.isInteger(input.minute) ||
    input.hour < 0 ||
    input.hour > 23 ||
    input.minute < 0 ||
    input.minute > 59
  ) {
    throw new Error('Invalid reminder time');
  }
}

export async function updateCurrentUserReminderTime(
  input: ReminderTimeInput,
): Promise<void> {
  const user = auth.currentUser;

  if (!user) {
    throw new Error('No authenticated user');
  }

  assertValidReminderTime(input);

  const userRef = doc(db, 'users', user.uid);

  await updateDoc(userRef, {
    dailyReminderHour: input.hour,
    dailyReminderMinute: input.minute,
    updatedAt: new Date().toISOString(),
  });
}
