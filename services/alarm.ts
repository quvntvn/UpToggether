import * as Notifications from 'expo-notifications';

const ALARM_BODY = 'Wake up! Don\'t wake up alone.';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export function getNextAlarmDate(hour: number, minute: number) {
  const now = new Date();
  const nextAlarm = new Date();

  nextAlarm.setHours(hour, minute, 0, 0);

  if (nextAlarm.getTime() <= now.getTime()) {
    nextAlarm.setDate(nextAlarm.getDate() + 1);
  }

  return nextAlarm;
}

export function formatAlarmTime(hour: number, minute: number) {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export async function requestAlarmPermissions() {
  const settings = await Notifications.getPermissionsAsync();

  if (settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync();

  return requested.granted || requested.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
}

export async function cancelScheduledAlarm(notificationId?: string | null) {
  if (!notificationId) {
    return;
  }

  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

export async function scheduleAlarmNotification(hour: number, minute: number) {
  const nextAlarmDate = getNextAlarmDate(hour, minute);

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'UpTogether',
      body: ALARM_BODY,
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: nextAlarmDate,
    },
  });

  return {
    notificationId,
    nextAlarmDate,
  };
}
