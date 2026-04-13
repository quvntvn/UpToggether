import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { isNativeNotificationsSupported } from '@/lib/isNativeNotificationsSupported';

import {
  DEFAULT_ALARM_SOUND_ID,
  getAlarmSoundOption,
  type AlarmSoundId,
} from '@/constants/alarmSounds';

const ALARM_BODY = 'Wake up! Don\'t wake up alone.';
const ANDROID_ALARM_CHANNEL_ID = 'alarm-custom';

type WebScheduledAlarm = {
  notificationId: string;
  scheduledFor: number;
  timeoutId: ReturnType<typeof setTimeout>;
};

type ScheduleAlarmSafeOptions = {
  title?: string;
  body?: string;
  sound?: Notifications.NotificationContentInput['sound'];
  data?: AlarmNotificationData;
  channelId?: string;
};

const webScheduledAlarms = new Map<string, WebScheduledAlarm>();

export type AlarmNotificationData = {
  type: 'alarm';
  route: '/wake';
  startTime: number;
  alarmTime: string;
  scheduleId?: string;
  scheduleLabel?: string;
};

if (isNativeNotificationsSupported) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

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

function hasBundledAlarmSound() {
  return Constants.expoConfig?.extra?.alarmSoundBundled === true;
}

export function resolveAlarmNotificationSound(soundId: AlarmSoundId = DEFAULT_ALARM_SOUND_ID) {
  if (!hasBundledAlarmSound()) {
    return 'default';
  }

  const sound = getAlarmSoundOption(soundId);

  return sound.fileName ?? 'default';
}

function getAlarmNotificationData(
  nextAlarmDate: Date,
  metadata?: { scheduleId?: string; scheduleLabel?: string },
): AlarmNotificationData {
  return {
    type: 'alarm',
    route: '/wake',
    startTime: nextAlarmDate.getTime(),
    alarmTime: formatAlarmTime(nextAlarmDate.getHours(), nextAlarmDate.getMinutes()),
    scheduleId: metadata?.scheduleId,
    scheduleLabel: metadata?.scheduleLabel,
  };
}

async function ensureAlarmNotificationChannel(soundName: string) {
  if (!isNativeNotificationsSupported || Platform.OS !== 'android' || soundName === 'default') {
    return undefined;
  }

  await Notifications.setNotificationChannelAsync(ANDROID_ALARM_CHANNEL_ID, {
    name: 'Alarms',
    description: 'Wake alarms for scheduled UpTogether notifications.',
    importance: Notifications.AndroidImportance.MAX,
    sound: soundName,
    vibrationPattern: [0, 500, 250, 500, 250, 500],
    enableVibrate: true,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    bypassDnd: true,
    audioAttributes: {
      usage: Notifications.AndroidAudioUsage.ALARM,
      contentType: Notifications.AndroidAudioContentType.SONIFICATION,
    },
  });

  return ANDROID_ALARM_CHANNEL_ID;
}

export async function requestAlarmPermissions() {
  if (!isNativeNotificationsSupported) {
    return true;
  }

  const settings = await Notifications.getPermissionsAsync();

  if (settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    },
  });

  return requested.granted || requested.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
}

export async function cancelScheduledAlarm(notificationId?: string | null) {
  if (!notificationId) {
    return;
  }

  if (Platform.OS === 'web') {
    const scheduledAlarm = webScheduledAlarms.get(notificationId);

    if (scheduledAlarm) {
      clearTimeout(scheduledAlarm.timeoutId);
      webScheduledAlarms.delete(notificationId);
    }

    return;
  }

  if (!isNativeNotificationsSupported) {
    return;
  }

  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

function getWebNotificationFallbackId() {
  return `web-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function showWebAlarmFallback() {
  if (typeof globalThis.alert === 'function') {
    globalThis.alert('⏰ Alarm!');
    return;
  }

  console.info('Alarm!');
}

export async function scheduleAlarmSafe(
  date: Date,
  options: ScheduleAlarmSafeOptions = {},
) {
  if (Platform.OS === 'web') {
    console.warn('Notifications not supported on web');

    const notificationId = getWebNotificationFallbackId();
    const delay = date.getTime() - Date.now();

    if (delay > 0) {
      const timeoutId = setTimeout(() => {
        webScheduledAlarms.delete(notificationId);
        showWebAlarmFallback();
      }, delay);

      webScheduledAlarms.set(notificationId, {
        notificationId,
        scheduledFor: date.getTime(),
        timeoutId,
      });
    }

    return notificationId;
  }

  return Notifications.scheduleNotificationAsync({
    content: {
      title: options.title ?? 'Alarm',
      body: options.body ?? 'Wake up!',
      sound: options.sound ?? true,
      ...(options.data ? { data: options.data } : {}),
    },
    trigger: ({
      type: 'date',
      date,
      ...(options.channelId ? { channelId: options.channelId } : {}),
    } as unknown) as Notifications.NotificationTriggerInput,
  });
}

export async function scheduleAlarmNotificationAtDate(
  nextAlarmDate: Date,
  soundId: AlarmSoundId = DEFAULT_ALARM_SOUND_ID,
  metadata?: { scheduleId?: string; scheduleLabel?: string },
): Promise<{ notificationId: string; nextAlarmDate: Date; soundId: AlarmSoundId }> {
  const preferredSoundName = resolveAlarmNotificationSound(soundId);
  const data = getAlarmNotificationData(nextAlarmDate, metadata);

  try {
    const channelId = await ensureAlarmNotificationChannel(preferredSoundName);

    const notificationId = await scheduleAlarmSafe(nextAlarmDate, {
      title: 'UpTogether',
      body: ALARM_BODY,
      sound: preferredSoundName,
      data,
      channelId,
    });

    return {
      notificationId,
      nextAlarmDate,
      soundId,
    };
  } catch (error) {
    console.warn('Falling back to default notification sound for alarm scheduling.', error);

    const notificationId = await scheduleAlarmSafe(nextAlarmDate, {
      title: 'UpTogether',
      body: ALARM_BODY,
      sound: 'default',
      data,
    });

    return {
      notificationId,
      nextAlarmDate,
      soundId: DEFAULT_ALARM_SOUND_ID,
    };
  }
}


export async function scheduleAlarmNotification(
  hour: number,
  minute: number,
  soundId: AlarmSoundId = DEFAULT_ALARM_SOUND_ID,
) {
  const nextAlarmDate = getNextAlarmDate(hour, minute);
  return scheduleAlarmNotificationAtDate(nextAlarmDate, soundId);
}

export function getWakeRouteParamsFromNotification(
  notification: Notifications.Notification,
): { startTime: string; alarmTime: string; scheduleId?: string; scheduleLabel?: string } {
  const data = notification.request.content.data as Partial<AlarmNotificationData>;
  const notificationDate = new Date(notification.date);
  const fallback = notificationDate.getTime();

  return {
    startTime: String(
      typeof data.startTime === 'number' && Number.isFinite(data.startTime) ? data.startTime : fallback,
    ),
    alarmTime: typeof data.alarmTime === 'string' ? data.alarmTime : formatAlarmTime(notificationDate.getHours(), notificationDate.getMinutes()),
    scheduleId: typeof data.scheduleId === 'string' ? data.scheduleId : undefined,
    scheduleLabel: typeof data.scheduleLabel === 'string' ? data.scheduleLabel : undefined,
  };
}
