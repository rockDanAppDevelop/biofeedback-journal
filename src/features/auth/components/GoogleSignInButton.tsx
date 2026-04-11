import { Alert, Button, View } from 'react-native';
import { signInWithGoogle } from '../api/sign-in-with-google';
import { signInWithDevUser } from '../api/sign-in-with-dev-user';

export function GoogleSignInButton() {
  const handlePress = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error(error);
      Alert.alert('שגיאה', 'Google login נכשל');
    }
  };

  const handleDevLogin = async () => {
    try {
      await signInWithDevUser();
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
