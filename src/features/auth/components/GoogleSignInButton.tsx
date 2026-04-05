//src\features\auth\components\GoogleSignInButton.tsx

import { Alert, Button, View } from 'react-native';
import { signInWithGoogle } from '../api/sign-in-with-google';
import { signInAnonymously } from 'firebase/auth';
import { auth } from '../../../lib/firebase';

export function GoogleSignInButton() {
  const handlePress = async () => {
    try {
      await signInWithGoogle();
      Alert.alert('התחברת', 'Google login הצליח');
    } catch (error) {
      console.error(error);
      Alert.alert('שגיאה', 'Google login נכשל');
    }
  };

  const handleDevLogin = async () => {
    try {
      await signInAnonymously(auth);
      Alert.alert('התחברת', 'כניסת פיתוח הצליחה');
    } catch (error) {
      console.error(error);
      Alert.alert('שגיאה', 'כניסת פיתוח נכשלה');
    }
  };

  return (
    <View style={{ gap: 12 }}>
      <Button title="התחברות עם Google" onPress={handlePress} />
      <Button title="כניסת פיתוח" onPress={handleDevLogin} />
    </View>
  );
}