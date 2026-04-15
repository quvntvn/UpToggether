import { formatAlarmTime } from '@/services/alarm';
import { WEEKDAY_ORDER, type AlarmSchedule, type NextUpcomingSchedule, type WeekdayKey } from '@/types/alarmSchedule';

const LOOKAHEAD_DAYS = 14;

type AlarmOccurrence = NextUpcomingSchedule['occurrence'];

function jsDayToWeekdayKey(day: number): WeekdayKey {
  // In JS, 0 is Sunday, 1 is Monday, etc.
  // Our WeekdayKey is already 0-6 mapping to Sunday-Saturday.
  return day as WeekdayKey;
}

function buildCandidateDate(baseDate: Date, hour: number, minute: number) {
  const candidate = new Date(baseDate);
  candidate.setHours(hour, minute, 0, 0);
  return candidate;
}

function findCandidateOccurrences(schedule: AlarmSchedule, fromDate = new Date()): AlarmOccurrence[] {
  if (!schedule.enabled) {
    return [];
  }

  const occurrences: AlarmOccurrence[] = [];

  for (let offset = 0; offset < LOOKAHEAD_DAYS; offset += 1) {
    const base = new Date(fromDate);
    base.setDate(fromDate.getDate() + offset);

    const weekday = jsDayToWeekdayKey(base.getDay());

    // Check if this weekday is in repeatDays
    const isRepeatDay = schedule.repeatDays.includes(weekday);

    // If it's a one-time alarm, it only fires on the first possible day (usually today or tomorrow)
    // if repeatDays is empty, or if specifically matched.
    // For simplicity, if one-time and no repeatDays, we allow any day until it fires.
    if (!schedule.isOneTime && !isRepeatDay) {
      continue;
    }

    if (schedule.isOneTime && schedule.repeatDays.length > 0 && !isRepeatDay) {
        continue;
    }

    const candidate = buildCandidateDate(base, schedule.hour, schedule.minute);

    if (candidate.getTime() <= fromDate.getTime()) {
      continue;
    }

    occurrences.push({
      date: candidate,
      day: weekday,
      formattedTime: formatAlarmTime(schedule.hour, schedule.minute),
    });

    if (occurrences.length >= 2) {
      break;
    }

    if (schedule.isOneTime) {
      break;
    }
  }

  return occurrences;
}

export function getNextAlarmOccurrenceRespectingSkip(
  schedule: AlarmSchedule,
  fromDate = new Date(),
): AlarmOccurrence | null {
  const occurrences = findCandidateOccurrences(schedule, fromDate);

  if (occurrences.length === 0) {
    return null;
  }

  if (schedule.isOneTime) {
    // For one-time alarms, if skipNextOccurrence is true, it won't fire at all
    return schedule.skipNextOccurrence ? null : occurrences[0];
  }

  if (!schedule.skipNextOccurrence) {
    return occurrences[0] ?? null;
  }

  // For repeating alarms, skipNextOccurrence returns the second occurrence
  return occurrences[1] ?? null;
}

/**
 * Robust engine to get the next trigger date for an alarm.
 * Handles repeat days, skipNext, past time today, and one-time alarms.
 */
export function getNextTriggerDate(alarm: AlarmSchedule, fromDate = new Date()): Date | null {
  const occurrence = getNextAlarmOccurrenceRespectingSkip(alarm, fromDate);
  return occurrence?.date ?? null;
}

export function getNextUpcomingSchedule(
  schedules: AlarmSchedule[],
  fromDate = new Date(),
): NextUpcomingSchedule | null {
  const candidates = schedules
    .map((schedule) => {
      const occurrence = getNextAlarmOccurrenceRespectingSkip(schedule, fromDate);
      if (!occurrence) {
        return null;
      }
      return { schedule, occurrence };
    })
    .filter((item): item is NextUpcomingSchedule => Boolean(item));

  if (candidates.length === 0) {
    return null;
  }

  candidates.sort((a, b) => a.occurrence.date.getTime() - b.occurrence.date.getTime());
  return candidates[0] ?? null;
}

export function getEnabledDaysSummary(schedule: AlarmSchedule) {
  return [...schedule.repeatDays].sort((a, b) => {
      // Sort according to WEEKDAY_ORDER [1,2,3,4,5,6,0]
      const order = [1, 2, 3, 4, 5, 6, 0];
      return order.indexOf(a) - order.indexOf(b);
  });
}
