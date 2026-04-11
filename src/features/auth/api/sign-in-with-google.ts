//src\features\auth\api\sign-in-with-google.ts

import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '../../../lib/firebase';
import { ensureUserProfile } from '../data/ensure-user-profile';
import { getGoogleSigninOrNull } from './google-sign-in-adapter';

export async function signInWithGoogle() {
  const googleSignin = await getGoogleSigninOrNull();

  if (!googleSignin) {
    throw new Error('Google Sign-In is not supported in Expo Go');
  }

  await googleSignin.hasPlayServices();

  const result = await googleSignin.signIn();

  const idToken = result.data?.idToken;
  if (!idToken) {
    throw new Error('Google sign-in failed: missing idToken');
  }

  const credential = GoogleAuthProvider.credential(idToken);
  const userCredential = await signInWithCredential(auth, credential);

  await ensureUserProfile();

  return userCredential;
}
