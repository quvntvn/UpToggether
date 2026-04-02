import { formatAlarmTime } from '@/services/alarm';
import { WEEKDAY_ORDER, type WeekdayKey, type WeeklyAlarmSchedule } from '@/types/alarmSchedule';

const LOOKAHEAD_DAYS = 14;

export type AlarmOccurrence = {
  date: Date;
  day: WeekdayKey;
  formattedTime: string;
};

function jsDayToWeekdayKey(day: number): WeekdayKey {
  const map: WeekdayKey[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return map[day];
}

function buildCandidateDate(baseDate: Date, hour: number, minute: number) {
  const candidate = new Date(baseDate);
  candidate.setHours(hour, minute, 0, 0);
  return candidate;
}

function findCandidateOccurrences(schedule: WeeklyAlarmSchedule, fromDate = new Date()): AlarmOccurrence[] {
  if (!schedule.enabled) {
    return [];
  }

  const occurrences: AlarmOccurrence[] = [];

  for (let offset = 0; offset < LOOKAHEAD_DAYS; offset += 1) {
    const base = new Date(fromDate);
    base.setDate(fromDate.getDate() + offset);

    const weekday = jsDayToWeekdayKey(base.getDay());
    const config = schedule.days[weekday];

    if (!config.enabled) {
      continue;
    }

    const candidate = buildCandidateDate(base, config.hour, config.minute);

    if (candidate.getTime() <= fromDate.getTime()) {
      continue;
    }

    occurrences.push({
      date: candidate,
      day: weekday,
      formattedTime: formatAlarmTime(config.hour, config.minute),
    });

    if (occurrences.length >= 2) {
      break;
    }
  }

  return occurrences;
}

export function getNextAlarmOccurrence(schedule: WeeklyAlarmSchedule, fromDate = new Date()): AlarmOccurrence | null {
  const occurrences = findCandidateOccurrences(
    {
      ...schedule,
      skipNextOccurrence: false,
    },
    fromDate,
  );

  return occurrences[0] ?? null;
}

export function getNextAlarmOccurrenceRespectingSkip(
  schedule: WeeklyAlarmSchedule,
  fromDate = new Date(),
): AlarmOccurrence | null {
  const occurrences = findCandidateOccurrences(schedule, fromDate);

  if (occurrences.length === 0) {
    return null;
  }

  if (!schedule.skipNextOccurrence) {
    return occurrences[0] ?? null;
  }

  return occurrences[1] ?? null;
}

export function getEnabledDaysSummary(schedule: WeeklyAlarmSchedule) {
  return WEEKDAY_ORDER.filter((day) => schedule.days[day].enabled);
}
