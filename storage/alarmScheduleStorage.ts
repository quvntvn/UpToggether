import AsyncStorage from '@react-native-async-storage/async-storage';

import { DEFAULT_ALARM_SOUND_ID, type AlarmSoundId } from '@/constants/alarmSounds';
import { getNextUpcomingSchedule } from '@/services/alarmScheduler';
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
  nextScheduledTimestamp?: number;
  notificationId?: string;
};

function createScheduleId() {
  return `alarm-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function normalizeSchedule(raw: unknown, fallbackLabel = 'Alarm'): AlarmSchedule {
  const candidate = typeof raw === 'object' && raw !== null ? (raw as any) : {};

  // Migration logic from old 'days' object to new 'hour', 'minute', 'repeatDays' structure
  let hour = typeof candidate.hour === 'number' ? candidate.hour : 7;
  let minute = typeof candidate.minute === 'number' ? candidate.minute : 0;
  let repeatDays: WeekdayKey[] = Array.isArray(candidate.repeatDays) ? candidate.repeatDays : [];

  if (!Array.isArray(candidate.repeatDays) && candidate.days && typeof candidate.days === 'object') {
    // Old format detected
    const oldDays = candidate.days;
    const oldKeys: Record<string, number> = {
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
      sunday: 0,
    };

    const enabledDays: WeekdayKey[] = [];
    let firstFound = false;

    for (const [key, val] of Object.entries(oldKeys)) {
      const config = oldDays[key];
      if (config && typeof config === 'object') {
        if (!firstFound) {
          hour = typeof config.hour === 'number' ? config.hour : hour;
          minute = typeof config.minute === 'number' ? config.minute : minute;
          firstFound = true;
        }
        if (config.enabled) {
          enabledDays.push(val as WeekdayKey);
        }
      }
    }
    repeatDays = enabledDays;
  }

  // Ensure default repeatDays if empty and not explicitly a one-time alarm
  if (repeatDays.length === 0 && !candidate.isOneTime && !candidate.days) {
     repeatDays = [1, 2, 3, 4, 5]; // Default to weekdays
  }

  const createdAt = typeof candidate.createdAt === 'string' ? candidate.createdAt : nowIso();
  const updatedAt = typeof candidate.updatedAt === 'string' ? candidate.updatedAt : createdAt;

  return {
    id: typeof candidate.id === 'string' && candidate.id.trim() ? candidate.id : createScheduleId(),
    label: typeof candidate.label === 'string' && candidate.label.trim() ? candidate.label.trim() : fallbackLabel,
    enabled: typeof candidate.enabled === 'boolean' ? candidate.enabled : true,
    skipNextOccurrence: Boolean(candidate.skipNextOccurrence),
    isOneTime: typeof candidate.isOneTime === 'boolean' ? candidate.isOneTime : false,
    soundId: candidate.soundId ?? DEFAULT_ALARM_SOUND_ID,
    hour,
    minute,
    repeatDays,
    createdAt,
    updatedAt,
    nextScheduledTimestamp:
      typeof candidate.nextScheduledTimestamp === 'number' ? candidate.nextScheduledTimestamp : null,
    notificationId: typeof candidate.notificationId === 'string' ? candidate.notificationId : undefined,
  };
}

function migrateLegacyAlarm(raw: unknown): AlarmSchedule {
  const legacy = (raw && typeof raw === 'object' ? raw : {}) as LegacyAlarmShape;
  const hour = Number.isInteger(legacy.hour) ? Number(legacy.hour) : 7;
  const minute = Number.isInteger(legacy.minute) ? Number(legacy.minute) : 0;
  const base = createAlarmScheduleInput(legacy.label ?? 'Work');

  return {
    ...base,
    enabled: typeof legacy.enabled === 'boolean' ? legacy.enabled : true,
    soundId: legacy.soundId ?? DEFAULT_ALARM_SOUND_ID,
    hour,
    minute,
    repeatDays: [1, 2, 3, 4, 5],
    nextScheduledTimestamp:
      typeof legacy.nextScheduledTimestamp === 'number' ? legacy.nextScheduledTimestamp : null,
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
    isOneTime: false,
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
  } catch (e) {
    console.error('Migration failed', e);
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
    return parsed.map((item, index) => normalizeSchedule(item, `Alarm ${index + 1}`));
  } catch (e) {
    console.error('Failed to parse alarm schedules', e);
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
    return normalizeSchedule({
      ...next,
      id: schedule.id,
      createdAt: schedule.createdAt,
      updatedAt: nowIso(),
    }, schedule.label);
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
  return updateAlarmSchedule(scheduleId, (schedule) => ({
    ...schedule,
    enabled: !schedule.enabled,
    skipNextOccurrence: !schedule.enabled ? schedule.skipNextOccurrence : false,
  }));
}

export async function skipNextAlarmOccurrence(scheduleId: string) {
  return updateAlarmSchedule(scheduleId, (schedule) => ({
    ...schedule,
    skipNextOccurrence: true,
  }));
}

export async function clearSkippedNextOccurrence(scheduleId: string) {
  return updateAlarmSchedule(scheduleId, (schedule) => ({
    ...schedule,
    skipNextOccurrence: false,
  }));
}

export async function getNextUpcomingStoredSchedule(fromDate = new Date()) {
  const schedules = await getAlarmSchedules();
  return getNextUpcomingSchedule(schedules, fromDate);
}

export async function replaceAlarmSchedule(updatedSchedule: AlarmSchedule) {
  return updateAlarmSchedule(updatedSchedule.id, () => updatedSchedule);
}
