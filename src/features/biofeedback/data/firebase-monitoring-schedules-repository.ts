import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';

import { auth, db } from '../../../lib/firebase';
import type {
  MonitoringSchedule,
  MonitoringScheduleFrequency,
} from '../types/monitoring-schedule.types';

export type CreateMonitoringScheduleInput = {
  monitoringType: 'morning';
  frequency: MonitoringScheduleFrequency;
  reminderHour: number;
  reminderMinute: number;
  nextDueDateKey: string;
  pendingSinceDateKey?: string | null;
  isActive?: boolean;
};

export type UpdateMonitoringScheduleInput = Partial<{
  frequency: MonitoringScheduleFrequency;
  reminderHour: number;
  reminderMinute: number;
  nextDueDateKey: string;
  pendingSinceDateKey: string | null;
  isActive: boolean;
}>;

type FirebaseMonitoringScheduleDocument = Omit<MonitoringSchedule, 'id' | 'userId'>;

function getCurrentUserOrThrow() {
  const user = auth.currentUser;

  if (!user) {
    throw new Error('No authenticated user');
  }

  return user;
}

function assertValidReminderTime(hour: number, minute: number): void {
  if (
    !Number.isInteger(hour) ||
    !Number.isInteger(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    throw new Error('Invalid reminder time');
  }
}

function mapMonitoringScheduleDocument(
  docSnapshot: { id: string; data(): unknown },
  userId: string,
): MonitoringSchedule {
  const data = docSnapshot.data() as FirebaseMonitoringScheduleDocument;

  return {
    id: docSnapshot.id,
    userId,
    monitoringType: data.monitoringType,
    frequency: data.frequency,
    reminderHour: data.reminderHour,
    reminderMinute: data.reminderMinute,
    nextDueDateKey: data.nextDueDateKey,
    pendingSinceDateKey: data.pendingSinceDateKey ?? null,
    isActive: data.isActive,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

export async function createMonitoringSchedule(
  input: CreateMonitoringScheduleInput,
): Promise<MonitoringSchedule> {
  const user = getCurrentUserOrThrow();
  const monitoringSchedulesCollection = collection(
    db,
    'users',
    user.uid,
    'monitoringSchedules',
  );
  const nowIso = new Date().toISOString();

  assertValidReminderTime(input.reminderHour, input.reminderMinute);

  const docData: FirebaseMonitoringScheduleDocument = {
    monitoringType: input.monitoringType,
    frequency: input.frequency,
    reminderHour: input.reminderHour,
    reminderMinute: input.reminderMinute,
    nextDueDateKey: input.nextDueDateKey,
    pendingSinceDateKey: input.pendingSinceDateKey ?? null,
    isActive: input.isActive ?? true,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  const docRef = await addDoc(monitoringSchedulesCollection, docData);

  return {
    id: docRef.id,
    userId: user.uid,
    ...docData,
  };
}

export async function listActiveMonitoringSchedules(): Promise<MonitoringSchedule[]> {
  const user = getCurrentUserOrThrow();
  const monitoringSchedulesCollection = collection(
    db,
    'users',
    user.uid,
    'monitoringSchedules',
  );
  const monitoringSchedulesQuery = query(
    monitoringSchedulesCollection,
    where('isActive', '==', true),
  );
  const snapshot = await getDocs(monitoringSchedulesQuery);

  return snapshot.docs
    .map((docSnapshot) => mapMonitoringScheduleDocument(docSnapshot, user.uid))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function listMonitoringSchedules(): Promise<MonitoringSchedule[]> {
  const user = getCurrentUserOrThrow();
  const monitoringSchedulesCollection = collection(
    db,
    'users',
    user.uid,
    'monitoringSchedules',
  );
  const snapshot = await getDocs(monitoringSchedulesCollection);

  return snapshot.docs
    .map((docSnapshot) => mapMonitoringScheduleDocument(docSnapshot, user.uid))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function getMonitoringScheduleById(
  scheduleId: string,
): Promise<MonitoringSchedule | null> {
  const user = getCurrentUserOrThrow();
  const monitoringScheduleRef = doc(
    db,
    'users',
    user.uid,
    'monitoringSchedules',
    scheduleId,
  );
  const snapshot = await getDoc(monitoringScheduleRef);

  if (!snapshot.exists()) {
    return null;
  }

  return mapMonitoringScheduleDocument(snapshot, user.uid);
}

export async function updateMonitoringSchedule(
  scheduleId: string,
  input: UpdateMonitoringScheduleInput,
): Promise<void> {
  const user = getCurrentUserOrThrow();
  const monitoringScheduleRef = doc(
    db,
    'users',
    user.uid,
    'monitoringSchedules',
    scheduleId,
  );

  if (input.reminderHour !== undefined || input.reminderMinute !== undefined) {
    const currentSchedule = await getMonitoringScheduleById(scheduleId);

    assertValidReminderTime(
      input.reminderHour ?? currentSchedule?.reminderHour ?? -1,
      input.reminderMinute ?? currentSchedule?.reminderMinute ?? -1,
    );
  }

  await updateDoc(monitoringScheduleRef, {
    ...input,
    updatedAt: new Date().toISOString(),
  });
}

export async function archiveMonitoringSchedule(scheduleId: string): Promise<void> {
  await updateMonitoringSchedule(scheduleId, {
    isActive: false,
  });
}
