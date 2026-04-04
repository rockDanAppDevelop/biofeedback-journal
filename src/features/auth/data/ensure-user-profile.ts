//src\features\auth\data\ensure-user-profile.ts

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../../lib/firebase';

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export async function ensureUserProfile() {
  const user = auth.currentUser;

  if (!user) {
    throw new Error('No authenticated user');
  }

  const userRef = doc(db, 'users', user.uid);
  const snapshot = await getDoc(userRef);

  if (snapshot.exists()) {
    return snapshot.data();
  }

  const now = new Date();

  const profile = {
    email: user.email ?? null,
    firstSeenAt: now.toISOString(),
    firstSeenDateKey: toDateKey(now),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  await setDoc(userRef, profile);

  return profile;
}