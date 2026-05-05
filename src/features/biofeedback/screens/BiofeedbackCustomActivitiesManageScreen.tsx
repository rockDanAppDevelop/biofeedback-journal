import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  listAllCustomActivitiesFromFirestore,
  restoreCustomActivityInFirestore,
  toggleCustomActivityFavoriteInFirestore,
  updateCustomActivityInFirestore,
} from '../data/firebase-custom-activities-repository';
import type { UserCustomActivity } from '../types/user-custom-activity.types';
import BiofeedbackHeader from '../components/BiofeedbackHeader';

const MEASUREMENT_TYPE_LABELS: Record<UserCustomActivity['measurementType'], string> = {
  hrv: 'HRV',
  rlx: 'RLX',
  none: 'ללא',
};

function isValidMeasurementType(
  value: string,
): value is UserCustomActivity['measurementType'] {
  return value === 'hrv' || value === 'rlx' || value === 'none';
}

export default function BiofeedbackCustomActivitiesManageScreen() {
  const [activities, setActivities] = useState<UserCustomActivity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState('');
  const [editingMeasurementType, setEditingMeasurementType] = useState<string>('');
  const [processingActivityId, setProcessingActivityId] = useState<string | null>(null);

  useEffect(() => {
    void loadActivities();
  }, []);

  async function loadActivities() {
    setIsLoading(true);

    try {
      const items = await listAllCustomActivitiesFromFirestore();
      setActivities(items);
    } catch (error) {
      console.error('FAILED TO LOAD ALL CUSTOM ACTIVITIES:', error);
      Alert.alert('שגיאה', 'טעינת התרגולים נכשלה.');
    } finally {
      setIsLoading(false);
    }
  }

  const sortedActivities = useMemo(
    () =>
      [...activities].sort((a, b) => {
        if (a.isFavorite !== b.isFavorite) {
          return a.isFavorite ? -1 : 1;
        }

        return b.createdAt.localeCompare(a.createdAt);
      }),
    [activities],
  );

  const activeActivities = useMemo(
    () => sortedActivities.filter((activity) => activity.isActive),
    [sortedActivities],
  );

  const hiddenActivities = useMemo(
    () => sortedActivities.filter((activity) => !activity.isActive),
    [sortedActivities],
  );

  function handleStartEditing(activity: UserCustomActivity) {
    setEditingActivityId(activity.id);
    setEditingLabel(activity.label);
    setEditingMeasurementType(activity.measurementType);
  }

  function handleCancelEditing() {
    setEditingActivityId(null);
    setEditingLabel('');
    setEditingMeasurementType('');
  }

  async function handleSaveEdit(activity: UserCustomActivity) {
    const nextLabel = editingLabel.trim();

    if (nextLabel === '') {
      Alert.alert('שגיאה', 'שם התרגול לא יכול להיות ריק.');
      return;
    }

    if (!isValidMeasurementType(editingMeasurementType)) {
      Alert.alert('שגיאה', 'סוג המדידה שנבחר אינו תקין.');
      return;
    }

    setProcessingActivityId(activity.id);

    try {
      await updateCustomActivityInFirestore(activity.id, {
        label: nextLabel,
        measurementType: editingMeasurementType,
      });

      setActivities((current) =>
        current.map((item) =>
          item.id === activity.id
            ? {
                ...item,
                label: nextLabel,
                measurementType: editingMeasurementType,
              }
            : item,
        ),
      );

      handleCancelEditing();
    } catch (error) {
      console.error('FAILED TO UPDATE CUSTOM ACTIVITY:', error);
      Alert.alert('שגיאה', 'עדכון התרגול נכשל.');
    } finally {
      setProcessingActivityId(null);
    }
  }

  async function handleRestore(activity: UserCustomActivity) {
    setProcessingActivityId(activity.id);

    try {
      await restoreCustomActivityInFirestore(activity.id);

      setActivities((current) =>
        current.map((item) =>
          item.id === activity.id
            ? {
                ...item,
                isActive: true,
              }
            : item,
        ),
      );
    } catch (error) {
      console.error('FAILED TO RESTORE CUSTOM ACTIVITY:', error);
      Alert.alert('שגיאה', 'שחזור התרגול נכשל.');
    } finally {
      setProcessingActivityId(null);
    }
  }

  async function handleToggleFavorite(activity: UserCustomActivity) {
    const nextIsFavorite = !activity.isFavorite;

    setProcessingActivityId(activity.id);

    try {
      await toggleCustomActivityFavoriteInFirestore(activity.id, nextIsFavorite);

      setActivities((current) =>
        current.map((item) =>
          item.id === activity.id
            ? {
                ...item,
                isFavorite: nextIsFavorite,
              }
            : item,
        ),
      );
    } catch (error) {
      console.error('FAILED TO TOGGLE CUSTOM ACTIVITY FAVORITE:', error);
      Alert.alert('שגיאה', 'עדכון המועדפות נכשל.');
    } finally {
      setProcessingActivityId(null);
    }
  }

  function renderActivityCard(activity: UserCustomActivity) {
    const isEditing = editingActivityId === activity.id;
    const isBusy = processingActivityId === activity.id;
    const isAnotherItemEditing =
      editingActivityId !== null && editingActivityId !== activity.id;

    return (
      <View key={activity.id} style={styles.card}>
        {isEditing ? (
          <>
            <Text style={styles.fieldLabel}>שם התרגול</Text>
            <TextInput
              value={editingLabel}
              onChangeText={setEditingLabel}
              style={styles.input}
              placeholder="שם התרגול"
            />

            <Text style={styles.fieldLabel}>סוג מדידה</Text>
            <View style={styles.optionsRow}>
              {([
                { id: 'hrv', label: 'HRV' },
                { id: 'rlx', label: 'RLX' },
                { id: 'none', label: 'ללא' },
              ] as const).map((option) => {
                const isSelected = editingMeasurementType === option.id;

                return (
                  <Pressable
                    key={option.id}
                    onPress={() => setEditingMeasurementType(option.id)}
                    style={[
                      styles.optionButton,
                      isSelected && styles.optionButtonSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.optionButtonText,
                        isSelected && styles.optionButtonTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.actionsRow}>
              <Pressable
                onPress={() => void handleSaveEdit(activity)}
                style={[styles.actionButton, styles.primaryActionButton]}
                disabled={isBusy}
              >
                <Text style={styles.primaryActionButtonText}>שמור</Text>
              </Pressable>
              <Pressable
                onPress={handleCancelEditing}
                style={styles.actionButton}
                disabled={isBusy}
              >
                <Text style={styles.actionButtonText}>ביטול</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <>
            <View style={styles.cardHeader}>
              <View style={styles.cardTextBlock}>
                <Text style={styles.cardTitle}>{activity.label}</Text>
                <Text style={styles.cardSubtitle}>
                  {MEASUREMENT_TYPE_LABELS[activity.measurementType]}
                  {activity.isFavorite ? ' • מועדף' : ''}
                </Text>
              </View>

              <Pressable
                onPress={() => void handleToggleFavorite(activity)}
                style={styles.favoriteButton}
                disabled={isBusy}
              >
                <Text style={styles.favoriteButtonText}>
                  {activity.isFavorite ? '⭐' : '☆'}
                </Text>
              </Pressable>
            </View>

            <View style={styles.actionsRow}>
              <Pressable
                onPress={() => handleStartEditing(activity)}
                style={[styles.actionButton, isAnotherItemEditing && styles.disabledButton]}
                disabled={isBusy || isAnotherItemEditing}
              >
                <Text style={styles.actionButtonText}>עריכה</Text>
              </Pressable>
              {!activity.isActive ? (
                <Pressable
                  onPress={() => void handleRestore(activity)}
                  style={styles.actionButton}
                  disabled={isBusy}
                >
                  <Text style={styles.actionButtonText}>שחזור</Text>
                </Pressable>
              ) : null}
            </View>
          </>
        )}
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <BiofeedbackHeader variant="screen" title="ניהול התרגולים שלי" />

        {isLoading ? <Text style={styles.loadingText}>טוען תרגולים...</Text> : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>פעילים</Text>
          {activeActivities.length > 0 ? (
            activeActivities.map((activity) => renderActivityCard(activity))
          ) : (
            <Text style={styles.emptyText}>אין תרגולים פעילים.</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>מוסתרים</Text>
          {hiddenActivities.length > 0 ? (
            hiddenActivities.map((activity) => renderActivityCard(activity))
          ) : (
            <Text style={styles.emptyText}>אין תרגולים מוסתרים.</Text>
          )}
        </View>
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
    padding: 16,
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    color: '#46607a',
  },
  section: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dcdcdc',
    backgroundColor: '#fafafa',
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 14,
    color: '#5f6f82',
  },
  card: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d6e4f5',
    backgroundColor: '#ffffff',
    padding: 12,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  cardTextBlock: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222222',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#46607a',
  },
  favoriteButton: {
    paddingVertical: 4,
  },
  favoriteButtonText: {
    fontSize: 20,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d6e4f5',
    backgroundColor: '#f8fbff',
  },
  primaryActionButton: {
    borderColor: '#1e88e5',
    backgroundColor: '#e3f2fd',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e4f8a',
  },
  primaryActionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0d47a1',
  },
  disabledButton: {
    opacity: 0.5,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222222',
  },
  input: {
    borderWidth: 1,
    borderColor: '#cfcfcf',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  optionButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#cfcfcf',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  optionButtonSelected: {
    borderColor: '#1e88e5',
    backgroundColor: '#e3f2fd',
  },
  optionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#222222',
  },
  optionButtonTextSelected: {
    color: '#0d47a1',
    fontWeight: '700',
  },
});
