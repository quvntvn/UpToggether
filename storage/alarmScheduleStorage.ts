import AsyncStorage from '@react-native-async-storage/async-storage';

import { DEFAULT_ALARM_SOUND_ID, type AlarmSoundId } from '@/constants/alarmSounds';
import { getNextUpcomingSchedule } from '@/services/alarmScheduler';
import {
  WEEKDAY_ORDER,
  type AlarmSchedule,
  type WeekdayKey,
  type WeeklyAlarmDays,
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

function buildDefaultDays(hour = 7, minute = 0): WeeklyAlarmDays {
  return {
    monday: { enabled: true, hour, minute },
    tuesday: { enabled: true, hour, minute },
    wednesday: { enabled: true, hour, minute },
    thursday: { enabled: true, hour, minute },
    friday: { enabled: true, hour, minute },
    saturday: { enabled: false, hour, minute },
    sunday: { enabled: false, hour, minute },
  };
}

function normalizeDay(source: unknown, fallback: { enabled: boolean; hour: number; minute: number }) {
  const candidate = typeof source === 'object' && source !== null ? (source as Partial<{ enabled: boolean; hour: number; minute: number }>) : {};
  return {
    enabled: typeof candidate.enabled === 'boolean' ? candidate.enabled : fallback.enabled,
    hour: Number.isInteger(candidate.hour) ? Number(candidate.hour) : fallback.hour,
    minute: Number.isInteger(candidate.minute) ? Number(candidate.minute) : fallback.minute,
  };
}

function normalizeSchedule(raw: unknown, fallbackLabel = 'Alarm'): AlarmSchedule {
  const fallbackDays = buildDefaultDays();
  const candidate = typeof raw === 'object' && raw !== null ? (raw as Partial<AlarmSchedule>) : {};

  const days = WEEKDAY_ORDER.reduce((acc, day) => {
    acc[day] = normalizeDay(candidate.days?.[day], fallbackDays[day]);
    return acc;
  }, {} as WeeklyAlarmDays);

  const createdAt = typeof candidate.createdAt === 'string' ? candidate.createdAt : nowIso();
  const updatedAt = typeof candidate.updatedAt === 'string' ? candidate.updatedAt : createdAt;

  return {
    id: typeof candidate.id === 'string' && candidate.id.trim() ? candidate.id : createScheduleId(),
    label: typeof candidate.label === 'string' && candidate.label.trim() ? candidate.label.trim() : fallbackLabel,
    enabled: typeof candidate.enabled === 'boolean' ? candidate.enabled : true,
    skipNextOccurrence: Boolean(candidate.skipNextOccurrence),
    soundId: candidate.soundId ?? DEFAULT_ALARM_SOUND_ID,
    days,
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
    days: buildDefaultDays(hour, minute),
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
    soundId: DEFAULT_ALARM_SOUND_ID,
    days: buildDefaultDays(),
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

  const migrated = migrateLegacyAlarm(JSON.parse(legacyValue));
  await AsyncStorage.setItem(ALARM_SCHEDULES_STORAGE_KEY, JSON.stringify([migrated]));
  await AsyncStorage.removeItem(LEGACY_ALARM_STORAGE_KEY);
}

export async function getAlarmSchedules(): Promise<AlarmSchedule[]> {
  await migrateIfNeeded();

  const value = await AsyncStorage.getItem(ALARM_SCHEDULES_STORAGE_KEY);
  if (!value) {
    return [];
  }

  const parsed = JSON.parse(value) as unknown;
  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed.map((item, index) => normalizeSchedule(item, `Alarm ${index + 1}`));
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
