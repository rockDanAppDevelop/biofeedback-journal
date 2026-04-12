//src\features\biofeedback\data\firebase-biofeedback-read-repository.ts

import { collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import { auth, db } from '../../../lib/firebase';
import type { BiofeedbackEntry } from '../types/biofeedback-entry.types';
import { mapFirebaseBiofeedbackEntryToDomain } from './biofeedback-entry.mapper';

export type FirebaseBiofeedbackEntry = {
  id: string;
  measurementDate: string;
  measurementTime: string;
  dateKey: string;
  measuredAt: string;
  exerciseName: string;
  measurementType: 'hrv' | 'rlx' | null;
  durationMinutes: number;
  hrvStressPercent: string;
  hrvMidRangePercent: string;
  hrvRelaxationPercent: string;
  rlxStartValue: string;
  rlxEndValue: string;
  notes: string;
  createdAt: string;
};

export async function listBiofeedbackEntriesByDateKeyFromFirestore(
  dateKey: string
): Promise<FirebaseBiofeedbackEntry[]> {
  const user = auth.currentUser;

  if (!user) {
    throw new Error('No authenticated user');
  }

  const entriesCollection = collection(db, 'users', user.uid, 'entries');

  const entriesQuery = query(
    entriesCollection,
    where('dateKey', '==', dateKey),
    orderBy('measuredAt', 'asc')
  );

  const snapshot = await getDocs(entriesQuery);

  return snapshot.docs.map((docSnapshot) => {
    const data = docSnapshot.data();

    return {
      id: docSnapshot.id,
      measurementDate: data.measurementDate,
      measurementTime: data.measurementTime,
      dateKey: data.dateKey,
      measuredAt: data.measuredAt,
      exerciseName: data.exerciseName,
      measurementType: data.measurementType ?? null,
      durationMinutes: data.durationMinutes,
      hrvStressPercent: data.hrvStressPercent,
      hrvMidRangePercent: data.hrvMidRangePercent,
      hrvRelaxationPercent: data.hrvRelaxationPercent,
      rlxStartValue: data.rlxStartValue,
      rlxEndValue: data.rlxEndValue,
      notes: data.notes,
      createdAt: data.createdAt,
    };
  });
}

export async function listAllBiofeedbackEntriesFromFirestore(): Promise<BiofeedbackEntry[]> {
  const user = auth.currentUser;

  if (!user) {
    throw new Error('No authenticated user');
  }

  const entriesCollection = collection(db, 'users', user.uid, 'entries');

  const entriesQuery = query(
    entriesCollection,
    orderBy('measuredAt', 'desc')
  );

  const snapshot = await getDocs(entriesQuery);

  return snapshot.docs.map((docSnapshot) => {
    const data = docSnapshot.data();

    return mapFirebaseBiofeedbackEntryToDomain(
      {
        id: docSnapshot.id,
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
        updatedAt: data.updatedAt ?? data.createdAt,
      },
      {
        userId: user.uid,
      },
    );
  });
}

export async function hasBiofeedbackEntryForDateKeyFromFirestore(
  dateKey: string,
): Promise<boolean> {
  const user = auth.currentUser;

  if (!user) {
    throw new Error('No authenticated user');
  }

  const entriesCollection = collection(db, 'users', user.uid, 'entries');

  const entriesQuery = query(
    entriesCollection,
    where('dateKey', '==', dateKey),
    limit(1)
  );

  const snapshot = await getDocs(entriesQuery);

  return !snapshot.empty;
}
