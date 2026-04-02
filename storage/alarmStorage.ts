import {
  clearAlarmSchedule,
  getAlarmSchedule,
  saveAlarmSchedule,
} from '@/storage/alarmScheduleStorage';
import type { WeeklyAlarmSchedule } from '@/types/alarmSchedule';

export type SavedAlarm = WeeklyAlarmSchedule;

export async function getSavedAlarm(): Promise<SavedAlarm | null> {
  return getAlarmSchedule();
}

export async function saveAlarm(alarm: SavedAlarm) {
  await saveAlarmSchedule(alarm);
}

export async function clearAlarm() {
  await clearAlarmSchedule();
}
