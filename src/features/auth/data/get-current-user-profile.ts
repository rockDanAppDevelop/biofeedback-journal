//src\features\auth\data\get-current-user-profile.ts

import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../../lib/firebase';

export type CurrentUserProfile = {
  email: string | null;
  firstSeenAt: string;
  firstSeenDateKey: string;
  createdAt: string;
  updatedAt: string;
};

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
    createdAt: String(data.createdAt ?? ''),
    updatedAt: String(data.updatedAt ?? ''),
  };
}