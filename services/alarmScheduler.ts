import { formatAlarmTime } from '@/services/alarmTime';
import { WEEKDAY_ORDER, type AlarmSchedule, type NextUpcomingSchedule, type WeekdayKey } from '@/types/alarmSchedule';

const LOOKAHEAD_DAYS = 15;
const JS_DAY_TO_WEEKDAY_KEY: WeekdayKey[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

type AlarmOccurrence = NextUpcomingSchedule['occurrence'];

type AlarmOccurrenceOptions = {
  ignoreSkipNext?: boolean;
  limit?: number;
};

type NextTriggerOptions = {
  ignoreSkipNext?: boolean;
};

function jsDayToWeekdayKey(day: number): WeekdayKey {
  return JS_DAY_TO_WEEKDAY_KEY[day] ?? 'sunday';
}

function buildCandidateDate(baseDate: Date, hour: number, minute: number) {
  const candidate = new Date(baseDate);
  candidate.setHours(hour, minute, 0, 0);
  return candidate;
}

function parseOneTimeDate(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed : null;
}

function clearSkipState(schedule: AlarmSchedule): AlarmSchedule {
  if (!schedule.skipNextOccurrence && schedule.skipNextTimestamp === null) {
    return schedule;
  }

  return {
    ...schedule,
    skipNextOccurrence: false,
    skipNextTimestamp: null,
  };
}

function getCandidateOccurrences(
  schedule: AlarmSchedule,
  fromDate = new Date(),
  options: AlarmOccurrenceOptions = {},
): AlarmOccurrence[] {
  if (!schedule.enabled) {
    return [];
  }

  const limit = options.limit ?? 1;
  const skipTimestamp =
    !options.ignoreSkipNext && schedule.skipNextOccurrence ? schedule.skipNextTimestamp : null;
  const oneTimeDate = parseOneTimeDate(schedule.oneTimeDate);

  if (oneTimeDate) {
    if (oneTimeDate.getTime() <= fromDate.getTime()) {
      return [];
    }

    if (skipTimestamp !== null && oneTimeDate.getTime() === skipTimestamp) {
      return [];
    }

    return [
      {
        date: oneTimeDate,
        day: jsDayToWeekdayKey(oneTimeDate.getDay()),
        formattedTime: formatAlarmTime(oneTimeDate.getHours(), oneTimeDate.getMinutes()),
      },
    ];
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

    if (skipTimestamp !== null && candidate.getTime() === skipTimestamp) {
      continue;
    }

    occurrences.push({
      date: candidate,
      day: weekday,
      formattedTime: formatAlarmTime(config.hour, config.minute),
    });

    if (occurrences.length >= limit) {
      break;
    }
  }

  return occurrences;
}

export function isOneTimeAlarm(schedule: AlarmSchedule) {
  return parseOneTimeDate(schedule.oneTimeDate) !== null;
}

export function normalizeAlarmSchedulingState(
  schedule: AlarmSchedule,
  fromDate = new Date(),
): AlarmSchedule {
  if (!schedule.enabled) {
    return clearSkipState(schedule);
  }

  const oneTimeDate = parseOneTimeDate(schedule.oneTimeDate);

  if (schedule.oneTimeDate && !oneTimeDate) {
    return {
      ...clearSkipState(schedule),
      oneTimeDate: null,
    };
  }

  if (oneTimeDate && oneTimeDate.getTime() <= fromDate.getTime()) {
    return {
      ...clearSkipState(schedule),
      enabled: false,
    };
  }

  if (!schedule.skipNextOccurrence) {
    if (schedule.skipNextTimestamp === null) {
      return schedule;
    }

    return {
      ...schedule,
      skipNextTimestamp: null,
    };
  }

  if (schedule.skipNextTimestamp !== null) {
    if (schedule.skipNextTimestamp > fromDate.getTime()) {
      return schedule;
    }

    return clearSkipState(schedule);
  }

  const nextTriggerWithoutSkip = getNextTriggerDate(schedule, fromDate, {
    ignoreSkipNext: true,
  });

  if (!nextTriggerWithoutSkip) {
    return clearSkipState(schedule);
  }

  return {
    ...schedule,
    skipNextTimestamp: nextTriggerWithoutSkip.getTime(),
  };
}

export function getNextTriggerDate(
  schedule: AlarmSchedule,
  fromDate = new Date(),
  options: NextTriggerOptions = {},
) {
  const scheduleForLookup = options.ignoreSkipNext
    ? schedule
    : normalizeAlarmSchedulingState(schedule, fromDate);
  const nextOccurrence = getCandidateOccurrences(scheduleForLookup, fromDate, {
    ignoreSkipNext: options.ignoreSkipNext,
    limit: 1,
  })[0];

  return nextOccurrence?.date ?? null;
}

export function getNextAlarmOccurrenceRespectingSkip(
  schedule: AlarmSchedule,
  fromDate = new Date(),
): AlarmOccurrence | null {
  const normalizedSchedule = normalizeAlarmSchedulingState(schedule, fromDate);
  return getCandidateOccurrences(normalizedSchedule, fromDate, { limit: 1 })[0] ?? null;
}

export function getNextUpcomingSchedule(
  schedules: AlarmSchedule[],
  fromDate = new Date(),
): NextUpcomingSchedule | null {
  const candidates = schedules
    .map((schedule) => {
      const normalizedSchedule = normalizeAlarmSchedulingState(schedule, fromDate);
      const occurrence = getCandidateOccurrences(normalizedSchedule, fromDate, { limit: 1 })[0];

      if (!occurrence) {
        return null;
      }

      return {
        schedule: normalizedSchedule,
        occurrence,
      };
    })
    .filter((item): item is NextUpcomingSchedule => Boolean(item));

  if (candidates.length === 0) {
    return null;
  }

  candidates.sort((a, b) => a.occurrence.date.getTime() - b.occurrence.date.getTime());
  return candidates[0] ?? null;
}

export function getEnabledDaysSummary(schedule: AlarmSchedule) {
  if (isOneTimeAlarm(schedule)) {
    return [];
  }

  return WEEKDAY_ORDER.filter((day) => schedule.days[day].enabled);
}
