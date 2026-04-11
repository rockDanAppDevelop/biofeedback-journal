
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import * as FirebaseAuth from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFirebaseConfig } from './firebase-config';

const firebaseConfig = getFirebaseConfig();

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const auth = (() => {
  try {
    const getReactNativePersistence = (FirebaseAuth as typeof FirebaseAuth & {
      getReactNativePersistence: (
        storage: typeof ReactNativeAsyncStorage
      ) => FirebaseAuth.Persistence;
    }).getReactNativePersistence;

    return FirebaseAuth.initializeAuth(app, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage),
    });
  } catch {
    return FirebaseAuth.getAuth(app);
  }
})();

const db = getFirestore(app);

export { app, auth, db };
