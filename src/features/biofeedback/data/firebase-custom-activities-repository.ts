import { addDoc, collection, doc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { auth, db } from '../../../lib/firebase';
import type {
  CreateUserCustomActivityInput,
  UserCustomActivity,
} from '../types/user-custom-activity.types';

type FirebaseCustomActivityDocument = {
  label: string;
  measurementType: UserCustomActivity['measurementType'];
  createdAt: string;
  isActive: boolean;
};

export async function listActiveCustomActivitiesFromFirestore(): Promise<UserCustomActivity[]> {
  const user = auth.currentUser;

  if (!user) {
    throw new Error('No authenticated user');
  }

  const customActivitiesCollection = collection(db, 'users', user.uid, 'customActivities');

  const customActivitiesQuery = query(
    customActivitiesCollection,
    where('isActive', '==', true),
  );

  const snapshot = await getDocs(customActivitiesQuery);

  return snapshot.docs
    .map((docSnapshot) => {
      const data = docSnapshot.data() as FirebaseCustomActivityDocument;

      return {
        id: docSnapshot.id,
        label: data.label,
        measurementType: data.measurementType,
        createdAt: data.createdAt,
        isActive: data.isActive,
      };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function addCustomActivityToFirestore(
  input: CreateUserCustomActivityInput,
): Promise<UserCustomActivity> {
  const user = auth.currentUser;

  if (!user) {
    throw new Error('No authenticated user');
  }

  const customActivitiesCollection = collection(db, 'users', user.uid, 'customActivities');
  const label = input.label.trim();
  const createdAt = new Date().toISOString();

  const docData: FirebaseCustomActivityDocument = {
    label,
    measurementType: input.measurementType,
    createdAt,
    isActive: true,
  };

  const docRef = await addDoc(customActivitiesCollection, docData);

  return {
    id: docRef.id,
    ...docData,
  };
}

export async function hideCustomActivityInFirestore(activityId: string): Promise<void> {
  const user = auth.currentUser;

  if (!user) {
    throw new Error('No authenticated user');
  }

  const activityRef = doc(db, 'users', user.uid, 'customActivities', activityId);

  await updateDoc(activityRef, {
    isActive: false,
  });
}
