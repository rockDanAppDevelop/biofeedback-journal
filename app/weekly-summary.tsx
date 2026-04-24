import { AuthGate } from '../src/features/auth/components/AuthGate';
import BiofeedbackWeeklySummaryScreen from '../src/features/biofeedback/screens/BiofeedbackWeeklySummaryScreen';

export default function WeeklySummaryPage() {
  return (
    <AuthGate>
      <BiofeedbackWeeklySummaryScreen />
    </AuthGate>
  );
}
