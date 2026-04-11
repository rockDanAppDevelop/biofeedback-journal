// app\index.tsx

import BiofeedbackStartupDecisionScreen from '../src/features/biofeedback/screens/BiofeedbackStartupDecisionScreen';
import { AuthGate } from '../src/features/auth/components/AuthGate';

export default function Page() {
  return (
    <AuthGate>
      <BiofeedbackStartupDecisionScreen />
    </AuthGate>
  );
}
