import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Linking, Platform } from 'react-native';

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
  alarmId?: string;
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
  metadata?: { alarmId?: string; scheduleId?: string; scheduleLabel?: string },
): AlarmNotificationData {
  const alarmId = metadata?.alarmId ?? metadata?.scheduleId;

  return {
    type: 'alarm',
    route: '/wake',
    startTime: nextAlarmDate.getTime(),
    alarmTime: formatAlarmTime(nextAlarmDate.getHours(), nextAlarmDate.getMinutes()),
    alarmId,
    scheduleId: metadata?.scheduleId ?? alarmId,
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
    enableLights: true,
    lightColor: '#FFD54A',
    showBadge: false,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    bypassDnd: true,
    audioAttributes: {
      usage: Notifications.AndroidAudioUsage.ALARM,
      contentType: Notifications.AndroidAudioContentType.SONIFICATION,
      flags: {
        enforceAudibility: true,
        requestHardwareAudioVideoSynchronization: false,
      },
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

/**
 * On Android 12+ users must opt in to exact alarms in system Settings, otherwise
 * scheduled notifications can be delayed by Doze and App Standby. This helper
 * deep-links to the OEM "Alarms & reminders" page so the UI can guide the user.
 */
export async function openExactAlarmSystemSettings() {
  if (Platform.OS !== 'android') {
    return false;
  }

  try {
    await Linking.sendIntent('android.settings.REQUEST_SCHEDULE_EXACT_ALARM');
    return true;
  } catch {
    try {
      await Linking.openSettings();
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Best-effort signal that the device's OS may delay alarms unless the user
 * has granted the SCHEDULE_EXACT_ALARM permission. expo-notifications does
 * not expose AlarmManager.canScheduleExactAlarms(), so we conservatively
 * return true on Android 12+ (API 31+) and let callers prompt the user.
 */
export function shouldPromptForExactAlarmSettings() {
  if (Platform.OS !== 'android') {
    return false;
  }

  return Number(Platform.Version) >= 31;
}

/**
 * Android 14+ (API 34) requires the user (or an alarm-clock intent-filter)
 * to grant USE_FULL_SCREEN_INTENT before the system honours
 * setFullScreenIntent(). Our config plugin declares MainActivity with an
 * ACTION_SET_ALARM filter so the OS auto-grants the permission, but if an
 * OEM has tightened the rule we want to deep-link the user to the per-app
 * settings page where they can enable it manually.
 */
export async function openFullScreenIntentSettings() {
  if (Platform.OS !== 'android') {
    return false;
  }

  try {
    await Linking.sendIntent('android.settings.MANAGE_APP_USE_FULL_SCREEN_INTENT');
    return true;
  } catch {
    try {
      await Linking.openSettings();
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * On Android 14+ the system can silently downgrade full-screen intents to
 * a regular notification banner if it does not consider the app an alarm
 * clock. We return true on API 34+ so the home screen can show a banner
 * inviting the user to verify the permission in system settings.
 */
export function shouldPromptForFullScreenIntentSettings() {
  if (Platform.OS !== 'android') {
    return false;
  }

  return Number(Platform.Version) >= 34;
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

export async function cancelAllScheduledAlarms() {
  if (Platform.OS === 'web') {
    for (const scheduledAlarm of webScheduledAlarms.values()) {
      clearTimeout(scheduledAlarm.timeoutId);
    }

    webScheduledAlarms.clear();
    return;
  }

  if (!isNativeNotificationsSupported) {
    return;
  }

  await Notifications.cancelAllScheduledNotificationsAsync();
}

function getWebNotificationFallbackId() {
  return `web-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function showWebAlarmFallback() {
  if (typeof globalThis.alert === 'function') {
    globalThis.alert('Alarm!');
    return;
  }

  console.info('Alarm!');
}

export async function scheduleAlarmSafe(
  date: Date,
  options: ScheduleAlarmSafeOptions = {},
) {
  if (Platform.OS === 'web') {
    console.warn(`[AlarmScheduler] Notifications are not supported on web. Using a local timeout fallback for ${date.toISOString()}.`);

    const notificationId = getWebNotificationFallbackId();
    const delay = Math.max(0, date.getTime() - Date.now());
    const timeoutId = setTimeout(() => {
      webScheduledAlarms.delete(notificationId);
      showWebAlarmFallback();
    }, delay);

    webScheduledAlarms.set(notificationId, {
      notificationId,
      scheduledFor: date.getTime(),
      timeoutId,
    });

    return notificationId;
  }

  if (!isNativeNotificationsSupported) {
    console.warn('Native notifications not supported on this platform.');
    return getWebNotificationFallbackId();
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
  metadata?: { alarmId?: string; scheduleId?: string; scheduleLabel?: string },
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
): { startTime: string; alarmTime: string; scheduleId?: string; alarmId?: string; scheduleLabel?: string } {
  const data = notification.request.content.data as Partial<AlarmNotificationData>;
  const notificationDate = new Date(notification.date);
  const fallback = notificationDate.getTime();
  const alarmId =
    typeof data.alarmId === 'string'
      ? data.alarmId
      : typeof data.scheduleId === 'string'
        ? data.scheduleId
        : undefined;

  return {
    startTime: String(
      typeof data.startTime === 'number' && Number.isFinite(data.startTime) ? data.startTime : fallback,
    ),
    alarmTime:
      typeof data.alarmTime === 'string'
        ? data.alarmTime
        : formatAlarmTime(notificationDate.getHours(), notificationDate.getMinutes()),
    scheduleId: alarmId,
    alarmId,
    scheduleLabel: typeof data.scheduleLabel === 'string' ? data.scheduleLabel : undefined,
  };
}
