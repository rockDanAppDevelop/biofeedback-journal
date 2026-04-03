//app\entries\new.tsx

import { useLocalSearchParams } from 'expo-router';

import BiofeedbackEntryCreateScreen from '../../src/features/biofeedback/screens/BiofeedbackEntryCreateScreen';

export default function NewEntryPage() {
  const params = useLocalSearchParams<{ dateKey?: string }>();

  return <BiofeedbackEntryCreateScreen initialDateKey={params.dateKey} />;
}