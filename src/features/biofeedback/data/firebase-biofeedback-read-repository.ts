//src\features\biofeedback\data\firebase-biofeedback-read-repository.ts

import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import { auth, db } from '../../../lib/firebase';

export type FirebaseBiofeedbackEntry = {
  id: string;
  measurementDate: string;
  measurementTime: string;
  dateKey: string;
  measuredAt: string;
  exerciseName: string;
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