import type { FirebaseOptions } from 'firebase/app';
import { getAppEnv } from './app-env';

const devFirebaseConfig: FirebaseOptions = {
  apiKey: 'AIzaSyAJPgdUVhm7Z_96fqzKCE-f5NDbtmqit10',
  authDomain: 'biofeedback-journal-dev.firebaseapp.com',
  projectId: 'biofeedback-journal-dev',
  storageBucket: 'biofeedback-journal-dev.firebasestorage.app',
  messagingSenderId: '239873150550',
  appId: '1:239873150550:web:5d15ec873470ead19a35f7',
};

const prodFirebaseConfig: FirebaseOptions = {
  apiKey: 'AIzaSyA8bIxwoslSysNho2GvqhUroRbEPgiS_C4',
  authDomain: 'biofeedback-journal.firebaseapp.com',
  projectId: 'biofeedback-journal',
  storageBucket: 'biofeedback-journal.firebasestorage.app',
  messagingSenderId: '400338054941',
  appId: '1:400338054941:web:4a572a9cb5e356843f7bf4',
};

export function getFirebaseConfig(): FirebaseOptions {
  return getAppEnv() === 'prod' ? prodFirebaseConfig : devFirebaseConfig;
}
