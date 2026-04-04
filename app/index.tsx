// app\index.tsx

import { View } from 'react-native';
import BiofeedbackDashboardScreen from '../src/features/biofeedback/screens/BiofeedbackDashboardScreen';
import { GoogleSignInButton } from '../src/features/auth/components/GoogleSignInButton';

export default function Page() {
  return (
    <View style={{ flex: 1, paddingTop: 60 }}>
      <GoogleSignInButton />
      <View style={{ flex: 1 }}>
        <BiofeedbackDashboardScreen />
      </View>
    </View>
  );
}