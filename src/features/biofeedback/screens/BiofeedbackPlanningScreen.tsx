import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { toDateKey } from '../components/calendar.utils';
import {
  archiveRoutine,
  listActiveRoutines,
} from '../data/firebase-routines-repository';
import {
  createRoutineFromTemplatePreview,
  readRoutineTemplateFromFile,
  type RoutineTemplatePreview,
} from '../data/routine-template.io';
import type { Routine } from '../types/routine.types';
import BiofeedbackHeader from '../components/BiofeedbackHeader';

function formatCycleLength(cycleLengthDays: number): string {
  return `מחזור כל ${cycleLengthDays} ימים`;
}

function formatItemCount(count: number): string {
  return `${count} תרגילים`;
}

function getActiveRoutineItemCount(routine: Routine): number {
  return routine.items.filter((item) => item.removedFromDateKey === null).length;
}

export default function BiofeedbackPlanningScreen() {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isImportingTemplate, setIsImportingTemplate] = useState(false);
  const [pendingTemplate, setPendingTemplate] = useState<RoutineTemplatePreview | null>(null);
  const [pendingRoutineName, setPendingRoutineName] = useState('');
  const [isSavingImportedRoutine, setIsSavingImportedRoutine] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const loadRoutines = useCallback(async (shouldApply: () => boolean = () => true) => {
    try {
      setIsLoading(true);
      setErrorMessage('');

      const nextRoutines = await listActiveRoutines();

      if (!shouldApply()) {
        return;
      }

      setRoutines(nextRoutines);
    } catch (error) {
      if (!shouldApply()) {
        return;
      }

      console.log('PLANNING ROUTINES LOAD FAILED:', error);
      setErrorMessage('לא הצלחנו לטעון את הרוטינות כרגע.');
    } finally {
      if (shouldApply()) {
        setIsLoading(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      void loadRoutines(() => isActive);

      return () => {
        isActive = false;
      };
    }, [loadRoutines]),
  );

  function handleCreateRoutinePress() {
    router.push('/routines/new');
  }

  async function handleImportTemplatePress() {
    if (isImportingTemplate) {
      return;
    }

    if (Platform.OS !== 'web') {
      Alert.alert('ייבוא תבנית', 'ייבוא תבנית זמין כרגע בווב');
      return;
    }

    try {
      setIsImportingTemplate(true);

      const template = await readRoutineTemplateFromFile();
      setPendingTemplate(template);
      setPendingRoutineName(template.name);
    } catch (error) {
      console.log('ROUTINE TEMPLATE IMPORT FAILED:', error);
      Alert.alert(
        'ייבוא התבנית נכשל',
        error instanceof Error ? error.message : 'לא הצלחנו לייבא את התבנית כרגע.',
      );
    } finally {
      setIsImportingTemplate(false);
    }
  }

  async function handleSaveImportedTemplatePress() {
    if (!pendingTemplate || isSavingImportedRoutine) {
      return;
    }

    const trimmedName = pendingRoutineName.trim();

    if (!trimmedName) {
      Alert.alert('שם רוטינה חסר', 'יש להזין שם לרוטינה.');
      return;
    }

    try {
      setIsSavingImportedRoutine(true);

      const routine = await createRoutineFromTemplatePreview(
        pendingTemplate,
        trimmedName,
        toDateKey(new Date()),
      );

      setPendingTemplate(null);
      setPendingRoutineName('');
      router.push(`/routines/${routine.id}`);
    } catch (error) {
      console.log('ROUTINE TEMPLATE SAVE FAILED:', error);
      Alert.alert(
        'שמירת הרוטינה נכשלה',
        error instanceof Error ? error.message : 'לא הצלחנו לשמור את הרוטינה כרגע.',
      );
    } finally {
      setIsSavingImportedRoutine(false);
    }
  }

  function handleCancelImportedTemplatePress() {
    if (isSavingImportedRoutine) {
      return;
    }

    setPendingTemplate(null);
    setPendingRoutineName('');
  }

  function handleArchiveRoutinePress(routine: Routine) {
    Alert.alert(
      'למחוק את הרוטינה?',
      'הרוטינה לא תופיע יותר במסך התכנון. תרגולים שכבר תוכננו או בוצעו לא יימחקו.',
      [
        {
          text: 'ביטול',
          style: 'cancel',
        },
        {
          text: 'מחק',
          style: 'destructive',
          onPress: async () => {
            try {
              await archiveRoutine(routine.id);
              await loadRoutines();
            } catch (error) {
              console.log('ROUTINE ARCHIVE FAILED:', error);
              Alert.alert('מחיקת הרוטינה נכשלה', 'לא הצלחנו למחוק את הרוטינה כרגע.');
            }
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <BiofeedbackHeader variant="screen" title="תכנון תרגולים" />

        <View style={styles.headerRow}>
          <Pressable style={styles.createButton} onPress={handleCreateRoutinePress}>
            <Text style={styles.createButtonText}>רוטינה חדשה</Text>
          </Pressable>

          <Pressable
            style={[
              styles.importButton,
              isImportingTemplate ? styles.importButtonDisabled : null,
            ]}
            onPress={handleImportTemplatePress}
            disabled={isImportingTemplate}
          >
            <Text style={styles.importButtonText}>
              {isImportingTemplate ? 'מייבא...' : 'ייבוא תבנית'}
            </Text>
          </Pressable>
        </View>

        {pendingTemplate ? (
          <View style={styles.importPreviewCard}>
            <Text style={styles.importPreviewTitle}>תבנית מוכנה לייבוא</Text>
            <Text style={styles.importPreviewMeta}>
              מחזור כל {pendingTemplate.cycleLengthDays} ימים
            </Text>
            <Text style={styles.importPreviewMeta}>
              {formatItemCount(pendingTemplate.items.length)}
            </Text>

            <Text style={styles.importPreviewLabel}>שם הרוטינה</Text>
            <TextInput
              value={pendingRoutineName}
              onChangeText={setPendingRoutineName}
              style={styles.importPreviewInput}
              placeholder="שם הרוטינה"
            />

            <View style={styles.importPreviewActions}>
              <Pressable
                style={[
                  styles.saveImportedRoutineButton,
                  isSavingImportedRoutine ? styles.saveImportedRoutineButtonDisabled : null,
                ]}
                onPress={handleSaveImportedTemplatePress}
                disabled={isSavingImportedRoutine}
              >
                <Text style={styles.saveImportedRoutineButtonText}>
                  {isSavingImportedRoutine ? 'שומר...' : 'שמור כרוטינה חדשה'}
                </Text>
              </Pressable>

              <Pressable
                style={styles.cancelImportedRoutineButton}
                onPress={handleCancelImportedTemplatePress}
                disabled={isSavingImportedRoutine}
              >
                <Text style={styles.cancelImportedRoutineButtonText}>בטל</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {isLoading ? (
          <View style={styles.stateCard}>
            <ActivityIndicator size="small" color="#1e4f8a" />
            <Text style={styles.stateText}>טוען רוטינות...</Text>
          </View>
        ) : errorMessage ? (
          <View style={styles.stateCard}>
            <Text style={styles.stateText}>{errorMessage}</Text>
          </View>
        ) : routines.length === 0 ? (
          <View style={styles.stateCard}>
            <Text style={styles.emptyTitle}>אין עדיין רוטינות</Text>
            <Text style={styles.stateText}>כאן יופיעו רוטינות התרגול הקבועות שלך.</Text>
          </View>
        ) : (
          <View style={styles.routinesList}>
            {routines.map((routine) => (
              <View key={routine.id} style={styles.routineCard}>
                <Pressable
                  style={styles.routineCardContent}
                  onPress={() => router.push(`/routines/${routine.id}`)}
                >
                  <Text style={styles.routineName}>{routine.name}</Text>
                  <Text style={styles.routineMeta}>
                    {formatItemCount(getActiveRoutineItemCount(routine))}
                  </Text>
                  <Text style={styles.routineMeta}>
                    {formatCycleLength(routine.cycleLengthDays)}
                  </Text>
                  <Text style={styles.routineMeta}>תאריך התחלה: {routine.startDateKey}</Text>
                </Pressable>

                <Pressable
                  style={styles.archiveRoutineButton}
                  onPress={() => handleArchiveRoutinePress(routine)}
                >
                  <Text style={styles.archiveRoutineButtonText}>מחק</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  headerRow: {
    gap: 12,
    marginTop: 8,
    marginBottom: 18,
  },
  createButton: {
    height: 44,
    borderRadius: 12,
    backgroundColor: '#1e4f8a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  importButton: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d7e3f4',
    backgroundColor: '#f3f6fb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  importButtonDisabled: {
    opacity: 0.6,
  },
  importButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e4f8a',
  },
  importPreviewCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d7e3f4',
    backgroundColor: '#f8fbff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 18,
  },
  importPreviewTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#243447',
    textAlign: 'right',
    marginBottom: 8,
  },
  importPreviewMeta: {
    fontSize: 14,
    color: '#5b6b7d',
    textAlign: 'right',
    marginBottom: 4,
  },
  importPreviewLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
    textAlign: 'right',
    marginTop: 12,
    marginBottom: 6,
  },
  importPreviewInput: {
    borderWidth: 1,
    borderColor: '#cfcfcf',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    marginBottom: 12,
    fontSize: 16,
    textAlign: 'right',
  },
  importPreviewActions: {
    gap: 8,
  },
  saveImportedRoutineButton: {
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: '#1e4f8a',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  saveImportedRoutineButtonDisabled: {
    opacity: 0.6,
  },
  saveImportedRoutineButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
  },
  cancelImportedRoutineButton: {
    minHeight: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d7d7d7',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  cancelImportedRoutineButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
  },
  stateCard: {
    minHeight: 160,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d7e3f4',
    backgroundColor: '#f8fbff',
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateText: {
    fontSize: 15,
    color: '#4b5563',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 22,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#243447',
    textAlign: 'center',
    marginBottom: 8,
  },
  routinesList: {
    gap: 12,
  },
  routineCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d7e3f4',
    backgroundColor: '#f8fbff',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  routineCardContent: {
    flex: 1,
  },
  archiveRoutineButton: {
    minWidth: 54,
    minHeight: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#f0b8b8',
    backgroundColor: '#fff5f5',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  archiveRoutineButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#b71c1c',
  },
  routineName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#243447',
    textAlign: 'right',
    marginBottom: 8,
  },
  routineMeta: {
    fontSize: 14,
    color: '#5b6b7d',
    textAlign: 'right',
    marginTop: 4,
  },
});
