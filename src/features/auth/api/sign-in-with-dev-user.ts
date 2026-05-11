import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../../lib/firebase';
import { isDev } from '../../../lib/app-env';
import { ensureUserProfile } from '../data/ensure-user-profile';

const DEV_USER_EMAILS = [
  'dev@biofeedback.local',
  'coach@biofeedback.local',
  'trainee@biofeedback.local',
] as const;

export type DevUserEmail = (typeof DEV_USER_EMAILS)[number];

const DEFAULT_DEV_USER_EMAIL: DevUserEmail = 'dev@biofeedback.local';
const DEV_USER_PASSWORD = 'ChangeMe123!';

function isDevUserEmail(email: string): email is DevUserEmail {
  return DEV_USER_EMAILS.includes(email as DevUserEmail);
}

export async function signInWithDevUser(email: DevUserEmail = DEFAULT_DEV_USER_EMAIL) {
  if (!isDev()) {
    throw new Error('Dev login is only available in dev environment');
  }

  if (!isDevUserEmail(email)) {
    throw new Error('Unknown dev user');
  }

  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    DEV_USER_PASSWORD,
  );

  await ensureUserProfile();

  return userCredential;
}
