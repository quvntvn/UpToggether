import {
  cancelAllScheduledAlarms,
  requestAlarmPermissions,
  scheduleAlarmNotificationAtDate,
} from '@/services/alarm';
import { getNextUpcomingSchedule, getNextTriggerDate, normalizeAlarmSchedulingState } from '@/services/alarmScheduler';
import {
  getAlarmSchedules,
  saveAlarmSchedules,
} from '@/storage/alarmScheduleStorage';
import type { AlarmSchedule } from '@/types/alarmSchedule';

type SyncAlarmSchedulesOptions = {
  requirePermissions?: boolean;
};

function clearSchedulingFields(schedule: AlarmSchedule): AlarmSchedule {
  return {
    ...schedule,
    nextScheduledTimestamp: null,
    notificationId: undefined,
  };
}

function prepareAlarmForScheduling(schedule: AlarmSchedule, fromDate: Date) {
  return clearSchedulingFields(normalizeAlarmSchedulingState(schedule, fromDate));
}

function logScheduledAlarm(schedule: AlarmSchedule, nextTriggerDate: Date, notificationId: string) {
  console.info(
    `[AlarmScheduler] Scheduled "${schedule.label}" (${schedule.id}) for ${nextTriggerDate.toISOString()} with notification ${notificationId}.`,
  );
}

/**
 * Reschedules all alarms:
 * - Cancels all existing notifications
 * - Schedules only the next occurrence for each enabled alarm
 * - Attaches alarmId in notification data
 * - Logs every scheduled alarm with its date
 */
export async function rescheduleAllAlarms(schedules: AlarmSchedule[]): Promise<AlarmSchedule[]> {
  const now = new Date();
  const preparedSchedules = schedules.map((schedule) => prepareAlarmForScheduling(schedule, now));

  await cancelAllScheduledAlarms();

  const updatedSchedules = await Promise.all(
    preparedSchedules.map(async (schedule) => {
      if (!schedule.enabled) {
        return schedule;
      }

      const nextTriggerDate = getNextTriggerDate(schedule, now);

      if (!nextTriggerDate) {
        return clearSchedulingFields(schedule);
      }

      const { notificationId } = await scheduleAlarmNotificationAtDate(
        nextTriggerDate,
        schedule.soundId,
        {
          alarmId: schedule.id,
          scheduleId: schedule.id,
          scheduleLabel: schedule.label,
        },
      );

      logScheduledAlarm(schedule, nextTriggerDate, notificationId);

      return {
        ...schedule,
        nextScheduledTimestamp: nextTriggerDate.getTime(),
        notificationId,
      };
    }),
  );

  return updatedSchedules;
}

export async function syncAlarmSchedules(options: SyncAlarmSchedulesOptions = {}) {
  const schedules = await getAlarmSchedules();

  if (options.requirePermissions) {
    const permissionsGranted = await requestAlarmPermissions();
    if (!permissionsGranted) {
      const cleaned = schedules.map(clearSchedulingFields);
      return { schedules: cleaned, nextUpcoming: null, permissionsGranted: false };
    }
  }

  const syncedSchedules = await rescheduleAllAlarms(schedules);
  await saveAlarmSchedules(syncedSchedules);

  return {
    schedules: syncedSchedules,
    nextUpcoming: getNextUpcomingSchedule(syncedSchedules, new Date()),
    permissionsGranted: true,
  };
}
