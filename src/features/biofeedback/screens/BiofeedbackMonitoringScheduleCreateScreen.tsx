import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BiofeedbackHeader from '../components/BiofeedbackHeader';
import DateTimeField from '../components/DateTimeField';
import { toDateKey } from '../components/calendar.utils';
import { listAllBiofeedbackEntriesFromFirestore } from '../data/firebase-biofeedback-read-repository';
import {
  createMonitoringSchedule,
  listMonitoringSchedules,
  updateMonitoringSchedule,
} from '../data/firebase-monitoring-schedules-repository';
import {
  getNextMonitoringDueDateKey,
  isMorningMonitoringEntry,
} from '../lib/monitoring-schedule-status';
import type {
  MonitoringSchedule,
  MonitoringScheduleFrequency,
} from '../types/monitoring-schedule.types';
import { syncMonitoringMorningReminders } from '../../notifications/lib/monitoring-reminders';

const FREQUENCY_OPTIONS: { label: string; value: MonitoringScheduleFrequency }[] = [
  { label: 'שבועי', value: 'weekly' },
  { label: 'דו-שבועי', value: 'biweekly' },
  { label: 'תלת-שבועי', value: 'triweekly' },
  { label: 'חודשי', value: 'monthly' },
];

function parseTimeValue(timeValue: string): { hour: number; minute: number } | null {
  const [hourText, minuteText] = timeValue.split(':');
  const hour = Number(hourText);
  const minute = Number(minuteText);

  if (
    !Number.isInteger(hour) ||
    !Number.isInteger(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }

  return { hour, minute };
}

function toTimeValue(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function createScheduleFormUpdate(
  frequency: MonitoringScheduleFrequency,
  reminderTime: { hour: number; minute: number },
  nextDueDateKey: string,
) {
  return {
    frequency,
    reminderHour: reminderTime.hour,
    reminderMinute: reminderTime.minute,
    nextDueDateKey,
    pendingSinceDateKey: null,
  };
}

function getLastMorningMonitoringDateKeyFromEntries(
  entries: Awaited<ReturnType<typeof listAllBiofeedbackEntriesFromFirestore>>,
): string | null {
  return entries
    .filter(isMorningMonitoringEntry)
    .map((entry) => entry.dateKey)
    .sort()
    .at(-1) ?? null;
}

function getNextDueDateKeyForFrequency(
  schedule: MonitoringSchedule | null,
  frequency: MonitoringScheduleFrequency,
  formNextDueDateKey: string,
  lastMorningMonitoringDateKey: string | null,
): string {
  if (
    schedule &&
    schedule.frequency !== frequency &&
    lastMorningMonitoringDateKey !== null
  ) {
    return getNextMonitoringDueDateKey(lastMorningMonitoringDateKey, frequency);
  }

  return formNextDueDateKey;
}

export default function BiofeedbackMonitoringScheduleCreateScreen() {
  const todayDateKey = useMemo(() => toDateKey(new Date()), []);
  const [frequency, setFrequency] = useState<MonitoringScheduleFrequency>('weekly');
  const [reminderTime, setReminderTime] = useState('20:00');
  const [nextDueDateKey, setNextDueDateKey] = useState(todayDateKey);
  const [morningSchedule, setMorningSchedule] =
    useState<MonitoringSchedule | null>(null);
  const [lastMorningMonitoringDateKey, setLastMorningMonitoringDateKey] =
    useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  function navigateBackSafely() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/dashboard');
    }
  }

  useEffect(() => {
    let isActive = true;

    async function loadMorningSchedule() {
      try {
        setIsLoading(true);
        const schedules = await listMonitoringSchedules();
        const entries = await listAllBiofeedbackEntriesFromFirestore();
        const nextMorningSchedule =
          schedules.find((schedule) => schedule.monitoringType === 'morning') ?? null;
        const nextLastMorningMonitoringDateKey =
          getLastMorningMonitoringDateKeyFromEntries(entries);

        if (!isActive) {
          return;
        }

        setMorningSchedule(nextMorningSchedule);
        setLastMorningMonitoringDateKey(nextLastMorningMonitoringDateKey);

        if (nextMorningSchedule) {
          setFrequency(nextMorningSchedule.frequency);
          setReminderTime(
            toTimeValue(nextMorningSchedule.reminderHour, nextMorningSchedule.reminderMinute),
          );
          setNextDueDateKey(nextMorningSchedule.nextDueDateKey);
        }
      } catch (error) {
        console.warn('MONITORING SCHEDULE LOAD FAILED:', error);
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadMorningSchedule();

    return () => {
      isActive = false;
    };
  }, []);

  async function handleSave() {
    if (isSaving || isLoading) {
      return;
    }

    const parsedReminderTime = parseTimeValue(reminderTime);

    if (!parsedReminderTime) {
      Alert.alert('שעה לא תקינה', 'יש לבחור שעת תזכורת תקינה.');
      return;
    }

    try {
      setIsSaving(true);
      const scheduleFormUpdate = createScheduleFormUpdate(
        frequency,
        parsedReminderTime,
        getNextDueDateKeyForFrequency(
          morningSchedule,
          frequency,
          nextDueDateKey,
          lastMorningMonitoringDateKey,
        ),
      );

      if (morningSchedule) {
        await updateMonitoringSchedule(morningSchedule.id, scheduleFormUpdate);
        setMorningSchedule({
          ...morningSchedule,
          ...scheduleFormUpdate,
        });
        setNextDueDateKey(scheduleFormUpdate.nextDueDateKey);
      } else {
        const createdSchedule = await createMonitoringSchedule({
          monitoringType: 'morning',
          ...scheduleFormUpdate,
          isActive: true,
        });
        setMorningSchedule(createdSchedule);
        setNextDueDateKey(createdSchedule.nextDueDateKey);
      }

      try {
        await syncMonitoringMorningReminders();
      } catch (error) {
        console.warn('MONITORING REMINDER SYNC FAILED:', error);
      }

      navigateBackSafely();
    } catch (error) {
      console.log('MONITORING SCHEDULE SAVE FAILED:', error);
      Alert.alert(
        'שמירת ניטור הבוקר נכשלה',
        error instanceof Error ? error.message : 'לא הצלחנו לשמור את ניטור הבוקר כרגע.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggleActivePress() {
    if (!morningSchedule || isSaving || isLoading) {
      return;
    }

    const parsedReminderTime = parseTimeValue(reminderTime);

    if (!morningSchedule.isActive && !parsedReminderTime) {
      Alert.alert('שעה לא תקינה', 'יש לבחור שעת תזכורת תקינה.');
      return;
    }

    try {
      setIsSaving(true);
      const scheduleFormUpdate = parsedReminderTime
        ? createScheduleFormUpdate(
            frequency,
            parsedReminderTime,
            getNextDueDateKeyForFrequency(
              morningSchedule,
              frequency,
              nextDueDateKey,
              lastMorningMonitoringDateKey,
            ),
          )
        : null;

      if (morningSchedule.isActive) {
        await updateMonitoringSchedule(morningSchedule.id, {
          isActive: false,
        });
        setMorningSchedule({
          ...morningSchedule,
          isActive: false,
        });
      } else if (scheduleFormUpdate) {
        await updateMonitoringSchedule(morningSchedule.id, {
          isActive: true,
          ...scheduleFormUpdate,
        });
        setMorningSchedule({
          ...morningSchedule,
          isActive: true,
          ...scheduleFormUpdate,
        });
        setNextDueDateKey(scheduleFormUpdate.nextDueDateKey);
      }

      try {
        await syncMonitoringMorningReminders();
      } catch (error) {
        console.warn('MONITORING REMINDER SYNC FAILED:', error);
      }
    } catch (error) {
      console.log('MONITORING SCHEDULE ACTIVE TOGGLE FAILED:', error);
      Alert.alert(
        'עדכון ניטור הבוקר נכשל',
        error instanceof Error ? error.message : 'לא הצלחנו לעדכן את ניטור הבוקר כרגע.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <BiofeedbackHeader
          variant="screen"
          title="ניטור בוקר"
          onBackPress={navigateBackSafely}
        />

        <View style={styles.section}>
          <Text style={styles.description}>
            ניטור בוקר הוא מדידה תקופתית, לא חלק מרצף התרגול.
          </Text>

          <Text style={styles.label}>תדירות</Text>
          <View style={styles.frequencyOptions}>
            {FREQUENCY_OPTIONS.map((option) => {
              const isSelected = frequency === option.value;

              return (
                <Pressable
                  key={option.value}
                  style={[
                    styles.frequencyButton,
                    isSelected ? styles.frequencyButtonSelected : null,
                  ]}
                  onPress={() => setFrequency(option.value)}
                >
                  <Text
                    style={[
                      styles.frequencyButtonText,
                      isSelected ? styles.frequencyButtonTextSelected : null,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <DateTimeField
            label="שעת תזכורת"
            value={reminderTime}
            mode="time"
            onChangeValue={setReminderTime}
          />

          <DateTimeField
            label="חלון ניטור הבא החל מ־"
            value={nextDueDateKey}
            mode="date"
            onChangeValue={setNextDueDateKey}
          />
        </View>

        {morningSchedule ? (
          <View style={styles.statusSection}>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>סטטוס</Text>
              <Text
                style={[
                  styles.statusValue,
                  morningSchedule.isActive ? styles.statusActive : styles.statusInactive,
                ]}
              >
                {morningSchedule.isActive ? 'פעיל' : 'מושבת'}
              </Text>
            </View>

            <Pressable
              style={[
                styles.toggleButton,
                morningSchedule.isActive ? styles.disableButton : styles.enableButton,
                (isSaving || isLoading) ? styles.saveButtonDisabled : null,
              ]}
              onPress={handleToggleActivePress}
              disabled={isSaving || isLoading}
            >
              <Text
                style={[
                  styles.toggleButtonText,
                  morningSchedule.isActive ? styles.disableButtonText : styles.enableButtonText,
                ]}
              >
                {morningSchedule.isActive ? 'השבת ניטור בוקר' : 'הפעל ניטור בוקר'}
              </Text>
            </Pressable>
          </View>
        ) : null}

        <Pressable
          style={[styles.saveButton, isSaving || isLoading ? styles.saveButtonDisabled : null]}
          onPress={handleSave}
          disabled={isSaving || isLoading}
        >
          <Text style={styles.saveButtonText}>
            {isLoading ? 'טוען...' : isSaving ? 'שומר...' : 'שמור ניטור בוקר'}
          </Text>
        </Pressable>
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
  section: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d7e3f4',
    backgroundColor: '#f8fbff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 16,
  },
  statusSection: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e3d7f4',
    backgroundColor: '#fbf8ff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4b5563',
    textAlign: 'right',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  statusActive: {
    color: '#1e4f8a',
  },
  statusInactive: {
    color: '#6b7280',
  },
  description: {
    fontSize: 15,
    color: '#4b5563',
    textAlign: 'right',
    lineHeight: 22,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
    textAlign: 'right',
    marginBottom: 6,
  },
  frequencyOptions: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  frequencyButton: {
    minHeight: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#bfd4ee',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  frequencyButtonSelected: {
    borderColor: '#1e4f8a',
    backgroundColor: '#e3f2fd',
  },
  frequencyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#46607a',
  },
  frequencyButtonTextSelected: {
    color: '#0d47a1',
  },
  saveButton: {
    height: 48,
    borderRadius: 14,
    backgroundColor: '#1e4f8a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  toggleButton: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  enableButton: {
    borderColor: '#1e4f8a',
    backgroundColor: '#e3f2fd',
  },
  disableButton: {
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
  },
  toggleButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  enableButtonText: {
    color: '#0d47a1',
  },
  disableButtonText: {
    color: '#4b5563',
  },
});
