import { cancelScheduledAlarm, requestAlarmPermissions, scheduleAlarmNotificationAtDate } from '@/services/alarm';
import { getNextUpcomingSchedule, getNextTriggerDate } from '@/services/alarmScheduler';
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

/**
 * Reschedules all alarms:
 * - Cancels all existing notifications
 * - Schedules the next occurrence for each enabled alarm
 * - Attaches alarmId in data
 * - Logs every scheduled alarm with date
 */
export async function rescheduleAllAlarms(schedules: AlarmSchedule[]): Promise<AlarmSchedule[]> {
  console.log('Rescheduling all alarms...');

  // 1. Cancel all existing notifications
  await Promise.all(schedules.map((s) => cancelScheduledAlarm(s.notificationId)));

  const now = new Date();
  const updatedSchedules = [...schedules];

  // 2. Schedule only the next occurrence for EACH enabled alarm
  for (let i = 0; i < updatedSchedules.length; i++) {
    const schedule = updatedSchedules[i];
    if (!schedule.enabled) {
      updatedSchedules[i] = clearSchedulingFields(schedule);
      continue;
    }

    const nextTriggerDate = getNextTriggerDate(schedule, now);

    if (nextTriggerDate) {
      console.log(`Scheduling alarm "${schedule.label}" (${schedule.id}) for ${nextTriggerDate.toISOString()}`);

      const { notificationId } = await scheduleAlarmNotificationAtDate(
        nextTriggerDate,
        schedule.soundId,
        {
          scheduleId: schedule.id,
          scheduleLabel: schedule.label,
        },
      );

      updatedSchedules[i] = {
        ...schedule,
        nextScheduledTimestamp: nextTriggerDate.getTime(),
        notificationId,
      };
    } else {
      updatedSchedules[i] = clearSchedulingFields(schedule);
    }
  }

  await saveAlarmSchedules(updatedSchedules);
  return updatedSchedules;
}

export async function syncAlarmSchedules(options?: { requirePermissions?: boolean }) {
  const schedules = await getAlarmSchedules();

  if (options?.requirePermissions) {
    const permissionsGranted = await requestAlarmPermissions();
    if (!permissionsGranted) {
      const cleaned = schedules.map(clearSchedulingFields);
      return { schedules: cleaned, nextUpcoming: null, permissionsGranted: false };
    }
  }

  const syncedSchedules = await rescheduleAllAlarms(schedules);
  const nextUpcoming = getNextUpcomingSchedule(syncedSchedules, new Date());

  return {
    schedules: syncedSchedules,
    nextUpcoming,
    permissionsGranted: true,
  };
}
