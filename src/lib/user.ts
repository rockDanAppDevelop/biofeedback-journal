import AsyncStorage from '@react-native-async-storage/async-storage';
import { signInAnonymously } from 'firebase/auth';
import { auth } from './firebase';

const STORAGE_KEY = 'biofeedback_user_uid';

export async function getOrCreateUser() {
  const storedUid = await AsyncStorage.getItem(STORAGE_KEY);

  if (auth.currentUser && storedUid === auth.currentUser.uid) {
    return auth.currentUser;
  }

  if (auth.currentUser) {
    await AsyncStorage.setItem(STORAGE_KEY, auth.currentUser.uid);
    return auth.currentUser;
  }

  const result = await signInAnonymously(auth);
  await AsyncStorage.setItem(STORAGE_KEY, result.user.uid);

  return result.user;
}