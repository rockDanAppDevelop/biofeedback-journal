//src\features\biofeedback\data\biofeedback-entry.export.ts

import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import { listAllBiofeedbackEntriesFromFirestore } from './firebase-biofeedback-read-repository';
import { BiofeedbackEntry } from '../types/biofeedback-entry.types';

function createExportFileName(suffix: string) {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `biofeedback-journal-export-${suffix}-${year}-${month}-${day}.json`;
}

async function shareEntriesAsJson(entries: BiofeedbackEntry[], suffix: string): Promise<void> {
  const payload = {
    exportedAt: new Date().toISOString(),
    totalEntries: entries.length,
    entries,
  };

  const json = JSON.stringify(payload, null, 2);
  const fileName = createExportFileName(suffix);

  if (Platform.OS === 'web') {
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = fileName;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);

    URL.revokeObjectURL(url);
    return;
  }

  const file = new File(Paths.cache, fileName);
  file.write(json);

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error('Sharing is not available on this device');
  }

  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    dialogTitle: 'ייצוא נתוני Biofeedback',
  });
}

export async function exportAllBiofeedbackEntriesAsJson(): Promise<void> {
  const entries = await listAllBiofeedbackEntriesFromFirestore();
  await shareEntriesAsJson(entries, 'all');
}

export async function exportCurrentMonthBiofeedbackEntriesAsJson(): Promise<void> {
  const entries = await listAllBiofeedbackEntriesFromFirestore();
  const now = new Date();

  const year = now.getFullYear();
  const month = now.getMonth();

  const filtered = entries.filter((entry) => {
    const date = new Date(entry.measuredAt);
    return date.getFullYear() === year && date.getMonth() === month;
  });

  await shareEntriesAsJson(filtered, 'current-month');
}

export async function exportMonthBiofeedbackEntriesAsJson(
  year: number,
  month: number,
): Promise<void> {
  const entries = await listAllBiofeedbackEntriesFromFirestore();

  const filtered = entries.filter((entry) => {
    const date = new Date(entry.measuredAt);
    return date.getFullYear() === year && date.getMonth() === month;
  });

  const monthLabel = `${year}-${String(month + 1).padStart(2, '0')}`;
  await shareEntriesAsJson(filtered, `month-${monthLabel}`);
}
