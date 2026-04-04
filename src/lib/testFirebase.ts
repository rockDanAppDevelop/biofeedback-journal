import { auth } from './firebase';
import { signInAnonymously } from 'firebase/auth';

export async function testFirebaseConnection() {
  const result = await signInAnonymously(auth);
  console.log('USER ID:', result.user.uid);
}