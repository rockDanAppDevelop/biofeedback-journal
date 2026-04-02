//app\day\[dateKey].tsx

import { useLocalSearchParams } from 'expo-router';

import BiofeedbackDayEntriesScreen from '../../src/features/biofeedback/screens/BiofeedbackDayEntriesScreen';

export default function DayPage() {
  const params = useLocalSearchParams<{ dateKey: string }>();

  return <BiofeedbackDayEntriesScreen dateKey={params.dateKey ?? ''} />;
}

