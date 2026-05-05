import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, BackHandler, SafeAreaView, StyleSheet, Text, Vibration, View } from 'react-native';

import { WakeButton } from '@/components/wake-button';
import { useLanguage } from '@/context/language-context';
import { colors } from '@/lib/theme';
import { syncAlarmSchedules } from '@/services/alarmScheduleManager';
import { playAlarmSound, stopAlarmSound } from '@/services/sound';
import { clearSkippedNextOccurrence, getAlarmSchedules } from '@/storage/alarmScheduleStorage';
import { saveWakeResult } from '@/storage/wakeResultsStorage';
import { formatScheduledTime, getMockPercentile } from '@/utils/time';

function getStartTime(startTimeParam: string | string[] | undefined) {
  const rawValue = Array.isArray(startTimeParam) ? startTimeParam[0] : startTimeParam;
  const parsedValue = rawValue ? Number(rawValue) : NaN;

  return Number.isFinite(parsedValue) ? parsedValue : Date.now();
}

function getFirstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function WakeScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const {
    startTime: startTimeParam,
    alarmTime: alarmTimeParam,
    scheduleId: scheduleIdParam,
    alarmId: alarmIdParam,
  } = useLocalSearchParams<{
    startTime?: string;
    alarmTime?: string;
    scheduleId?: string;
    alarmId?: string;
  }>();

  const startTime = useMemo(() => getStartTime(startTimeParam), [startTimeParam]);
  const alarmTime = getFirstParam(alarmTimeParam);
  const scheduleId = getFirstParam(alarmIdParam) ?? getFirstParam(scheduleIdParam);

  const [isStopping, setIsStopping] = useState(false);
  const stopInFlightRef = useRef(false);

  useEffect(() => {
    const backSubscription = BackHandler.addEventListener('hardwareBackPress', () => true);
    const vibrationPattern = [0, 1000, 500];

    Vibration.vibrate(vibrationPattern, true);

    void playAlarmSound().then((didPlay) => {
      if (!didPlay) {
        Alert.alert('Alarm sound unavailable', 'Please stop alarm now.');
      }
    });

    return () => {
      backSubscription.remove();
      Vibration.cancel();
      void stopAlarmSound();
    };
  }, []);

  const handleStop = async () => {
    if (stopInFlightRef.current) {
      return;
    }

    stopInFlightRef.current = true;
    setIsStopping(true);

    const stoppedAt = new Date();
    const reactionTime = Math.max(0, stoppedAt.getTime() - startTime);
    const reactionSeconds = Math.floor(reactionTime / 1000);
    const percentile = getMockPercentile(reactionSeconds);

    await stopAlarmSound();
    Vibration.cancel();

    const savedSchedules = await getAlarmSchedules();
    const triggeringSchedule = scheduleId ? savedSchedules.find((schedule) => schedule.id === scheduleId) : null;
    const scheduleTimeFromStorage = triggeringSchedule?.nextScheduledTimestamp
      ? formatScheduledTime(new Date(triggeringSchedule.nextScheduledTimestamp))
      : null;
    const scheduledTime = alarmTime ?? scheduleTimeFromStorage ?? formatScheduledTime(new Date(startTime));
    const resultId = `${stoppedAt.toISOString()}-${reactionTime}`;

    await saveWakeResult({
      id: resultId,
      date: stoppedAt.toISOString(),
      timestamp: stoppedAt.toISOString(),
      scheduledTime,
      alarmTime: scheduledTime,
      stoppedAt: stoppedAt.toISOString(),
      reactionSeconds,
      reactionTime,
      percentile,
      snoozeCount: 0,
      success: true,
    });

    if (triggeringSchedule?.skipNextOccurrence) {
      await clearSkippedNextOccurrence(triggeringSchedule.id);
    }

    await syncAlarmSchedules();

    router.replace({
      pathname: '/result',
      params: {
        reactionSeconds: String(reactionSeconds),
        reactionTime: String(reactionTime),
        percentile: String(percentile),
        saved: 'true',
        wakeResultId: resultId,
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false, title: t('wake.title') }} />

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.alarmTimeText}>{alarmTime || '--:--'}</Text>
          <Text style={styles.wakeUpText}>WAKE UP</Text>
        </View>

        <View style={styles.footer}>
          <WakeButton onStop={handleStop} disabled={isStopping} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05070F',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 30,
    paddingVertical: 60,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
  },
  alarmTimeText: {
    color: colors.text,
    fontSize: 80,
    fontWeight: '800',
    letterSpacing: 2,
  },
  wakeUpText: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: 8,
    marginTop: 10,
  },
  footer: {
    width: '100%',
    marginBottom: 40,
  },
});
