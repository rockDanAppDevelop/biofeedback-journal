import { auth } from './firebase';

export async function testFirebaseConnection() {
  const user = auth.currentUser;

  if (!user) {
    throw new Error('User is not authenticated');
  }

  console.log('USER ID:', user.uid);
  return user;
}
