import {
  arrayRemove,
  arrayUnion,
  doc,
  getDoc,
  setDoc,
} from 'firebase/firestore';

import { auth, db } from '../../../lib/firebase';

type UserCatalogFavoritesDocument = {
  favoriteCatalogActivityIds?: unknown;
};

export async function listFavoriteCatalogActivityIdsFromFirestore(): Promise<string[]> {
  const user = auth.currentUser;

  if (!user) {
    throw new Error('No authenticated user');
  }

  const userRef = doc(db, 'users', user.uid);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    return [];
  }

  const data = snapshot.data() as UserCatalogFavoritesDocument;

  if (!Array.isArray(data.favoriteCatalogActivityIds)) {
    return [];
  }

  return data.favoriteCatalogActivityIds.filter(
    (value): value is string => typeof value === 'string' && value.length > 0,
  );
}

export async function setCatalogActivityFavoriteInFirestore(
  catalogItemId: string,
  isFavorite: boolean,
): Promise<void> {
  const user = auth.currentUser;

  if (!user) {
    throw new Error('No authenticated user');
  }

  const userRef = doc(db, 'users', user.uid);

  await setDoc(
    userRef,
    {
      favoriteCatalogActivityIds: isFavorite
        ? arrayUnion(catalogItemId)
        : arrayRemove(catalogItemId),
    },
    { merge: true },
  );
}
