// src\features\biofeedback\data\biofeedback-entry.repository.ts

import AsyncStorage from '@react-native-async-storage/async-storage';

import { deriveDateKey, deriveTimeOfDay } from '../lib/biofeedback-date.utils';
import { BiofeedbackEntry } from '../types/biofeedback-entry.types';
import { CreateBiofeedbackEntryInput } from '../forms/biofeedback-entry-form.mapper';

const STORAGE_KEY = 'biofeedback_entries';

function createId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function listBiofeedbackEntries(): Promise<BiofeedbackEntry[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return [];
  }

  const parsed = JSON.parse(raw) as BiofeedbackEntry[];

  return parsed.sort((a, b) => b.measuredAt.localeCompare(a.measuredAt));
}

export async function getBiofeedbackEntryById(
  entryId: string,
): Promise<BiofeedbackEntry | null> {
  const entries = await listBiofeedbackEntries();
  return entries.find((entry) => entry.id === entryId) ?? null;
}

export async function createBiofeedbackEntry(
  input: CreateBiofeedbackEntryInput,
): Promise<BiofeedbackEntry> {
  const nowIso = new Date().toISOString();

  const entry: BiofeedbackEntry = {
    id: createId(),
    measuredAt: input.measuredAt,
    dateKey: deriveDateKey(input.measuredAt),
    timeOfDay: deriveTimeOfDay(input.measuredAt),
    exerciseName: input.exerciseName,
    durationMinutes: input.durationMinutes ?? 8,
    hrvDistribution: input.hrvDistribution,
    rlx: input.rlx,
    notes: input.notes ?? '',
    rawSourceData: input.rawSourceData,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  const current = await listBiofeedbackEntries();
  const next = [entry, ...current];

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));

  return entry;
}

export async function updateBiofeedbackEntry(
  entryId: string,
  input: CreateBiofeedbackEntryInput,
): Promise<BiofeedbackEntry> {
  const current = await listBiofeedbackEntries();
  const existing = current.find((entry) => entry.id === entryId);

  if (!existing) {
    throw new Error('Entry not found');
  }

  const updatedEntry: BiofeedbackEntry = {
    ...existing,
    measuredAt: input.measuredAt,
    dateKey: deriveDateKey(input.measuredAt),
    timeOfDay: deriveTimeOfDay(input.measuredAt),
    exerciseName: input.exerciseName,
    durationMinutes: input.durationMinutes ?? 8,
    hrvDistribution: input.hrvDistribution,
    rlx: input.rlx,
    notes: input.notes ?? '',
    rawSourceData: input.rawSourceData,
    updatedAt: new Date().toISOString(),
  };

  const next = current.map((entry) => (entry.id === entryId ? updatedEntry : entry));

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));

  return updatedEntry;
}

export async function deleteBiofeedbackEntry(entryId: string): Promise<void> {
  const current = await listBiofeedbackEntries();
  const next = current.filter((entry) => entry.id !== entryId);

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}