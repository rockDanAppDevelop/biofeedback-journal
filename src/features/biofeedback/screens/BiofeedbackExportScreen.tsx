//src\features\biofeedback\screens\BiofeedbackExportScreen.tsx

import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  exportAllBiofeedbackEntriesAsJson,
  exportCurrentMonthBiofeedbackEntriesAsJson,
  exportMonthBiofeedbackEntriesAsJson,
} from '../data/biofeedback-entry.export';
import { listAllBiofeedbackEntriesFromFirestore } from '../data/firebase-biofeedback-read-repository';

type MonthOption = {
  label: string;
  year: number;
  month: number;
};

function buildMonthOptionsFromEntries(
  entries: { measuredAt: string }[],
): MonthOption[] {
  const uniqueMonths = new Map<string, MonthOption>();

  for (const entry of entries) {
    const date = new Date(entry.measuredAt);
    const year = date.getFullYear();
    const month = date.getMonth();
    const key = `${year}-${month}`;

    if (!uniqueMonths.has(key)) {
      uniqueMonths.set(key, {
        label: new Intl.DateTimeFormat('he-IL', {
          month: 'long',
          year: 'numeric',
        }).format(new Date(year, month, 1)),
        year,
        month,
      });
    }
  }

  return Array.from(uniqueMonths.values()).sort((a, b) => {
    if (a.year !== b.year) {
      return b.year - a.year;
    }

    return b.month - a.month;
  });
}

export default function BiofeedbackExportScreen() {
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(0);
  const [monthOptions, setMonthOptions] = useState<MonthOption[]>([]);

  useEffect(() => {
    loadMonthOptions();
  }, []);

  async function loadMonthOptions() {
    const entries = await listAllBiofeedbackEntriesFromFirestore();
    const options = buildMonthOptionsFromEntries(entries);
    setMonthOptions(options);
    setSelectedMonthIndex(0);
  }

  async function handleExportAll() {
    try {
      await exportAllBiofeedbackEntriesAsJson();
    } catch {
      Alert.alert('שגיאה', 'ייצוא כל הנתונים נכשל.');
    }
  }

  async function handleExportCurrentMonth() {
    try {
      await exportCurrentMonthBiofeedbackEntriesAsJson();
    } catch {
      Alert.alert('שגיאה', 'ייצוא החודש הנוכחי נכשל.');
    }
  }

  async function handleExportSelectedMonth() {
    try {
      const selected = monthOptions[selectedMonthIndex];

      if (!selected) {
        Alert.alert('אין חודשים זמינים', 'אין עדיין חודשים עם נתונים לייצוא.');
        return;
      }

      await exportMonthBiofeedbackEntriesAsJson(selected.year, selected.month);
    } catch {
      Alert.alert('שגיאה', 'ייצוא החודש שנבחר נכשל.');
    }
  }

  const hasMonthOptions = useMemo(() => monthOptions.length > 0, [monthOptions]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>ייצוא נתונים</Text>
        <Text style={styles.subtitle}>בחר איך לייצא את הנתונים שלך</Text>

        <Pressable style={styles.primaryButton} onPress={handleExportAll}>
          <Text style={styles.primaryButtonText}>ייצוא כל הנתונים (JSON)</Text>
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={handleExportCurrentMonth}>
          <Text style={styles.secondaryButtonText}>ייצוא החודש הנוכחי (JSON)</Text>
        </Pressable>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>בחירת חודש ושנה</Text>

          {hasMonthOptions ? (
            <>
              <ScrollView style={styles.monthList} contentContainerStyle={styles.monthListContent}>
                {monthOptions.map((option, index) => {
                  const isSelected = index === selectedMonthIndex;

                  return (
                    <Pressable
                      key={`${option.year}-${option.month}`}
                      style={[styles.monthOption, isSelected && styles.monthOptionSelected]}
                      onPress={() => setSelectedMonthIndex(index)}
                    >
                      <Text
                        style={[
                          styles.monthOptionText,
                          isSelected && styles.monthOptionTextSelected,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <Pressable style={styles.primaryButton} onPress={handleExportSelectedMonth}>
                <Text style={styles.primaryButtonText}>ייצוא החודש שנבחר (JSON)</Text>
              </Pressable>
            </>
          ) : (
            <Text style={styles.emptyText}>אין עדיין חודשים עם נתונים.</Text>
          )}
        </View>

        <Pressable style={styles.cancelButton} onPress={() => router.back()}>
          <Text style={styles.cancelButtonText}>חזרה</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 20,
  },
  section: {
    marginTop: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e1e1e1',
    borderRadius: 14,
    backgroundColor: '#fafafa',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  monthList: {
    maxHeight: 320,
    marginBottom: 16,
  },
  monthListContent: {
    gap: 8,
  },
  monthOption: {
    borderWidth: 1,
    borderColor: '#d7d7d7',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#ffffff',
  },
  monthOptionSelected: {
    backgroundColor: '#e8f0fb',
    borderColor: '#1e88e5',
  },
  monthOptionText: {
    fontSize: 15,
    color: '#222222',
  },
  monthOptionTextSelected: {
    color: '#0d47a1',
    fontWeight: '700',
  },
  primaryButton: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#1e88e5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#f3f6fb',
    borderWidth: 1,
    borderColor: '#d7e3f4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  secondaryButtonText: {
    color: '#1e4f8a',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 15,
    color: '#666666',
    marginBottom: 8,
  },
  cancelButton: {
    marginTop: 20,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#eeeeee',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: '#333333',
    fontSize: 16,
    fontWeight: '600',
  },
});
