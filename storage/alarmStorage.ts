import AsyncStorage from '@react-native-async-storage/async-storage';

import type { AlarmSoundId } from '@/constants/alarmSounds';

const ALARM_STORAGE_KEY = 'uptogether.alarm';

export type SavedAlarm = {
  hour: number;
  minute: number;
  formattedTime: string;
  nextScheduledTimestamp: number;
  enabled: boolean;
  soundId?: AlarmSoundId;
  notificationId?: string;
};

export async function getSavedAlarm(): Promise<SavedAlarm | null> {
  const value = await AsyncStorage.getItem(ALARM_STORAGE_KEY);

  if (!value) {
    return null;
  }

  return JSON.parse(value) as SavedAlarm;
}

export async function saveAlarm(alarm: SavedAlarm) {
  await AsyncStorage.setItem(ALARM_STORAGE_KEY, JSON.stringify(alarm));
}

export async function clearAlarm() {
  await AsyncStorage.removeItem(ALARM_STORAGE_KEY);
}
