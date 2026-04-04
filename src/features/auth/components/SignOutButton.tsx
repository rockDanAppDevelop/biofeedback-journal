//src\features\auth\components\SignOutButton.tsx

import { Alert, Button } from 'react-native';
import { signOut } from 'firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { auth } from '../../../lib/firebase';

export function SignOutButton() {
  const handlePress = async () => {
    try {
      await signOut(auth);
      await GoogleSignin.signOut();
      Alert.alert('התנתקת', 'ההתנתקות הצליחה');
    } catch (error) {
      console.error(error);
      Alert.alert('שגיאה', 'ההתנתקות נכשלה');
    }
  };

  return <Button title="התנתקות" onPress={handlePress} />;
}