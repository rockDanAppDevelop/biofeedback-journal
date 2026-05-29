import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BiofeedbackHeader from '../components/BiofeedbackHeader';
import DateTimeField from '../components/DateTimeField';
import { toDateKey } from '../components/calendar.utils';
import {
  createMonitoringSchedule,
  listActiveMonitoringSchedules,
} from '../data/firebase-monitoring-schedules-repository';
import type { MonitoringScheduleFrequency } from '../types/monitoring-schedule.types';

const FREQUENCY_OPTIONS: { label: string; value: MonitoringScheduleFrequency }[] = [
  { label: 'weekly', value: 'weekly' },
  { label: 'biweekly', value: 'biweekly' },
  { label: 'monthly', value: 'monthly' },
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

export default function BiofeedbackMonitoringScheduleCreateScreen() {
  const todayDateKey = useMemo(() => toDateKey(new Date()), []);
  const [frequency, setFrequency] = useState<MonitoringScheduleFrequency>('weekly');
  const [reminderTime, setReminderTime] = useState('20:00');
  const [nextDueDateKey, setNextDueDateKey] = useState(todayDateKey);
  const [isSaving, setIsSaving] = useState(false);

  function navigateBackSafely() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/dashboard');
    }
  }

  async function handleSave() {
    if (isSaving) {
      return;
    }

    const parsedReminderTime = parseTimeValue(reminderTime);

    if (!parsedReminderTime) {
      Alert.alert('שעה לא תקינה', 'יש לבחור שעת תזכורת תקינה.');
      return;
    }

    try {
      setIsSaving(true);

      const activeSchedules = await listActiveMonitoringSchedules();
      const hasActiveMorningSchedule = activeSchedules.some(
        (schedule) => schedule.monitoringType === 'morning',
      );

      if (hasActiveMorningSchedule) {
        Alert.alert(
          'ניטור בוקר כבר קיים',
          'כרגע אפשר ליצור ניטור בוקר פעיל אחד בלבד.',
        );
        return;
      }

      await createMonitoringSchedule({
        monitoringType: 'morning',
        frequency,
        reminderHour: parsedReminderTime.hour,
        reminderMinute: parsedReminderTime.minute,
        nextDueDateKey,
        pendingSinceDateKey: null,
        isActive: true,
      });

      navigateBackSafely();
    } catch (error) {
      console.log('MONITORING SCHEDULE CREATE FAILED:', error);
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
          style={[styles.saveButton, isSaving ? styles.saveButtonDisabled : null]}
          onPress={handleSave}
          disabled={isSaving}
        >
          <Text style={styles.saveButtonText}>
            {isSaving ? 'שומר...' : 'שמור ניטור בוקר'}
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
