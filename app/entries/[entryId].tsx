//app\entries\[entryId].tsx

import { useLocalSearchParams } from 'expo-router';

import BiofeedbackEntryDetailScreen from '../../src/features/biofeedback/screens/BiofeedbackEntryDetailScreen';

export default function EntryDetailPage() {
  const params = useLocalSearchParams<{ entryId: string }>();

  return <BiofeedbackEntryDetailScreen entryId={params.entryId ?? ''} />;
}