import { useLocalSearchParams } from 'expo-router';

import BiofeedbackRoutineTemplateAddItemScreen from '../../../src/features/biofeedback/screens/BiofeedbackRoutineTemplateAddItemScreen';

export default function RoutineTemplateAddItemPage() {
  const params = useLocalSearchParams<{ templateId: string }>();

  return <BiofeedbackRoutineTemplateAddItemScreen templateId={params.templateId ?? ''} />;
}
