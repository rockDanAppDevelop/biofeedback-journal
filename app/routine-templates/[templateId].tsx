import { useLocalSearchParams } from 'expo-router';

import BiofeedbackRoutineTemplateDetailScreen from '../../src/features/biofeedback/screens/BiofeedbackRoutineTemplateDetailScreen';

export default function RoutineTemplateDetailPage() {
  const params = useLocalSearchParams<{ templateId: string }>();

  return <BiofeedbackRoutineTemplateDetailScreen templateId={params.templateId ?? 'new'} />;
}
