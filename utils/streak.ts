import type { WakeResult } from '@/storage/wakeResultsStorage';
import { getDayKey } from '@/utils/date';

function getSuccessfulDayKeys(results: WakeResult[]) {
  return Array.from(
    new Set(results.filter((result) => result.success).map((result) => getDayKey(result.stoppedAt))),
  ).sort();
}

export function getCurrentStreak(results: WakeResult[]) {
  const successfulDayKeys = getSuccessfulDayKeys(results);

  if (successfulDayKeys.length === 0) {
    return 0;
  }

  const successfulDays = new Set(successfulDayKeys);
  const today = new Date();
  const todayKey = getDayKey(today);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const anchor = successfulDays.has(todayKey) ? today : yesterday;

  let streak = 0;
  const cursor = new Date(anchor);

  while (successfulDays.has(getDayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export function getBestStreak(results: WakeResult[]) {
  const successfulDayKeys = getSuccessfulDayKeys(results);

  if (successfulDayKeys.length === 0) {
    return 0;
  }

  let bestStreak = 1;
  let currentStreak = 1;

  for (let index = 1; index < successfulDayKeys.length; index += 1) {
    const previousDate = new Date(successfulDayKeys[index - 1]);
    const currentDate = new Date(successfulDayKeys[index]);
    const diffDays = Math.round((currentDate.getTime() - previousDate.getTime()) / 86400000);

    if (diffDays === 1) {
      currentStreak += 1;
      bestStreak = Math.max(bestStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }

  return bestStreak;
}
