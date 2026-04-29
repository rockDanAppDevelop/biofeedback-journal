import { useLocalSearchParams } from 'expo-router';

import BiofeedbackRoutineAddItemScreen from '../../../src/features/biofeedback/screens/BiofeedbackRoutineAddItemScreen';

export default function RoutineAddItemPage() {
  const params = useLocalSearchParams<{ routineId: string }>();

  return <BiofeedbackRoutineAddItemScreen routineId={params.routineId ?? ''} />;
}
