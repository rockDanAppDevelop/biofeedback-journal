//src\features\auth\api\sign-in-with-google.ts

import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '../../../lib/firebase';

export async function signInWithGoogle() {
  await GoogleSignin.hasPlayServices();

  const result = await GoogleSignin.signIn();

  const idToken = result.data?.idToken;
  if (!idToken) {
    throw new Error('Google sign-in failed: missing idToken');
  }

  const credential = GoogleAuthProvider.credential(idToken);

  return signInWithCredential(auth, credential);
}