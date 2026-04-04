//src\features\auth\components\AuthStatus.tsx

import { Text, View } from 'react-native';
import { auth } from '../../../lib/firebase';

export function AuthStatus() {
  const user = auth.currentUser;

  if (!user) {
    return (
      <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
        <Text style={{ fontSize: 14 }}>לא מחובר</Text>
      </View>
    );
  }

  return (
    <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
      <Text style={{ fontSize: 14 }}>מחובר: {user.email ?? 'ללא אימייל'}</Text>
      <Text style={{ fontSize: 12, color: '#666' }}>uid: {user.uid}</Text>
    </View>
  );
}