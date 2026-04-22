type StreakInsight =
  | { kind: 'active'; streakCount: number }
  | { kind: 'keep-going'; streakCount: number }
  | { kind: 'restart'; lastStreakCount: number }
  | { kind: 'empty' };

const RESTART_RELEVANCE_DAYS = 3;

function addDaysToDateKey(dateKey: string, days: number): string {
  const date = new Date(`${dateKey}T00:00:00`);
  date.setDate(date.getDate() + days);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function countBackwardStreak(entryDateKeysSet: Set<string>, anchorDateKey: string): number {
  let streakCount = 0;
  let currentDateKey = anchorDateKey;

  while (entryDateKeysSet.has(currentDateKey)) {
    streakCount += 1;
    currentDateKey = addDaysToDateKey(currentDateKey, -1);
  }

  return streakCount;
}

function getDayDifference(laterDateKey: string, earlierDateKey: string): number {
  const laterDate = new Date(`${laterDateKey}T00:00:00`);
  const earlierDate = new Date(`${earlierDateKey}T00:00:00`);
  const millisecondsPerDay = 24 * 60 * 60 * 1000;

  return Math.round((laterDate.getTime() - earlierDate.getTime()) / millisecondsPerDay);
}

export function getStreakInsight(
  entryDateKeys: string[],
  todayDateKey: string,
): StreakInsight {
  const uniqueEntryDateKeys = Array.from(new Set(entryDateKeys));

  if (uniqueEntryDateKeys.length === 0) {
    return { kind: 'empty' };
  }

  const entryDateKeysSet = new Set(uniqueEntryDateKeys);

  if (entryDateKeysSet.has(todayDateKey)) {
    return {
      kind: 'active',
      streakCount: countBackwardStreak(entryDateKeysSet, todayDateKey),
    };
  }

  const yesterdayDateKey = addDaysToDateKey(todayDateKey, -1);
  const yesterdayStreakCount = countBackwardStreak(entryDateKeysSet, yesterdayDateKey);

  if (yesterdayStreakCount > 0) {
    return {
      kind: 'keep-going',
      streakCount: yesterdayStreakCount,
    };
  }

  const lastEntryDateKey = uniqueEntryDateKeys
    .filter((dateKey) => dateKey < todayDateKey)
    .sort()
    .at(-1);

  if (!lastEntryDateKey) {
    return { kind: 'empty' };
  }

  const daysSinceLastEntry = getDayDifference(todayDateKey, lastEntryDateKey);

  if (daysSinceLastEntry > RESTART_RELEVANCE_DAYS) {
    return { kind: 'empty' };
  }

  const lastStreakCount = countBackwardStreak(entryDateKeysSet, lastEntryDateKey);

  if (lastStreakCount === 0) {
    return { kind: 'empty' };
  }

  return {
    kind: 'restart',
    lastStreakCount,
  };
}

export type { StreakInsight };
