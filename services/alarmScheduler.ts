import { formatAlarmTime } from '@/services/alarm';
import { WEEKDAY_ORDER, type AlarmSchedule, type NextUpcomingSchedule, type WeekdayKey } from '@/types/alarmSchedule';

const LOOKAHEAD_DAYS = 14;

type AlarmOccurrence = NextUpcomingSchedule['occurrence'];

function jsDayToWeekdayKey(day: number): WeekdayKey {
  const map: WeekdayKey[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return map[day];
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

export function getNextAlarmOccurrenceRespectingSkip(
  schedule: AlarmSchedule,
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
  return WEEKDAY_ORDER.filter((day) => schedule.days[day].enabled);
}
