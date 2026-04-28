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
import type { Routine, RoutineItem } from '../types/routine.types';

export type CreateRoutineItemInput = {
  dayOffset: number;
  sortOrder?: number;

  activityType: RoutineItem['activityType'];
  measurementType: RoutineItem['measurementType'];

  catalogItemId: string | null;
  userCustomActivityId: string | null;
  customExerciseName: string | null;

  monitoringType: RoutineItem['monitoringType'];

  durationMinutes: number | null;

  exerciseParameters: RoutineItem['exerciseParameters'];
};

export type CreateRoutineInput = {
  name: string;
  startDateKey: string;
  cycleLengthDays: number;
  items: CreateRoutineItemInput[];
};

export type UpdateRoutineInput = {
  name?: string;
  isActive?: boolean;
  startDateKey?: string;
  cycleLengthDays?: number;
  items?: RoutineItem[];
};

type FirebaseRoutineDocument = Omit<Routine, 'id' | 'userId'>;

function getCurrentUserOrThrow() {
  const user = auth.currentUser;

  if (!user) {
    throw new Error('No authenticated user');
  }

  return user;
}

function createRoutineItemId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function mapRoutineDocument(
  docSnapshot: { id: string; data(): unknown },
  userId: string,
): Routine {
  const data = docSnapshot.data() as FirebaseRoutineDocument;

  return {
    id: docSnapshot.id,
    userId,
    name: data.name,
    isActive: data.isActive,
    startDateKey: data.startDateKey,
    cycleLengthDays: data.cycleLengthDays,
    items: data.items ?? [],
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

function getDaysBetweenDateKeys(fromDateKey: string, toDateKey: string): number {
  const fromDate = new Date(`${fromDateKey}T00:00:00`);
  const toDate = new Date(`${toDateKey}T00:00:00`);

  return Math.floor((toDate.getTime() - fromDate.getTime()) / 86400000);
}

function getCycleDayOffset(routine: Routine, dateKey: string): number | null {
  const daysSinceStart = getDaysBetweenDateKeys(routine.startDateKey, dateKey);

  if (daysSinceStart < 0 || routine.cycleLengthDays <= 0) {
    return null;
  }

  return daysSinceStart % routine.cycleLengthDays;
}

function isRoutineItemEffectiveOnDate(item: RoutineItem, dateKey: string): boolean {
  return (
    item.effectiveFromDateKey <= dateKey &&
    (item.removedFromDateKey === null || dateKey < item.removedFromDateKey)
  );
}

export function getRoutineItemsForDate(routine: Routine, dateKey: string): RoutineItem[] {
  const cycleDayOffset = getCycleDayOffset(routine, dateKey);

  if (cycleDayOffset === null) {
    return [];
  }

  return routine.items
    .filter((item) => item.dayOffset === cycleDayOffset)
    .filter((item) => isRoutineItemEffectiveOnDate(item, dateKey))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function createRoutine(input: CreateRoutineInput): Promise<Routine> {
  const user = getCurrentUserOrThrow();
  const routinesCollection = collection(db, 'users', user.uid, 'routines');
  const nowIso = new Date().toISOString();

  const docData: FirebaseRoutineDocument = {
    name: input.name.trim(),
    isActive: true,
    startDateKey: input.startDateKey,
    cycleLengthDays: input.cycleLengthDays,
    items: input.items.map((item, index) => ({
      id: createRoutineItemId(),
      dayOffset: item.dayOffset,
      sortOrder: item.sortOrder ?? index,
      effectiveFromDateKey: input.startDateKey,
      removedFromDateKey: null,
      activityType: item.activityType,
      measurementType: item.measurementType,
      catalogItemId: item.catalogItemId,
      userCustomActivityId: item.userCustomActivityId,
      customExerciseName: item.customExerciseName,
      monitoringType: item.monitoringType,
      durationMinutes: item.durationMinutes,
      exerciseParameters: item.exerciseParameters,
    })),
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  const docRef = await addDoc(routinesCollection, docData);

  return {
    id: docRef.id,
    userId: user.uid,
    ...docData,
  };
}

export async function listActiveRoutines(): Promise<Routine[]> {
  const user = getCurrentUserOrThrow();
  const routinesCollection = collection(db, 'users', user.uid, 'routines');
  const routinesQuery = query(routinesCollection, where('isActive', '==', true));
  const snapshot = await getDocs(routinesQuery);

  return snapshot.docs
    .map((docSnapshot) => mapRoutineDocument(docSnapshot, user.uid))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function getRoutineById(routineId: string): Promise<Routine | null> {
  const user = getCurrentUserOrThrow();
  const routineRef = doc(db, 'users', user.uid, 'routines', routineId);
  const snapshot = await getDoc(routineRef);

  if (!snapshot.exists()) {
    return null;
  }

  return mapRoutineDocument(snapshot, user.uid);
}

export async function updateRoutine(
  routineId: string,
  input: UpdateRoutineInput,
): Promise<void> {
  const user = getCurrentUserOrThrow();
  const routineRef = doc(db, 'users', user.uid, 'routines', routineId);

  await updateDoc(routineRef, {
    ...input,
    ...(input.name !== undefined ? { name: input.name.trim() } : {}),
    updatedAt: new Date().toISOString(),
  });
}

export async function archiveRoutine(routineId: string): Promise<void> {
  const user = getCurrentUserOrThrow();
  const routineRef = doc(db, 'users', user.uid, 'routines', routineId);

  await updateDoc(routineRef, {
    isActive: false,
    updatedAt: new Date().toISOString(),
  });
}
