//src\features\auth\api\sign-in-with-google.ts

import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '../../../lib/firebase';
import { ensureUserProfile } from '../data/ensure-user-profile';

export async function signInWithGoogle() {
  await GoogleSignin.hasPlayServices();

  const result = await GoogleSignin.signIn();

  const idToken = result.data?.idToken;
  if (!idToken) {
    throw new Error('Google sign-in failed: missing idToken');
  }

  const credential = GoogleAuthProvider.credential(idToken);
  const userCredential = await signInWithCredential(auth, credential);

  await ensureUserProfile();

  return userCredential;
}