import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from './firebase';

const STORAGE_KEY = 'biofeedback_user_uid';

export async function getOrCreateUser() {
  if (!auth.currentUser) {
    throw new Error('User is not authenticated');
  }

  await AsyncStorage.setItem(STORAGE_KEY, auth.currentUser.uid);

  return auth.currentUser;
}
