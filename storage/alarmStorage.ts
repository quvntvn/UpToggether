import {
  createAlarmSchedule,
  deleteAlarmSchedule,
  getAlarmSchedules,
  updateAlarmSchedule,
} from '@/storage/alarmScheduleStorage';
import type { AlarmSchedule } from '@/types/alarmSchedule';

export type SavedAlarm = AlarmSchedule;

export async function getSavedAlarm(): Promise<SavedAlarm | null> {
  const schedules = await getAlarmSchedules();
  return schedules[0] ?? null;
}

export async function saveAlarm(alarm: SavedAlarm) {
  const schedules = await getAlarmSchedules();
  const existing = schedules.find((item) => item.id === alarm.id);

  if (existing) {
    await updateAlarmSchedule(alarm.id, () => alarm);
    return;
  }

  const created = await createAlarmSchedule(alarm.label);
  await updateAlarmSchedule(created.id, () => ({ ...alarm, id: created.id }));
}

export async function clearAlarm() {
  const schedules = await getAlarmSchedules();
  await Promise.all(schedules.map((schedule) => deleteAlarmSchedule(schedule.id)));
}
