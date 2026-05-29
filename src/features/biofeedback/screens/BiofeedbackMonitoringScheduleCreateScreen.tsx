import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BiofeedbackHeader from '../components/BiofeedbackHeader';
import DateTimeField from '../components/DateTimeField';
import { toDateKey } from '../components/calendar.utils';
import {
  createMonitoringSchedule,
  listActiveMonitoringSchedules,
  updateMonitoringSchedule,
} from '../data/firebase-monitoring-schedules-repository';
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

export default function BiofeedbackMonitoringScheduleCreateScreen() {
  const todayDateKey = useMemo(() => toDateKey(new Date()), []);
  const [frequency, setFrequency] = useState<MonitoringScheduleFrequency>('weekly');
  const [reminderTime, setReminderTime] = useState('20:00');
  const [nextDueDateKey, setNextDueDateKey] = useState(todayDateKey);
  const [activeMorningSchedule, setActiveMorningSchedule] =
    useState<MonitoringSchedule | null>(null);
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

    async function loadActiveMorningSchedule() {
      try {
        setIsLoading(true);
        const activeSchedules = await listActiveMonitoringSchedules();
        const morningSchedule =
          activeSchedules.find((schedule) => schedule.monitoringType === 'morning') ?? null;

        if (!isActive) {
          return;
        }

        setActiveMorningSchedule(morningSchedule);

        if (morningSchedule) {
          setFrequency(morningSchedule.frequency);
          setReminderTime(
            toTimeValue(morningSchedule.reminderHour, morningSchedule.reminderMinute),
          );
          setNextDueDateKey(morningSchedule.nextDueDateKey);
        }
      } catch (error) {
        console.warn('MONITORING SCHEDULE LOAD FAILED:', error);
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadActiveMorningSchedule();

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

      if (activeMorningSchedule) {
        await updateMonitoringSchedule(activeMorningSchedule.id, {
          frequency,
          reminderHour: parsedReminderTime.hour,
          reminderMinute: parsedReminderTime.minute,
          nextDueDateKey,
          pendingSinceDateKey: null,
        });
      } else {
        await createMonitoringSchedule({
          monitoringType: 'morning',
          frequency,
          reminderHour: parsedReminderTime.hour,
          reminderMinute: parsedReminderTime.minute,
          nextDueDateKey,
          pendingSinceDateKey: null,
          isActive: true,
        });
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
            label="תאריך ניטור הבא"
            value={nextDueDateKey}
            mode="date"
            onChangeValue={setNextDueDateKey}
          />
        </View>

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
});
