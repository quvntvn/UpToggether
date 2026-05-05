import { formatAlarmTime } from '@/services/alarm';
import { WEEKDAY_ORDER, type AlarmSchedule, type NextUpcomingSchedule, type WeekdayKey } from '@/types/alarmSchedule';

const LOOKAHEAD_DAYS = 15;

type AlarmOccurrence = NextUpcomingSchedule['occurrence'];

type AlarmOccurrenceOptions = {
  ignoreSkipNext?: boolean;
  limit?: number;
};

type NextTriggerOptions = {
  ignoreSkipNext?: boolean;
};

function jsDayToWeekdayKey(day: number): WeekdayKey {
  return day as WeekdayKey;
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

function buildDerivedOneTimeDate(schedule: AlarmSchedule, fromDate: Date) {
  if (schedule.repeatDays.length === 0) {
    const candidate = buildCandidateDate(fromDate, schedule.hour, schedule.minute);

    if (candidate.getTime() <= fromDate.getTime()) {
      candidate.setDate(candidate.getDate() + 1);
    }

    return candidate;
  }

  for (let offset = 0; offset < LOOKAHEAD_DAYS; offset += 1) {
    const base = new Date(fromDate);
    base.setDate(fromDate.getDate() + offset);

    const weekday = jsDayToWeekdayKey(base.getDay());

    if (!schedule.repeatDays.includes(weekday)) {
      continue;
    }

    const candidate = buildCandidateDate(base, schedule.hour, schedule.minute);

    if (candidate.getTime() <= fromDate.getTime()) {
      continue;
    }

    return candidate;
  }

  return null;
}

function resolveOneTimeDate(schedule: AlarmSchedule, fromDate: Date) {
  return parseOneTimeDate(schedule.oneTimeDate) ?? buildDerivedOneTimeDate(schedule, fromDate);
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

  if (schedule.isOneTime) {
    const oneTimeDate = resolveOneTimeDate(schedule, fromDate);

    if (!oneTimeDate || oneTimeDate.getTime() <= fromDate.getTime()) {
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

  if (schedule.repeatDays.length === 0) {
    return [];
  }

  const occurrences: AlarmOccurrence[] = [];

  for (let offset = 0; offset < LOOKAHEAD_DAYS; offset += 1) {
    const base = new Date(fromDate);
    base.setDate(fromDate.getDate() + offset);

    const weekday = jsDayToWeekdayKey(base.getDay());

    if (!schedule.repeatDays.includes(weekday)) {
      continue;
    }

    const candidate = buildCandidateDate(base, schedule.hour, schedule.minute);

    if (candidate.getTime() <= fromDate.getTime()) {
      continue;
    }

    if (skipTimestamp !== null && candidate.getTime() === skipTimestamp) {
      continue;
    }

    occurrences.push({
      date: candidate,
      day: weekday,
      formattedTime: formatAlarmTime(schedule.hour, schedule.minute),
    });

    if (occurrences.length >= limit) {
      break;
    }
  }

  return occurrences;
}

export function normalizeAlarmSchedulingState(
  schedule: AlarmSchedule,
  fromDate = new Date(),
): AlarmSchedule {
  let nextSchedule = schedule;

  if (!nextSchedule.enabled) {
    return clearSkipState(nextSchedule);
  }

  if (!nextSchedule.isOneTime && nextSchedule.oneTimeDate !== null) {
    nextSchedule = {
      ...nextSchedule,
      oneTimeDate: null,
    };
  }

  if (nextSchedule.isOneTime) {
    const oneTimeDate = resolveOneTimeDate(nextSchedule, fromDate);

    if (!oneTimeDate) {
      return {
        ...clearSkipState(nextSchedule),
        enabled: false,
        oneTimeDate: null,
      };
    }

    if (nextSchedule.oneTimeDate !== oneTimeDate.toISOString()) {
      nextSchedule = {
        ...nextSchedule,
        oneTimeDate: oneTimeDate.toISOString(),
      };
    }

    if (oneTimeDate.getTime() <= fromDate.getTime()) {
      return {
        ...clearSkipState(nextSchedule),
        enabled: false,
        oneTimeDate: null,
      };
    }
  }

  if (!nextSchedule.skipNextOccurrence) {
    if (nextSchedule.skipNextTimestamp === null) {
      return nextSchedule;
    }

    return {
      ...nextSchedule,
      skipNextTimestamp: null,
    };
  }

  if (nextSchedule.isOneTime) {
    return {
      ...nextSchedule,
      enabled: false,
      skipNextOccurrence: false,
      skipNextTimestamp: null,
      oneTimeDate: null,
    };
  }

  if (nextSchedule.skipNextTimestamp !== null) {
    if (nextSchedule.skipNextTimestamp > fromDate.getTime()) {
      return nextSchedule;
    }

    return clearSkipState(nextSchedule);
  }

  const nextTriggerWithoutSkip = getNextTriggerDate(nextSchedule, fromDate, {
    ignoreSkipNext: true,
  });

  if (!nextTriggerWithoutSkip) {
    return clearSkipState(nextSchedule);
  }

  return {
    ...nextSchedule,
    skipNextTimestamp: nextTriggerWithoutSkip.getTime(),
  };
}

export function getNextAlarmOccurrenceRespectingSkip(
  schedule: AlarmSchedule,
  fromDate = new Date(),
): AlarmOccurrence | null {
  const normalizedSchedule = normalizeAlarmSchedulingState(schedule, fromDate);
  return getCandidateOccurrences(normalizedSchedule, fromDate, { limit: 1 })[0] ?? null;
}

export function getNextTriggerDate(
  schedule: AlarmSchedule,
  fromDate = new Date(),
  options: NextTriggerOptions = {},
): Date | null {
  const scheduleForLookup = options.ignoreSkipNext
    ? schedule
    : normalizeAlarmSchedulingState(schedule, fromDate);
  const nextOccurrence = getCandidateOccurrences(scheduleForLookup, fromDate, {
    ignoreSkipNext: options.ignoreSkipNext,
    limit: 1,
  })[0];

  return nextOccurrence?.date ?? null;
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
  if (schedule.isOneTime && schedule.repeatDays.length === 0) {
    return [];
  }

  return WEEKDAY_ORDER.filter((day) => schedule.repeatDays.includes(day));
}
