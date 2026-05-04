import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, BackHandler, Pressable, SafeAreaView, StyleSheet, Text, Vibration, View } from 'react-native';

import { useLanguage } from '@/context/language-context';
import { colors } from '@/lib/theme';
import { playAlarmSound, stopAlarmSound } from '@/services/sound';
import { syncAlarmSchedules } from '@/services/alarmScheduleManager';
import { clearSkippedNextOccurrence, getAlarmSchedules } from '@/storage/alarmScheduleStorage';
import { saveWakeResult } from '@/storage/wakeResultsStorage';
import { formatScheduledTime, getMockPercentile } from '@/utils/time';

function getStartTime(startTimeParam: string | string[] | undefined) {
  const rawValue = Array.isArray(startTimeParam) ? startTimeParam[0] : startTimeParam;
  const parsedValue = rawValue ? Number(rawValue) : NaN;

  return Number.isFinite(parsedValue) ? parsedValue : Date.now();
}

function formatMilliseconds(milliseconds: number) {
  const safeMilliseconds = Math.max(0, milliseconds);
  const minutes = Math.floor(safeMilliseconds / 60000);
  const seconds = Math.floor((safeMilliseconds % 60000) / 1000);
  const centiseconds = Math.floor((safeMilliseconds % 1000) / 10);

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`;
}

export default function WakeScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const {
    startTime: startTimeParam,
    alarmTime: alarmTimeParam,
    alarmId: alarmIdParam,
    scheduleId: scheduleIdParam,
  } = useLocalSearchParams<{ startTime?: string; alarmTime?: string; alarmId?: string; scheduleId?: string }>();
  const startTime = useMemo(() => getStartTime(startTimeParam), [startTimeParam]);
  const alarmTime = Array.isArray(alarmTimeParam) ? alarmTimeParam[0] : alarmTimeParam;
  const alarmId = Array.isArray(alarmIdParam) ? alarmIdParam[0] : alarmIdParam;
  const scheduleId = alarmId ?? (Array.isArray(scheduleIdParam) ? scheduleIdParam[0] : scheduleIdParam);
  const [elapsedMs, setElapsedMs] = useState(() => Math.max(0, Date.now() - startTime));
  const [isStopping, setIsStopping] = useState(false);
  const stopInFlightRef = useRef(false);

  useEffect(() => {
    setElapsedMs(Math.max(0, Date.now() - startTime));

    const interval = setInterval(() => {
      setElapsedMs(Math.max(0, Date.now() - startTime));
    }, 100);

    return () => clearInterval(interval);
  }, [startTime]);

  useEffect(() => {
    const backSubscription = BackHandler.addEventListener('hardwareBackPress', () => true);
    Vibration.vibrate([0, 400, 300, 400], true);

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
        <Text style={styles.timerValue}>{formatMilliseconds(elapsedMs)}</Text>

        <Pressable style={styles.stopButton} onPress={() => void handleStop()} disabled={isStopping}>
          <Text style={styles.stopButtonText}>{t('common.stop')}</Text>
        </Pressable>
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
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  timerValue: {
    color: colors.text,
    fontSize: 60,
    fontWeight: '800',
    marginBottom: 56,
    letterSpacing: 1,
  },
  stopButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 999,
    justifyContent: 'center',
    minHeight: 220,
    minWidth: 220,
    padding: 24,
  },
  stopButtonText: {
    color: '#111827',
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
