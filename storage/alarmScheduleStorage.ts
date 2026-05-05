import AsyncStorage from '@react-native-async-storage/async-storage';

import { DEFAULT_ALARM_SOUND_ID, type AlarmSoundId } from '@/constants/alarmSounds';
import { getNextTriggerDate, getNextUpcomingSchedule, normalizeAlarmSchedulingState } from '@/services/alarmScheduler';
import {
  WEEKDAY_ORDER,
  type AlarmSchedule,
  type WeekdayKey,
} from '@/types/alarmSchedule';

const ALARM_SCHEDULES_STORAGE_KEY = 'uptogether.alarmSchedules';
const LEGACY_ALARM_STORAGE_KEY = 'uptogether.alarm';

type LegacyAlarmShape = {
  hour?: number;
  minute?: number;
  enabled?: boolean;
  label?: string;
  soundId?: AlarmSoundId;
  skipNextOccurrence?: boolean;
  skipNextTimestamp?: number;
  isOneTime?: boolean;
  oneTimeDate?: string;
  repeatDays?: number[];
  nextScheduledTimestamp?: number;
  notificationId?: string;
};

function createScheduleId() {
  return `alarm-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function isWeekdayKey(value: unknown): value is WeekdayKey {
  return typeof value === 'number' && WEEKDAY_ORDER.includes(value as WeekdayKey);
}

function normalizeRepeatDays(raw: unknown) {
  if (!Array.isArray(raw)) {
    return [] as WeekdayKey[];
  }

  const unique = new Set<WeekdayKey>();

  for (const value of raw) {
    if (isWeekdayKey(value)) {
      unique.add(value);
    }
  }

  return WEEKDAY_ORDER.filter((day) => unique.has(day));
}

function parseOneTimeDate(value: unknown) {
  if (typeof value !== 'string') {
    return null;
  }

  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed.toISOString() : null;
}

function normalizeSchedule(raw: unknown, fallbackLabel = 'Alarm'): AlarmSchedule {
  const candidate = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const isOneTime = typeof candidate.isOneTime === 'boolean' ? candidate.isOneTime : false;
  const hasExplicitRepeatDays = Array.isArray(candidate.repeatDays);

  let hour = Number.isInteger(candidate.hour) ? clampNumber(Number(candidate.hour), 0, 23) : 7;
  let minute = Number.isInteger(candidate.minute) ? clampNumber(Number(candidate.minute), 0, 59) : 0;
  let repeatDays = hasExplicitRepeatDays ? normalizeRepeatDays(candidate.repeatDays) : [];

  if (!hasExplicitRepeatDays && candidate.days && typeof candidate.days === 'object') {
    const oldDays = candidate.days as Record<string, unknown>;
    const oldKeys: Array<[string, WeekdayKey]> = [
      ['monday', 1],
      ['tuesday', 2],
      ['wednesday', 3],
      ['thursday', 4],
      ['friday', 5],
      ['saturday', 6],
      ['sunday', 0],
    ];

    const enabledDays: WeekdayKey[] = [];
    let firstFound = false;

    for (const [key, weekday] of oldKeys) {
      const config = oldDays[key];

      if (!config || typeof config !== 'object') {
        continue;
      }

      const dayConfig = config as Partial<{ enabled: boolean; hour: number; minute: number }>;

      if (!firstFound) {
        hour = Number.isInteger(dayConfig.hour) ? clampNumber(Number(dayConfig.hour), 0, 23) : hour;
        minute = Number.isInteger(dayConfig.minute) ? clampNumber(Number(dayConfig.minute), 0, 59) : minute;
        firstFound = true;
      }

      if (dayConfig.enabled) {
        enabledDays.push(weekday);
      }
    }

    repeatDays = enabledDays;
  }

  if (!hasExplicitRepeatDays && !isOneTime && !candidate.days) {
    repeatDays = [1, 2, 3, 4, 5];
  }

  const createdAt = typeof candidate.createdAt === 'string' ? candidate.createdAt : nowIso();
  const updatedAt = typeof candidate.updatedAt === 'string' ? candidate.updatedAt : createdAt;

  return {
    id: typeof candidate.id === 'string' && candidate.id.trim() ? candidate.id : createScheduleId(),
    label: typeof candidate.label === 'string' && candidate.label.trim() ? candidate.label.trim() : fallbackLabel,
    enabled: typeof candidate.enabled === 'boolean' ? candidate.enabled : true,
    skipNextOccurrence: Boolean(candidate.skipNextOccurrence),
    skipNextTimestamp:
      typeof candidate.skipNextTimestamp === 'number' && Number.isFinite(candidate.skipNextTimestamp)
        ? candidate.skipNextTimestamp
        : null,
    isOneTime,
    oneTimeDate: isOneTime ? parseOneTimeDate(candidate.oneTimeDate) : null,
    soundId: (candidate.soundId as AlarmSoundId | undefined) ?? DEFAULT_ALARM_SOUND_ID,
    hour,
    minute,
    repeatDays,
    createdAt,
    updatedAt,
    nextScheduledTimestamp:
      typeof candidate.nextScheduledTimestamp === 'number' && Number.isFinite(candidate.nextScheduledTimestamp)
        ? candidate.nextScheduledTimestamp
        : null,
    notificationId: typeof candidate.notificationId === 'string' ? candidate.notificationId : undefined,
  };
}

function migrateLegacyAlarm(raw: unknown): AlarmSchedule {
  const legacy = (raw && typeof raw === 'object' ? raw : {}) as LegacyAlarmShape;
  const hour = Number.isInteger(legacy.hour) ? clampNumber(Number(legacy.hour), 0, 23) : 7;
  const minute = Number.isInteger(legacy.minute) ? clampNumber(Number(legacy.minute), 0, 59) : 0;
  const base = createAlarmScheduleInput(legacy.label ?? 'Work');

  return {
    ...base,
    enabled: typeof legacy.enabled === 'boolean' ? legacy.enabled : true,
    skipNextOccurrence: Boolean(legacy.skipNextOccurrence),
    skipNextTimestamp:
      typeof legacy.skipNextTimestamp === 'number' && Number.isFinite(legacy.skipNextTimestamp)
        ? legacy.skipNextTimestamp
        : null,
    isOneTime: Boolean(legacy.isOneTime),
    oneTimeDate: parseOneTimeDate(legacy.oneTimeDate),
    soundId: legacy.soundId ?? DEFAULT_ALARM_SOUND_ID,
    hour,
    minute,
    repeatDays: normalizeRepeatDays(legacy.repeatDays).length > 0 ? normalizeRepeatDays(legacy.repeatDays) : [1, 2, 3, 4, 5],
    nextScheduledTimestamp:
      typeof legacy.nextScheduledTimestamp === 'number' && Number.isFinite(legacy.nextScheduledTimestamp)
        ? legacy.nextScheduledTimestamp
        : null,
    notificationId: legacy.notificationId,
  };
}

function createAlarmScheduleInput(label: string): AlarmSchedule {
  const timestamp = nowIso();
  return {
    id: createScheduleId(),
    label,
    enabled: true,
    skipNextOccurrence: false,
    skipNextTimestamp: null,
    isOneTime: false,
    oneTimeDate: null,
    soundId: DEFAULT_ALARM_SOUND_ID,
    hour: 7,
    minute: 0,
    repeatDays: [1, 2, 3, 4, 5],
    createdAt: timestamp,
    updatedAt: timestamp,
    nextScheduledTimestamp: null,
    notificationId: undefined,
  };
}

function didSchedulingStateChange(previous: AlarmSchedule, next: AlarmSchedule) {
  return (
    previous.enabled !== next.enabled ||
    previous.skipNextOccurrence !== next.skipNextOccurrence ||
    previous.skipNextTimestamp !== next.skipNextTimestamp ||
    previous.oneTimeDate !== next.oneTimeDate
  );
}

async function migrateIfNeeded() {
  const currentValue = await AsyncStorage.getItem(ALARM_SCHEDULES_STORAGE_KEY);
  if (currentValue) {
    return;
  }

  const legacyValue = await AsyncStorage.getItem(LEGACY_ALARM_STORAGE_KEY);
  if (!legacyValue) {
    return;
  }

  try {
    const migrated = migrateLegacyAlarm(JSON.parse(legacyValue));
    await AsyncStorage.setItem(ALARM_SCHEDULES_STORAGE_KEY, JSON.stringify([migrated]));
    await AsyncStorage.removeItem(LEGACY_ALARM_STORAGE_KEY);
  } catch (error) {
    console.error('Migration failed', error);
  }
}

export async function getAlarmSchedules(): Promise<AlarmSchedule[]> {
  await migrateIfNeeded();

  const value = await AsyncStorage.getItem(ALARM_SCHEDULES_STORAGE_KEY);
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    const normalizedSchedules = parsed.map((item, index) => normalizeSchedule(item, `Alarm ${index + 1}`));
    const stableSchedules = normalizedSchedules.map((schedule) => normalizeAlarmSchedulingState(schedule, new Date()));

    if (stableSchedules.some((schedule, index) => didSchedulingStateChange(normalizedSchedules[index]!, schedule))) {
      await saveAlarmSchedules(stableSchedules);
    }

    return stableSchedules;
  } catch (error) {
    console.error('Failed to parse alarm schedules', error);
    return [];
  }
}

export async function saveAlarmSchedules(schedules: AlarmSchedule[]) {
  const normalized = schedules.map((schedule, index) =>
    normalizeSchedule(schedule, `Alarm ${index + 1}`),
  );
  await AsyncStorage.setItem(ALARM_SCHEDULES_STORAGE_KEY, JSON.stringify(normalized));
}

export async function createAlarmSchedule(label = 'Work') {
  const schedules = await getAlarmSchedules();
  const created = createAlarmScheduleInput(label);
  const updated = [...schedules, created];
  await saveAlarmSchedules(updated);
  return created;
}

export async function updateAlarmSchedule(scheduleId: string, updater: (schedule: AlarmSchedule) => AlarmSchedule) {
  const schedules = await getAlarmSchedules();
  const updated = schedules.map((schedule) => {
    if (schedule.id !== scheduleId) {
      return schedule;
    }

    const next = updater(schedule);
    return normalizeSchedule(
      {
        ...next,
        id: schedule.id,
        createdAt: schedule.createdAt,
        updatedAt: nowIso(),
      },
      schedule.label,
    );
  });

  await saveAlarmSchedules(updated);
  return updated.find((schedule) => schedule.id === scheduleId) ?? null;
}

export async function deleteAlarmSchedule(scheduleId: string) {
  const schedules = await getAlarmSchedules();
  const updated = schedules.filter((schedule) => schedule.id !== scheduleId);
  await saveAlarmSchedules(updated);
  return updated;
}

export async function toggleAlarmScheduleEnabled(scheduleId: string) {
  return updateAlarmSchedule(scheduleId, (schedule) => {
    const nextEnabled = !schedule.enabled;

    return {
      ...schedule,
      enabled: nextEnabled,
      skipNextOccurrence: false,
      skipNextTimestamp: null,
      oneTimeDate: schedule.isOneTime ? null : schedule.oneTimeDate,
      nextScheduledTimestamp: null,
      notificationId: undefined,
    };
  });
}

export async function skipNextAlarmOccurrence(scheduleId: string) {
  return updateAlarmSchedule(scheduleId, (schedule) => {
    if (schedule.isOneTime) {
      return {
        ...schedule,
        enabled: false,
        skipNextOccurrence: false,
        skipNextTimestamp: null,
        oneTimeDate: null,
        nextScheduledTimestamp: null,
        notificationId: undefined,
      };
    }

    const nextTriggerDate = getNextTriggerDate(schedule, new Date(), { ignoreSkipNext: true });

    if (!nextTriggerDate) {
      return {
        ...schedule,
        skipNextOccurrence: false,
        skipNextTimestamp: null,
      };
    }

    return {
      ...schedule,
      skipNextOccurrence: true,
      skipNextTimestamp: nextTriggerDate.getTime(),
      nextScheduledTimestamp: null,
      notificationId: undefined,
    };
  });
}

export async function clearSkippedNextOccurrence(scheduleId: string) {
  return updateAlarmSchedule(scheduleId, (schedule) => ({
    ...schedule,
    skipNextOccurrence: false,
    skipNextTimestamp: null,
  }));
}

export async function getNextUpcomingStoredSchedule(fromDate = new Date()) {
  const schedules = await getAlarmSchedules();
  return getNextUpcomingSchedule(schedules, fromDate);
}

export async function replaceAlarmSchedule(updatedSchedule: AlarmSchedule) {
  return updateAlarmSchedule(updatedSchedule.id, () => updatedSchedule);
}
