// app\index.tsx

import BiofeedbackDashboardScreen from '../src/features/biofeedback/screens/BiofeedbackDashboardScreen';
import { AuthGate } from '../src/features/auth/components/AuthGate';

export default function Page() {
  return (
    <AuthGate>
      <BiofeedbackDashboardScreen />
    </AuthGate>
  );
}