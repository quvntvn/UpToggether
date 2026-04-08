import { cancelScheduledAlarm, requestAlarmPermissions, scheduleAlarmNotificationAtDate } from '@/services/alarm';
import { getNextUpcomingSchedule } from '@/services/alarmScheduler';
import {
  getAlarmSchedules,
  saveAlarmSchedules,
} from '@/storage/alarmScheduleStorage';
import type { AlarmSchedule } from '@/types/alarmSchedule';

function clearSchedulingFields(schedule: AlarmSchedule): AlarmSchedule {
  return {
    ...schedule,
    nextScheduledTimestamp: null,
    notificationId: undefined,
  };
}

export async function syncAlarmSchedules(options?: { requirePermissions?: boolean }) {
  const schedules = await getAlarmSchedules();

  await Promise.all(schedules.map((schedule) => cancelScheduledAlarm(schedule.notificationId)));

  const cleanedSchedules = schedules.map(clearSchedulingFields);
  const nextUpcoming = getNextUpcomingSchedule(cleanedSchedules, new Date());

  if (!nextUpcoming) {
    await saveAlarmSchedules(cleanedSchedules);
    return { schedules: cleanedSchedules, nextUpcoming: null, permissionsGranted: true };
  }

  if (options?.requirePermissions) {
    const permissionsGranted = await requestAlarmPermissions();
    if (!permissionsGranted) {
      return { schedules, nextUpcoming, permissionsGranted: false };
    }
  }

  const { nextAlarmDate, notificationId } = await scheduleAlarmNotificationAtDate(
    nextUpcoming.occurrence.date,
    nextUpcoming.schedule.soundId,
    {
      scheduleId: nextUpcoming.schedule.id,
      scheduleLabel: nextUpcoming.schedule.label,
    },
  );

  const syncedSchedules = cleanedSchedules.map((schedule) =>
    schedule.id === nextUpcoming.schedule.id
      ? {
          ...schedule,
          nextScheduledTimestamp: nextAlarmDate.getTime(),
          notificationId,
        }
      : schedule,
  );

  await saveAlarmSchedules(syncedSchedules);

  return {
    schedules: syncedSchedules,
    nextUpcoming: {
      ...nextUpcoming,
      schedule: syncedSchedules.find((item) => item.id === nextUpcoming.schedule.id) ?? nextUpcoming.schedule,
    },
    permissionsGranted: true,
  };
}
