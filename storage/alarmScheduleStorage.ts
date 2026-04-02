import AsyncStorage from '@react-native-async-storage/async-storage';

import { DEFAULT_ALARM_SOUND_ID, type AlarmSoundId } from '@/constants/alarmSounds';
import { WEEKDAY_ORDER, type WeekdayKey, type WeeklyAlarmSchedule } from '@/types/alarmSchedule';

const ALARM_STORAGE_KEY = 'uptogether.alarm';

type LegacyAlarmShape = {
  hour?: number;
  minute?: number;
  enabled?: boolean;
  soundId?: AlarmSoundId;
  nextScheduledTimestamp?: number;
  notificationId?: string;
};

function buildDefaultDays(hour = 7, minute = 0) {
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

export function createDefaultAlarmSchedule(): WeeklyAlarmSchedule {
  return {
    enabled: true,
    skipNextOccurrence: false,
    label: 'Main alarm',
    soundId: DEFAULT_ALARM_SOUND_ID,
    days: buildDefaultDays(),
    nextScheduledTimestamp: null,
    notificationId: undefined,
  };
}

function isValidWeekdayKey(value: string): value is WeekdayKey {
  return WEEKDAY_ORDER.includes(value as WeekdayKey);
}

function migrateSchedule(raw: unknown): WeeklyAlarmSchedule {
  if (!raw || typeof raw !== 'object') {
    return createDefaultAlarmSchedule();
  }

  const candidate = raw as Partial<WeeklyAlarmSchedule>;

  if (candidate.days && typeof candidate.days === 'object') {
    const fallback = createDefaultAlarmSchedule();

    const normalizedDays = WEEKDAY_ORDER.reduce((acc, day) => {
      const source = (candidate.days as WeeklyAlarmSchedule['days'])[day];
      acc[day] = {
        enabled: typeof source?.enabled === 'boolean' ? source.enabled : fallback.days[day].enabled,
        hour: Number.isInteger(source?.hour) ? Number(source?.hour) : fallback.days[day].hour,
        minute: Number.isInteger(source?.minute) ? Number(source?.minute) : fallback.days[day].minute,
      };
      return acc;
    }, {} as WeeklyAlarmSchedule['days']);

    return {
      enabled: typeof candidate.enabled === 'boolean' ? candidate.enabled : true,
      skipNextOccurrence: Boolean(candidate.skipNextOccurrence),
      label: typeof candidate.label === 'string' ? candidate.label : 'Main alarm',
      soundId: candidate.soundId ?? DEFAULT_ALARM_SOUND_ID,
      days: normalizedDays,
      nextScheduledTimestamp:
        typeof candidate.nextScheduledTimestamp === 'number' ? candidate.nextScheduledTimestamp : null,
      notificationId: typeof candidate.notificationId === 'string' ? candidate.notificationId : undefined,
    };
  }

  const legacy = raw as LegacyAlarmShape;
  const fallbackHour = Number.isInteger(legacy.hour) ? Number(legacy.hour) : 7;
  const fallbackMinute = Number.isInteger(legacy.minute) ? Number(legacy.minute) : 0;

  return {
    enabled: typeof legacy.enabled === 'boolean' ? legacy.enabled : true,
    skipNextOccurrence: false,
    label: 'Main alarm',
    soundId: legacy.soundId ?? DEFAULT_ALARM_SOUND_ID,
    days: buildDefaultDays(fallbackHour, fallbackMinute),
    nextScheduledTimestamp: typeof legacy.nextScheduledTimestamp === 'number' ? legacy.nextScheduledTimestamp : null,
    notificationId: legacy.notificationId,
  };
}

export async function getAlarmSchedule(): Promise<WeeklyAlarmSchedule | null> {
  const value = await AsyncStorage.getItem(ALARM_STORAGE_KEY);

  if (!value) {
    return null;
  }

  const parsed = JSON.parse(value) as unknown;
  const migrated = migrateSchedule(parsed);

  await saveAlarmSchedule(migrated);

  return migrated;
}

export async function saveAlarmSchedule(schedule: WeeklyAlarmSchedule) {
  await AsyncStorage.setItem(ALARM_STORAGE_KEY, JSON.stringify(schedule));
}

export async function clearAlarmSchedule() {
  await AsyncStorage.removeItem(ALARM_STORAGE_KEY);
}

export async function toggleScheduleEnabled(enabled: boolean) {
  const current = (await getAlarmSchedule()) ?? createDefaultAlarmSchedule();
  const updated: WeeklyAlarmSchedule = {
    ...current,
    enabled,
    skipNextOccurrence: enabled ? current.skipNextOccurrence : false,
  };

  await saveAlarmSchedule(updated);
  return updated;
}

export async function setSkipNextOccurrence(skipNextOccurrence: boolean) {
  const current = (await getAlarmSchedule()) ?? createDefaultAlarmSchedule();
  const updated: WeeklyAlarmSchedule = {
    ...current,
    skipNextOccurrence,
  };

  await saveAlarmSchedule(updated);
  return updated;
}

export async function consumeSkipNextOccurrence() {
  const current = await getAlarmSchedule();

  if (!current || !current.skipNextOccurrence) {
    return current;
  }

  const updated = {
    ...current,
    skipNextOccurrence: false,
  };

  await saveAlarmSchedule(updated);
  return updated;
}

export async function skipNextOccurrence() {
  return setSkipNextOccurrence(true);
}
