import { Alert, Button, View } from 'react-native';
import { isDev } from '../../../lib/app-env';
import { signInWithGoogle } from '../api/sign-in-with-google';
import { signInWithDevUser, type DevUserEmail } from '../api/sign-in-with-dev-user';

export function GoogleSignInButton() {
  const handlePress = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error(error);
      Alert.alert('שגיאה', 'Google login נכשל');
    }
  };

  const handleDevLogin = async (email?: DevUserEmail) => {
    try {
      await signInWithDevUser(email);
    } catch (error) {
      console.error(error);
      Alert.alert('שגיאה', 'כניסת פיתוח נכשלה');
    }
  };

  return (
    <View style={{ gap: 12 }}>
      {isDev() ? (
        <>
          <Button title="כניסת פיתוח" onPress={() => handleDevLogin()} />
          <Button title="Coach" onPress={() => handleDevLogin('coach@biofeedback.local')} />
          <Button title="Trainee" onPress={() => handleDevLogin('trainee@biofeedback.local')} />
        </>
      ) : (
        <Button title="התחברות עם Google" onPress={handlePress} />
      )}
    </View>
  );
}
