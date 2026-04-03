//src\features\biofeedback\data\biofeedback-entry.export.ts

import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { listBiofeedbackEntries } from './biofeedback-entry.repository';

function createExportFileName() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');

  return `biofeedback-entries-${year}-${month}-${day}-${hours}-${minutes}.json`;
}

export async function exportBiofeedbackEntriesAsJson(): Promise<void> {
  const entries = await listBiofeedbackEntries();

  const payload = {
    exportedAt: new Date().toISOString(),
    totalEntries: entries.length,
    entries,
  };

  const json = JSON.stringify(payload, null, 2);

  const file = new File(Paths.cache, createExportFileName());
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