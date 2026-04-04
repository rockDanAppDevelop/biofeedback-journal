import { getOrCreateUser } from './user';

export async function testFirebaseConnection() {
  const user = await getOrCreateUser();
  console.log('USER ID:', user.uid);
  return user;
}