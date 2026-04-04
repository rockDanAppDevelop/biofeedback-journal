

import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyA8bIxwoslSysNho2GvqhUroRbEPgiS_C4",
  authDomain: 'biofeedback-journal.firebaseapp.com',
  projectId: 'biofeedback-journal',
  storageBucket: 'biofeedback-journal.firebasestorage.app',
  messagingSenderId: '400338054941',
  appId: '1:400338054941:web:4a572a9cb5e356843f7bf4',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };