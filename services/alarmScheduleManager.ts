import { requestAlarmPermissions, cancelScheduledAlarm, scheduleAlarmNotificationAtDate } from '@/services/alarm';
import { getNextAlarmOccurrenceRespectingSkip } from '@/services/alarmScheduler';
import {
  getAlarmSchedule,
  saveAlarmSchedule
} from '@/storage/alarmScheduleStorage';
import type { WeeklyAlarmSchedule } from '@/types/alarmSchedule';

export async function syncWeeklyAlarmSchedule(
  schedule: WeeklyAlarmSchedule,
  options?: { requirePermissions?: boolean },
) {
  await cancelScheduledAlarm(schedule.notificationId);

  if (!schedule.enabled) {
    const disabledSchedule: WeeklyAlarmSchedule = {
      ...schedule,
      nextScheduledTimestamp: null,
      notificationId: undefined,
    };
    await saveAlarmSchedule(disabledSchedule);
    return { schedule: disabledSchedule, permissionsGranted: true };
  }

  const nextOccurrence = getNextAlarmOccurrenceRespectingSkip(schedule, new Date());

  if (!nextOccurrence) {
    const noOccurrenceSchedule: WeeklyAlarmSchedule = {
      ...schedule,
      nextScheduledTimestamp: null,
      notificationId: undefined,
    };
    await saveAlarmSchedule(noOccurrenceSchedule);
    return { schedule: noOccurrenceSchedule, permissionsGranted: true };
  }

  if (options?.requirePermissions) {
    const permissionsGranted = await requestAlarmPermissions();

    if (!permissionsGranted) {
      return { schedule, permissionsGranted: false };
    }
  }

  const { notificationId, nextAlarmDate, soundId } = await scheduleAlarmNotificationAtDate(
    nextOccurrence.date,
    schedule.soundId,
  );

  const syncedSchedule: WeeklyAlarmSchedule = {
    ...schedule,
    soundId,
    notificationId,
    nextScheduledTimestamp: nextAlarmDate.getTime(),
  };

  await saveAlarmSchedule(syncedSchedule);

  return { schedule: syncedSchedule, permissionsGranted: true };
}

export async function syncStoredWeeklyAlarmSchedule() {
  const savedSchedule = await getAlarmSchedule();

  if (!savedSchedule) {
    return null;
  }

  const { schedule } = await syncWeeklyAlarmSchedule(savedSchedule);
  return schedule;
}
