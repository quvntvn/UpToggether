import {
  cancelAllScheduledAlarms,
  requestAlarmPermissions,
  scheduleAlarmNotificationAtDate,
} from '@/services/alarm';
import { getNextTriggerDate, getNextUpcomingSchedule, normalizeAlarmSchedulingState } from '@/services/alarmScheduler';
import {
  getAlarmSchedules,
  saveAlarmSchedules,
} from '@/storage/alarmScheduleStorage';
import type { AlarmSchedule } from '@/types/alarmSchedule';

type SyncAlarmSchedulesOptions = {
  requirePermissions?: boolean;
};

type ScheduledAlarmResult = {
  alarmId: string;
  notificationId: string;
  nextTriggerDate: Date;
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

async function scheduleNextOccurrenceForAlarm(
  schedule: AlarmSchedule,
  fromDate: Date,
): Promise<ScheduledAlarmResult | null> {
  const nextTriggerDate = getNextTriggerDate(schedule, fromDate);

  if (!nextTriggerDate) {
    return null;
  }

  try {
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
      alarmId: schedule.id,
      notificationId,
      nextTriggerDate,
    };
  } catch (error) {
    console.error(`[AlarmScheduler] Failed to schedule "${schedule.label}" (${schedule.id}).`, error);
    return null;
  }
}

export async function rescheduleAllAlarms(
  alarms: AlarmSchedule[],
  options: SyncAlarmSchedulesOptions = {},
) {
  const fromDate = new Date();

  await cancelAllScheduledAlarms();

  const preparedSchedules = alarms.map((alarm) => prepareAlarmForScheduling(alarm, fromDate));
  const schedulesToSchedule = preparedSchedules.filter((alarm) => getNextTriggerDate(alarm, fromDate) !== null);

  if (options.requirePermissions && schedulesToSchedule.length > 0) {
    const permissionsGranted = await requestAlarmPermissions();

    if (!permissionsGranted) {
      return {
        schedules: preparedSchedules,
        nextUpcoming: getNextUpcomingSchedule(preparedSchedules, fromDate),
        permissionsGranted: false,
        scheduled: [] as ScheduledAlarmResult[],
      };
    }
  }

  const scheduled = (
    await Promise.all(
      preparedSchedules.map((alarm) => scheduleNextOccurrenceForAlarm(alarm, fromDate)),
    )
  ).filter((alarm): alarm is ScheduledAlarmResult => Boolean(alarm));

  const scheduledById = new Map(scheduled.map((alarm) => [alarm.alarmId, alarm]));

  const syncedSchedules = preparedSchedules.map((alarm) => {
    const scheduledAlarm = scheduledById.get(alarm.id);

    if (!scheduledAlarm) {
      return alarm;
    }

    return {
      ...alarm,
      nextScheduledTimestamp: scheduledAlarm.nextTriggerDate.getTime(),
      notificationId: scheduledAlarm.notificationId,
    };
  });

  return {
    schedules: syncedSchedules,
    nextUpcoming: getNextUpcomingSchedule(syncedSchedules, fromDate),
    permissionsGranted: true,
    scheduled,
  };
}

export async function syncAlarmSchedules(options: SyncAlarmSchedulesOptions = {}) {
  const schedules = await getAlarmSchedules();
  const result = await rescheduleAllAlarms(schedules, options);

  await saveAlarmSchedules(result.schedules);

  return result;
}
