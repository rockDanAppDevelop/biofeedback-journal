import { router } from 'expo-router';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useEffect, useMemo, useRef, useState } from 'react';
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

import BiofeedbackHeader from '../../biofeedback/components/BiofeedbackHeader';
import { toDateKey } from '../../biofeedback/components/calendar.utils';
import { hasBiofeedbackEntryForDateKeyFromFirestore } from '../../biofeedback/data/firebase-biofeedback-read-repository';
import {
  updateCurrentUserPlannedReminderTime,
  updateCurrentUserReminderTime,
} from '../../auth/data/update-current-user-reminder-time';
import {
  dismissDeliveredPlannedItemsMorningRemindersByKind,
  syncDailyReminderForToday,
  syncPlannedItemsMorningReminder,
} from '../lib/daily-reminder';
import {
  DEFAULT_DAILY_REMINDER_TIME,
  getDailyReminderTime,
} from '../lib/get-daily-reminder-time';
import {
  DEFAULT_PLANNED_REMINDER_TIME,
  getPlannedReminderTime,
} from '../lib/get-planned-reminder-time';

type ReminderPickerTarget = 'daily' | 'planned';
type ReminderTime = { hour: number; minute: number };

function formatTwoDigits(value: number): string {
  return String(value).padStart(2, '0');
}

function toTimeLabel(hourText: string, minuteText: string): string {
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
    return '--:--';
  }

  return `${formatTwoDigits(hour)}:${formatTwoDigits(minute)}`;
}

function toTimeDate(
  hourText: string,
  minuteText: string,
  fallbackTime: { hour: number; minute: number },
): Date {
  const date = new Date();
  const reminderTime = parseReminderTime(hourText, minuteText);

  if (!reminderTime) {
    date.setHours(fallbackTime.hour, fallbackTime.minute, 0, 0);
    return date;
  }

  date.setHours(reminderTime.hour, reminderTime.minute, 0, 0);
  return date;
}

function parseReminderTime(
  hourText: string,
  minuteText: string,
): ReminderTime | null {
  const hour = Number(hourText.trim());
  const minute = Number(minuteText.trim());

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

  return {
    hour,
    minute,
  };
}

export default function ReminderSettingsScreen() {
  const [dailyHourText, setDailyHourText] = useState(String(DEFAULT_DAILY_REMINDER_TIME.hour));
  const [dailyMinuteText, setDailyMinuteText] = useState(String(DEFAULT_DAILY_REMINDER_TIME.minute));
  const [plannedHourText, setPlannedHourText] = useState(
    String(DEFAULT_PLANNED_REMINDER_TIME.hour),
  );
  const [plannedMinuteText, setPlannedMinuteText] = useState(
    String(DEFAULT_PLANNED_REMINDER_TIME.minute),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<ReminderPickerTarget | null>(null);
  const loadedPlannedReminderTimeRef = useRef<ReminderTime | null>(null);
  const dailyTimeLabel = useMemo(
    () => toTimeLabel(dailyHourText, dailyMinuteText),
    [dailyHourText, dailyMinuteText],
  );
  const plannedTimeLabel = useMemo(
    () => toTimeLabel(plannedHourText, plannedMinuteText),
    [plannedHourText, plannedMinuteText],
  );

  useEffect(() => {
    let isActive = true;

    async function loadReminderTime() {
      try {
        setIsLoading(true);
        const [dailyReminderTime, plannedReminderTime] = await Promise.all([
          getDailyReminderTime(),
          getPlannedReminderTime(),
        ]);

        if (!isActive) {
          return;
        }

        setDailyHourText(String(dailyReminderTime.hour));
        setDailyMinuteText(String(dailyReminderTime.minute));
        setPlannedHourText(String(plannedReminderTime.hour));
        setPlannedMinuteText(String(plannedReminderTime.minute));
        loadedPlannedReminderTimeRef.current = plannedReminderTime;
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadReminderTime();

    return () => {
      isActive = false;
    };
  }, []);

  function handleTimePickerChange(event: DateTimePickerEvent, selectedDate?: Date) {
    if (Platform.OS !== 'ios') {
      setPickerTarget(null);
    }

    if (event.type === 'dismissed' || !selectedDate || !pickerTarget) {
      return;
    }

    if (pickerTarget === 'daily') {
      setDailyHourText(String(selectedDate.getHours()));
      setDailyMinuteText(String(selectedDate.getMinutes()));
      return;
    }

    setPlannedHourText(String(selectedDate.getHours()));
    setPlannedMinuteText(String(selectedDate.getMinutes()));
  }

  async function handleSave() {
    if (isSaving) {
      return;
    }

    const dailyReminderTime = parseReminderTime(dailyHourText, dailyMinuteText);
    const plannedReminderTime = parseReminderTime(plannedHourText, plannedMinuteText);

    if (!dailyReminderTime || !plannedReminderTime) {
      Alert.alert('שעה לא תקינה', 'יש להזין שעה בין 0 ל-23 ודקה בין 0 ל-59.');
      return;
    }

    const dailyMinutes = dailyReminderTime.hour * 60 + dailyReminderTime.minute;
    const plannedMinutes = plannedReminderTime.hour * 60 + plannedReminderTime.minute;

    if (plannedMinutes >= dailyMinutes) {
      Alert.alert(
        'שעה לא תקינה',
        'תזכורת לתרגולים מתוכננים חייבת להיות מוקדמת יותר מהתזכורת היומית.',
      );
      return;
    }

    try {
      setIsSaving(true);
      await Promise.all([
        updateCurrentUserReminderTime(dailyReminderTime),
        updateCurrentUserPlannedReminderTime(plannedReminderTime),
      ]);

      const todayDateKey = toDateKey(new Date());
      const hasEntryToday = await hasBiofeedbackEntryForDateKeyFromFirestore(todayDateKey);
      await Promise.all([
        syncDailyReminderForToday(hasEntryToday, dailyReminderTime),
        syncPlannedItemsMorningReminder(7, plannedReminderTime),
      ]);

      const loadedPlannedReminderTime = loadedPlannedReminderTimeRef.current;
      const didPlannedReminderTimeChange =
        loadedPlannedReminderTime !== null &&
        (
          loadedPlannedReminderTime.hour !== plannedReminderTime.hour ||
          loadedPlannedReminderTime.minute !== plannedReminderTime.minute
        );

      if (didPlannedReminderTimeChange) {
        await dismissDeliveredPlannedItemsMorningRemindersByKind();
        loadedPlannedReminderTimeRef.current = plannedReminderTime;
      }

      Alert.alert('נשמר', 'שעות התזכורת נשמרו.', [
        {
          text: 'אישור',
          onPress: () => router.replace('/dashboard'),
        },
      ]);
    } catch (error) {
      console.error('REMINDER SETTINGS SAVE FAILED:', error);
      Alert.alert('שגיאה', 'שמירת שעת התזכורת נכשלה.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <BiofeedbackHeader variant="screen" title="תזכורות" />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>תזכורת יומית אם לא תורגל</Text>
          <Text style={styles.descriptionText}>
            תזכורת לתרגול תישלח אם עדיין לא נשמר תרגול באותו יום.
          </Text>

          {isLoading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color="#1e4f8a" />
              <Text style={styles.loadingText}>טוען...</Text>
            </View>
          ) : (
            <>
              {Platform.OS === 'web' ? (
                <>
                  <Text style={styles.label}>שעה</Text>
                  <TextInput
                    value={dailyHourText}
                    onChangeText={setDailyHourText}
                    style={styles.input}
                    keyboardType="numeric"
                    maxLength={2}
                    placeholder="21"
                  />

                  <Text style={styles.label}>דקה</Text>
                  <TextInput
                    value={dailyMinuteText}
                    onChangeText={setDailyMinuteText}
                    style={styles.input}
                    keyboardType="numeric"
                    maxLength={2}
                    placeholder="00"
                  />
                </>
              ) : (
                <>
                  <Pressable style={styles.timeField} onPress={() => setPickerTarget('daily')}>
                    <Text style={styles.timeFieldLabel}>שעה</Text>
                    <Text style={styles.currentTimeText}>{dailyTimeLabel}</Text>
                  </Pressable>

                  {pickerTarget === 'daily' ? (
                    <DateTimePicker
                      value={toTimeDate(
                        dailyHourText,
                        dailyMinuteText,
                        DEFAULT_DAILY_REMINDER_TIME,
                      )}
                      mode="time"
                      display="default"
                      is24Hour
                      onChange={handleTimePickerChange}
                    />
                  ) : null}
                </>
              )}
            </>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>תזכורת לתרגולים מתוכננים</Text>
          <Text style={styles.descriptionText}>תישלח אם יש תרגולים מתוכננים לאותו יום.</Text>

          {isLoading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color="#1e4f8a" />
              <Text style={styles.loadingText}>טוען...</Text>
            </View>
          ) : (
            <>
              {Platform.OS === 'web' ? (
                <>
                  <Text style={styles.label}>שעה</Text>
                  <TextInput
                    value={plannedHourText}
                    onChangeText={setPlannedHourText}
                    style={styles.input}
                    keyboardType="numeric"
                    maxLength={2}
                    placeholder="06"
                  />

                  <Text style={styles.label}>דקה</Text>
                  <TextInput
                    value={plannedMinuteText}
                    onChangeText={setPlannedMinuteText}
                    style={styles.input}
                    keyboardType="numeric"
                    maxLength={2}
                    placeholder="00"
                  />
                </>
              ) : (
                <>
                  <Pressable style={styles.timeField} onPress={() => setPickerTarget('planned')}>
                    <Text style={styles.timeFieldLabel}>שעה</Text>
                    <Text style={styles.currentTimeText}>{plannedTimeLabel}</Text>
                  </Pressable>

                  {pickerTarget === 'planned' ? (
                    <DateTimePicker
                      value={toTimeDate(
                        plannedHourText,
                        plannedMinuteText,
                        DEFAULT_PLANNED_REMINDER_TIME,
                      )}
                      mode="time"
                      display="default"
                      is24Hour
                      onChange={handleTimePickerChange}
                    />
                  ) : null}
                </>
              )}
            </>
          )}
        </View>

        <Pressable
          style={[styles.saveButton, (isLoading || isSaving) && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isLoading || isSaving}
        >
          <Text style={styles.saveButtonText}>{isSaving ? 'שומר...' : 'שמירה'}</Text>
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
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    borderWidth: 1,
    borderColor: '#d7e3f4',
    borderRadius: 12,
    backgroundColor: '#f8fbff',
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#243447',
    textAlign: 'right',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#4b5563',
    textAlign: 'right',
    lineHeight: 20,
    marginBottom: 14,
  },
  timeField: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  timeFieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5b6b7d',
    marginBottom: 6,
  },
  currentTimeText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1e4f8a',
    textAlign: 'center',
  },
  loadingRow: {
    minHeight: 96,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#4b5563',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#243447',
    textAlign: 'right',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    backgroundColor: '#ffffff',
    minHeight: 44,
    paddingHorizontal: 12,
    marginBottom: 12,
    textAlign: 'center',
    fontSize: 18,
  },
  saveButton: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#1e88e5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.55,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
