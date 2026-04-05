//src\features\biofeedback\data\firebase-biofeedback-entry-by-id-repository.ts

import { deleteDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../../lib/firebase';
import type { MeasurementType } from '../constants/exercise-options';

export type FirebaseBiofeedbackEntryById = {
  id: string;
  measurementDate: string;
  measurementTime: string;
  dateKey: string;
  measuredAt: string;
  exerciseName: string;
  measurementType: MeasurementType | null;
  durationMinutes: number;
  hrvStressPercent: string;
  hrvMidRangePercent: string;
  hrvRelaxationPercent: string;
  rlxStartValue: string;
  rlxEndValue: string;
  notes: string;
  createdAt: string;
  updatedAt?: string;
};

export async function getBiofeedbackEntryByIdFromFirestore(
  entryId: string
): Promise<FirebaseBiofeedbackEntryById | null> {
  const user = auth.currentUser;

  if (!user) {
    throw new Error('No authenticated user');
  }

  const entryRef = doc(db, 'users', user.uid, 'entries', entryId);
  const snapshot = await getDoc(entryRef);

  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.data();

  return {
    id: snapshot.id,
    measurementDate: data.measurementDate,
    measurementTime: data.measurementTime,
    dateKey: data.dateKey,
    measuredAt: data.measuredAt,
    exerciseName: data.exerciseName,
    measurementType: data.measurementType ?? null,
    durationMinutes: data.durationMinutes,
    hrvStressPercent: data.hrvStressPercent ?? '',
    hrvMidRangePercent: data.hrvMidRangePercent ?? '',
    hrvRelaxationPercent: data.hrvRelaxationPercent ?? '',
    rlxStartValue: data.rlxStartValue ?? '',
    rlxEndValue: data.rlxEndValue ?? '',
    notes: data.notes ?? '',
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

export async function updateBiofeedbackEntryInFirestore(
  entryId: string,
  input: Omit<FirebaseBiofeedbackEntryById, 'id' | 'createdAt'>
) {
  const user = auth.currentUser;

  if (!user) {
    throw new Error('No authenticated user');
  }

  const entryRef = doc(db, 'users', user.uid, 'entries', entryId);

  await updateDoc(entryRef, {
    measurementDate: input.measurementDate,
    measurementTime: input.measurementTime,
    dateKey: input.dateKey,
    measuredAt: input.measuredAt,
    exerciseName: input.exerciseName,
    measurementType: input.measurementType,
    durationMinutes: input.durationMinutes,
    hrvStressPercent: input.hrvStressPercent,
    hrvMidRangePercent: input.hrvMidRangePercent,
    hrvRelaxationPercent: input.hrvRelaxationPercent,
    rlxStartValue: input.rlxStartValue,
    rlxEndValue: input.rlxEndValue,
    notes: input.notes,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteBiofeedbackEntryFromFirestore(entryId: string) {
  const user = auth.currentUser;

  if (!user) {
    throw new Error('No authenticated user');
  }

  const entryRef = doc(db, 'users', user.uid, 'entries', entryId);
  await deleteDoc(entryRef);
}