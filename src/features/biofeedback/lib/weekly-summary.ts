import { BiofeedbackEntry } from '../types/biofeedback-entry.types';

export type WeeklySummary = {
  weekStartDateKey: string;
  weekEndDateKey: string;
  daysWithEntries: number;
  totalEntries: number;
  totalDurationMinutes: number;
  totalRlxSessions: number;
  rlxImprovedCount: number;
  totalMinutesImproved: number;
  averageRelaxationPercent: number | null;
};

function addDaysToDateKey(dateKey: string, days: number): string {
  const date = new Date(`${dateKey}T00:00:00`);
  date.setDate(date.getDate() + days);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getDayOfWeekFromDateKey(dateKey: string): number {
  const date = new Date(`${dateKey}T00:00:00`);
  return date.getDay();
}

function hasRlxMetrics(entry: BiofeedbackEntry): boolean {
  return entry.rlx.startValue !== null && entry.rlx.endValue !== null;
}

function hasHrvRelaxationPercent(entry: BiofeedbackEntry): boolean {
  return entry.hrvDistribution.relaxationPercent !== null;
}

export function getWeeklySummary(
  entries: BiofeedbackEntry[],
  todayDateKey: string,
): WeeklySummary {
  const dayOfWeek = getDayOfWeekFromDateKey(todayDateKey);
  const weekStartDateKey = addDaysToDateKey(todayDateKey, -dayOfWeek);
  const weekEndDateKey = addDaysToDateKey(weekStartDateKey, 6);
  const weeklyEntries = entries.filter(
    (entry) => entry.dateKey >= weekStartDateKey && entry.dateKey <= weekEndDateKey,
  );

  const daysWithEntries = new Set(weeklyEntries.map((entry) => entry.dateKey)).size;
  const totalDurationMinutes = weeklyEntries.reduce(
    (sum, entry) => sum + entry.durationMinutes,
    0,
  );

  const rlxEntries = weeklyEntries.filter(hasRlxMetrics);
  const improvedRlxEntries = rlxEntries.filter(
    (entry) => entry.rlx.endValue! < entry.rlx.startValue!,
  );

  const hrvEntries = weeklyEntries.filter(hasHrvRelaxationPercent);
  const totalRelaxationPercent = hrvEntries.reduce(
    (sum, entry) => sum + entry.hrvDistribution.relaxationPercent!,
    0,
  );

  return {
    weekStartDateKey,
    weekEndDateKey,
    daysWithEntries,
    totalEntries: weeklyEntries.length,
    totalDurationMinutes,
    totalRlxSessions: rlxEntries.length,
    rlxImprovedCount: improvedRlxEntries.length,
    totalMinutesImproved: improvedRlxEntries.reduce(
      (sum, entry) => sum + entry.durationMinutes,
      0,
    ),
    averageRelaxationPercent:
      hrvEntries.length > 0 ? totalRelaxationPercent / hrvEntries.length : null,
  };
}
