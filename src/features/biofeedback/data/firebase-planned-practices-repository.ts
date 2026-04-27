import { addDoc, collection, deleteDoc, doc, getDocs, query, where } from 'firebase/firestore';

import { auth, db } from '../../../lib/firebase';
import type { PlannedPractice } from '../types/planned-practice.types';

export type CreatePlannedPracticeInput = {
  dateKey: string;

  activityType: PlannedPractice['activityType'];
  measurementType: PlannedPractice['measurementType'];

  catalogItemId: string | null;
  userCustomActivityId: string | null;
  customExerciseName: string | null;

  monitoringType: PlannedPractice['monitoringType'];

  durationMinutes: number | null;

  exerciseParameters: PlannedPractice['exerciseParameters'];
};

type FirebasePlannedPracticeDocument = Omit<PlannedPractice, 'id' | 'userId'>;

function getCurrentUserOrThrow() {
  const user = auth.currentUser;

  if (!user) {
    throw new Error('No authenticated user');
  }

  return user;
}

function mapPlannedPracticeDocument(
  docSnapshot: { id: string; data(): unknown },
  userId: string,
): PlannedPractice {
  const data = docSnapshot.data() as FirebasePlannedPracticeDocument;

  return {
    id: docSnapshot.id,
    userId,
    dateKey: data.dateKey,
    routineId: data.routineId ?? null,
    routineItemId: data.routineItemId ?? null,
    sortOrder: data.sortOrder ?? null,
    activityType: data.activityType,
    measurementType: data.measurementType,
    catalogItemId: data.catalogItemId,
    userCustomActivityId: data.userCustomActivityId,
    customExerciseName: data.customExerciseName,
    monitoringType: data.monitoringType,
    durationMinutes: data.durationMinutes,
    exerciseParameters: data.exerciseParameters,
    completedEntryId: data.completedEntryId ?? null,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

export async function createPlannedPractice(
  input: CreatePlannedPracticeInput,
): Promise<PlannedPractice> {
  const user = getCurrentUserOrThrow();
  const plannedPracticesCollection = collection(db, 'users', user.uid, 'plannedPractices');
  const nowIso = new Date().toISOString();

  const docData: FirebasePlannedPracticeDocument = {
    dateKey: input.dateKey,
    routineId: null,
    routineItemId: null,
    sortOrder: null,
    activityType: input.activityType,
    measurementType: input.measurementType,
    catalogItemId: input.catalogItemId,
    userCustomActivityId: input.userCustomActivityId,
    customExerciseName: input.customExerciseName,
    monitoringType: input.monitoringType,
    durationMinutes: input.durationMinutes,
    exerciseParameters: input.exerciseParameters,
    completedEntryId: null,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  const docRef = await addDoc(plannedPracticesCollection, docData);

  return {
    id: docRef.id,
    userId: user.uid,
    ...docData,
  };
}

export async function listPlannedPracticesByDateKey(
  dateKey: string,
): Promise<PlannedPractice[]> {
  const user = getCurrentUserOrThrow();
  const plannedPracticesCollection = collection(db, 'users', user.uid, 'plannedPractices');
  const plannedPracticesQuery = query(
    plannedPracticesCollection,
    where('dateKey', '==', dateKey),
  );

  const snapshot = await getDocs(plannedPracticesQuery);

  return snapshot.docs
    .map((docSnapshot) => mapPlannedPracticeDocument(docSnapshot, user.uid))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function deletePlannedPractice(plannedPracticeId: string): Promise<void> {
  const user = getCurrentUserOrThrow();
  const plannedPracticeRef = doc(
    db,
    'users',
    user.uid,
    'plannedPractices',
    plannedPracticeId,
  );

  await deleteDoc(plannedPracticeRef);
}
