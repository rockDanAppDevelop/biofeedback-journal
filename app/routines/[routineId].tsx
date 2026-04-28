import { useLocalSearchParams } from 'expo-router';

import BiofeedbackRoutineDetailScreen from '../../src/features/biofeedback/screens/BiofeedbackRoutineDetailScreen';

export default function RoutineDetailPage() {
  const params = useLocalSearchParams<{ routineId: string }>();

  return <BiofeedbackRoutineDetailScreen routineId={params.routineId ?? ''} />;
}
