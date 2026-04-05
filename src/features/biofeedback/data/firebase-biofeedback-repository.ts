// src\features\biofeedback\data\firebase-biofeedback-repository.ts

import { addDoc, collection } from 'firebase/firestore';
import { auth, db } from '../../../lib/firebase';
import type { MeasurementType } from '../constants/exercise-options';


export type FirebaseBiofeedbackEntryInput = {
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
};

export async function addBiofeedbackEntryToFirestore(
  input: FirebaseBiofeedbackEntryInput
) {
  const user = auth.currentUser;

  if (!user) {
    throw new Error('No authenticated user');
  }

  const entriesCollection = collection(db, 'users', user.uid, 'entries');

  const docRef = await addDoc(entriesCollection, {
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
    createdAt: new Date().toISOString(),
  });

  return docRef.id;
}