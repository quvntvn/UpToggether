import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import {
  DEFAULT_ALARM_SOUND_ID,
  getAlarmSoundOption,
  type AlarmSoundId,
} from '@/constants/alarmSounds';

const ALARM_BODY = 'Wake up! Don\'t wake up alone.';
const ANDROID_ALARM_CHANNEL_ID = 'alarm-custom';

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

async function ensureAlarmNotificationChannel(soundName: string) {
  if (Platform.OS !== 'android' || soundName === 'default') {
    return undefined;
  }

  await Notifications.setNotificationChannelAsync(ANDROID_ALARM_CHANNEL_ID, {
    name: 'Alarms',
    description: 'Wake alarms for scheduled UpTogether notifications.',
    importance: Notifications.AndroidImportance.MAX,
    sound: soundName,
    vibrationPattern: [0, 250, 250, 250],
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

  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

export async function scheduleAlarmNotification(
  hour: number,
  minute: number,
  soundId: AlarmSoundId = DEFAULT_ALARM_SOUND_ID,
): Promise<{ notificationId: string; nextAlarmDate: Date; soundId: AlarmSoundId }> {
  const nextAlarmDate = getNextAlarmDate(hour, minute);
  const preferredSoundName = resolveAlarmNotificationSound(soundId);

  try {
    const channelId = await ensureAlarmNotificationChannel(preferredSoundName);

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'UpTogether',
        body: ALARM_BODY,
        sound: preferredSoundName,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: nextAlarmDate,
        channelId,
      },
    });

    return {
      notificationId,
      nextAlarmDate,
      soundId,
    };
  } catch (error) {
    console.warn('Falling back to default notification sound for alarm scheduling.', error);

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
      soundId: DEFAULT_ALARM_SOUND_ID,
    };
  }
}
