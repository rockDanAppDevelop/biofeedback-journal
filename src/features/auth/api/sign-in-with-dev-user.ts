import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../../lib/firebase';
import { isDev } from '../../../lib/app-env';
import { ensureUserProfile } from '../data/ensure-user-profile';

const DEV_USER_EMAIL = 'dev@biofeedback.local';
const DEV_USER_PASSWORD = 'ChangeMe123!';

export async function signInWithDevUser() {
  if (!isDev()) {
    throw new Error('Dev login is only available in dev environment');
  }

  const userCredential = await signInWithEmailAndPassword(
    auth,
    DEV_USER_EMAIL,
    DEV_USER_PASSWORD,
  );

  await ensureUserProfile();

  return userCredential;
}
