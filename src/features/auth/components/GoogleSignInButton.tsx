//src\features\auth\components\GoogleSignInButton.tsx

import { Alert, Button } from 'react-native';
import { signInWithGoogle } from '../api/sign-in-with-google';

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

  return <Button title="התחברות עם Google" onPress={handlePress} />;
}