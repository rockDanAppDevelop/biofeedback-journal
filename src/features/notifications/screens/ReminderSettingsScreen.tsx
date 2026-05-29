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
  listActiveMonitoringSchedules,
  updateMonitoringSchedule,
} from '../../biofeedback/data/firebase-monitoring-schedules-repository';
import type { MonitoringSchedule } from '../../biofeedback/types/monitoring-schedule.types';
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
import { syncMonitoringMorningReminders } from '../lib/monitoring-reminders';

type ReminderPickerTarget = 'daily' | 'planned' | 'monitoring';
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

function areReminderTimesEqual(
  firstTime: ReminderTime | null,
  secondTime: ReminderTime | null,
): boolean {
  return (
    firstTime !== null &&
    secondTime !== null &&
    firstTime.hour === secondTime.hour &&
    firstTime.minute === secondTime.minute
  );
}

function isReminderTimeBefore(firstTime: ReminderTime, secondTime: ReminderTime): boolean {
  return firstTime.hour * 60 + firstTime.minute < secondTime.hour * 60 + secondTime.minute;
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
  const [monitoringHourText, setMonitoringHourText] = useState('20');
  const [monitoringMinuteText, setMonitoringMinuteText] = useState('0');
  const [activeMorningMonitoringSchedule, setActiveMorningMonitoringSchedule] =
    useState<MonitoringSchedule | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<ReminderPickerTarget | null>(null);
  const [loadedDailyReminderTime, setLoadedDailyReminderTime] = useState<ReminderTime | null>(null);
  const [loadedPlannedReminderTime, setLoadedPlannedReminderTime] =
    useState<ReminderTime | null>(null);
  const loadedPlannedReminderTimeRef = useRef<ReminderTime | null>(null);
  const [loadedMonitoringReminderTime, setLoadedMonitoringReminderTime] =
    useState<ReminderTime | null>(null);
  const dailyTimeLabel = useMemo(
    () => toTimeLabel(dailyHourText, dailyMinuteText),
    [dailyHourText, dailyMinuteText],
  );
  const plannedTimeLabel = useMemo(
    () => toTimeLabel(plannedHourText, plannedMinuteText),
    [plannedHourText, plannedMinuteText],
  );
  const monitoringTimeLabel = useMemo(
    () => toTimeLabel(monitoringHourText, monitoringMinuteText),
    [monitoringHourText, monitoringMinuteText],
  );
  const currentDailyReminderTime = useMemo(
    () => parseReminderTime(dailyHourText, dailyMinuteText),
    [dailyHourText, dailyMinuteText],
  );
  const currentPlannedReminderTime = useMemo(
    () => parseReminderTime(plannedHourText, plannedMinuteText),
    [plannedHourText, plannedMinuteText],
  );
  const currentMonitoringReminderTime = useMemo(
    () => parseReminderTime(monitoringHourText, monitoringMinuteText),
    [monitoringHourText, monitoringMinuteText],
  );
  const hasChanges = useMemo(() => {
    if (!loadedDailyReminderTime || !loadedPlannedReminderTime) {
      return false;
    }

    if (!currentDailyReminderTime || !currentPlannedReminderTime) {
      return true;
    }

    const didBaseReminderTimesChange =
      !areReminderTimesEqual(currentDailyReminderTime, loadedDailyReminderTime) ||
      !areReminderTimesEqual(currentPlannedReminderTime, loadedPlannedReminderTime);

    if (!activeMorningMonitoringSchedule) {
      return didBaseReminderTimesChange;
    }

    if (!currentMonitoringReminderTime || !loadedMonitoringReminderTime) {
      return true;
    }

    return (
      didBaseReminderTimesChange ||
      !areReminderTimesEqual(currentMonitoringReminderTime, loadedMonitoringReminderTime)
    );
  }, [
    activeMorningMonitoringSchedule,
    currentDailyReminderTime,
    currentMonitoringReminderTime,
    currentPlannedReminderTime,
    loadedDailyReminderTime,
    loadedMonitoringReminderTime,
    loadedPlannedReminderTime,
  ]);
  const canResetToDefaults =
    !areReminderTimesEqual(currentDailyReminderTime, DEFAULT_DAILY_REMINDER_TIME) ||
    !areReminderTimesEqual(currentPlannedReminderTime, DEFAULT_PLANNED_REMINDER_TIME);

  useEffect(() => {
    let isActive = true;

    async function loadReminderTime() {
      try {
        setIsLoading(true);
        const [dailyReminderTime, plannedReminderTime, monitoringSchedules] = await Promise.all([
          getDailyReminderTime(),
          getPlannedReminderTime(),
          listActiveMonitoringSchedules(),
        ]);

        if (!isActive) {
          return;
        }

        const morningMonitoringSchedule =
          monitoringSchedules.find((schedule) => schedule.monitoringType === 'morning') ?? null;
        const monitoringReminderTime = morningMonitoringSchedule
          ? {
              hour: morningMonitoringSchedule.reminderHour,
              minute: morningMonitoringSchedule.reminderMinute,
            }
          : null;

        setDailyHourText(String(dailyReminderTime.hour));
        setDailyMinuteText(String(dailyReminderTime.minute));
        setPlannedHourText(String(plannedReminderTime.hour));
        setPlannedMinuteText(String(plannedReminderTime.minute));
        setActiveMorningMonitoringSchedule(morningMonitoringSchedule);
        if (monitoringReminderTime) {
          setMonitoringHourText(String(monitoringReminderTime.hour));
          setMonitoringMinuteText(String(monitoringReminderTime.minute));
        }
        setLoadedDailyReminderTime(dailyReminderTime);
        setLoadedPlannedReminderTime(plannedReminderTime);
        setLoadedMonitoringReminderTime(monitoringReminderTime);
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

    if (pickerTarget === 'monitoring') {
      setMonitoringHourText(String(selectedDate.getHours()));
      setMonitoringMinuteText(String(selectedDate.getMinutes()));
      return;
    }

    setPlannedHourText(String(selectedDate.getHours()));
    setPlannedMinuteText(String(selectedDate.getMinutes()));
  }

  async function saveReminderTimes(
    dailyReminderTime: ReminderTime | null,
    plannedReminderTime: ReminderTime | null,
    monitoringReminderTime: ReminderTime | null,
  ) {
    if (!dailyReminderTime || !plannedReminderTime) {
      Alert.alert('שעה לא תקינה', 'יש להזין שעה בין 0 ל-23 ודקה בין 0 ל-59.');
      return;
    }

    if (activeMorningMonitoringSchedule && !monitoringReminderTime) {
      Alert.alert('שעה לא תקינה', 'יש להזין שעה תקינה לתזכורת ניטור הבוקר.');
      return;
    }

    if (!isReminderTimeBefore(plannedReminderTime, dailyReminderTime)) {
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
        activeMorningMonitoringSchedule && monitoringReminderTime
          ? updateMonitoringSchedule(activeMorningMonitoringSchedule.id, {
              reminderHour: monitoringReminderTime.hour,
              reminderMinute: monitoringReminderTime.minute,
            })
          : Promise.resolve(),
      ]);

      const todayDateKey = toDateKey(new Date());
      const hasEntryToday = await hasBiofeedbackEntryForDateKeyFromFirestore(todayDateKey);
      await Promise.all([
        syncDailyReminderForToday(hasEntryToday, dailyReminderTime),
        syncPlannedItemsMorningReminder(7, plannedReminderTime),
        syncMonitoringMorningReminders(),
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
      }

      loadedPlannedReminderTimeRef.current = plannedReminderTime;
      setLoadedDailyReminderTime(dailyReminderTime);
      setLoadedPlannedReminderTime(plannedReminderTime);
      if (activeMorningMonitoringSchedule && monitoringReminderTime) {
        setActiveMorningMonitoringSchedule({
          ...activeMorningMonitoringSchedule,
          reminderHour: monitoringReminderTime.hour,
          reminderMinute: monitoringReminderTime.minute,
        });
        setLoadedMonitoringReminderTime(monitoringReminderTime);
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

  async function handleSave() {
    if (isSaving || !hasChanges) {
      return;
    }

    await saveReminderTimes(
      currentDailyReminderTime,
      currentPlannedReminderTime,
      activeMorningMonitoringSchedule ? currentMonitoringReminderTime : null,
    );
  }

  function handleResetToDefaultsPress() {
    if (isSaving || isLoading) {
      return;
    }

    Alert.alert(
      'חזרה לברירת מחדל',
      'להחזיר את התזכורת היומית ל-21:00 ואת תזכורת התרגולים המתוכננים ל-06:00?',
      [
        {
          text: 'ביטול',
          style: 'cancel',
        },
        {
          text: 'אישור',
          onPress: () => {
            setDailyHourText(String(DEFAULT_DAILY_REMINDER_TIME.hour));
            setDailyMinuteText(String(DEFAULT_DAILY_REMINDER_TIME.minute));
            setPlannedHourText(String(DEFAULT_PLANNED_REMINDER_TIME.hour));
            setPlannedMinuteText(String(DEFAULT_PLANNED_REMINDER_TIME.minute));
            void saveReminderTimes(
              DEFAULT_DAILY_REMINDER_TIME,
              DEFAULT_PLANNED_REMINDER_TIME,
              activeMorningMonitoringSchedule ? currentMonitoringReminderTime : null,
            );
          },
        },
      ],
    );
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ניטור בוקר</Text>
          <Text style={styles.descriptionText}>
            {activeMorningMonitoringSchedule
              ? 'תישלח בערב שלפני תאריך היעד של ניטור הבוקר.'
              : 'לא מוגדר ניטור בוקר.'}
          </Text>

          {isLoading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color="#1e4f8a" />
              <Text style={styles.loadingText}>טוען...</Text>
            </View>
          ) : activeMorningMonitoringSchedule ? (
            <>
              {Platform.OS === 'web' ? (
                <>
                  <Text style={styles.label}>שעה</Text>
                  <TextInput
                    value={monitoringHourText}
                    onChangeText={setMonitoringHourText}
                    style={styles.input}
                    keyboardType="numeric"
                    maxLength={2}
                    placeholder="20"
                  />

                  <Text style={styles.label}>דקה</Text>
                  <TextInput
                    value={monitoringMinuteText}
                    onChangeText={setMonitoringMinuteText}
                    style={styles.input}
                    keyboardType="numeric"
                    maxLength={2}
                    placeholder="00"
                  />
                </>
              ) : (
                <>
                  <Pressable style={styles.timeField} onPress={() => setPickerTarget('monitoring')}>
                    <Text style={styles.timeFieldLabel}>שעה</Text>
                    <Text style={styles.currentTimeText}>{monitoringTimeLabel}</Text>
                  </Pressable>

                  {pickerTarget === 'monitoring' ? (
                    <DateTimePicker
                      value={toTimeDate(monitoringHourText, monitoringMinuteText, {
                        hour: 20,
                        minute: 0,
                      })}
                      mode="time"
                      display="default"
                      is24Hour
                      onChange={handleTimePickerChange}
                    />
                  ) : null}
                </>
              )}
            </>
          ) : (
            <Pressable
              style={styles.resetButton}
              onPress={() => router.push('/monitoring-schedules/new')}
            >
              <Text style={styles.resetButtonText}>הגדר ניטור בוקר</Text>
            </Pressable>
          )}
        </View>

        {canResetToDefaults ? (
          <Pressable
            style={[styles.resetButton, (isLoading || isSaving) && styles.resetButtonDisabled]}
            onPress={handleResetToDefaultsPress}
            disabled={isLoading || isSaving}
          >
            <Text style={styles.resetButtonText}>חזרה לברירת מחדל</Text>
          </Pressable>
        ) : null}

        <Pressable
          style={[
            styles.saveButton,
            (isLoading || isSaving || !hasChanges) && styles.saveButtonDisabled,
          ]}
          onPress={handleSave}
          disabled={isLoading || isSaving || !hasChanges}
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
  resetButton: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#b6c7dd',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  resetButtonDisabled: {
    opacity: 0.55,
  },
  resetButtonText: {
    color: '#1e4f8a',
    fontSize: 15,
    fontWeight: '700',
  },
});
