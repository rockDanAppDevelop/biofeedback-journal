import { AuthGate } from '../src/features/auth/components/AuthGate';
import BiofeedbackDashboardScreen from '../src/features/biofeedback/screens/BiofeedbackDashboardScreen';

export default function DashboardPage() {
  return (
    <AuthGate>
      <BiofeedbackDashboardScreen />
    </AuthGate>
  );
}
