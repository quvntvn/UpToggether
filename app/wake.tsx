import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { useLanguage } from '@/context/language-context';
import { colors } from '@/lib/theme';
import { getSavedAlarm } from '@/storage/alarmStorage';
import { saveWakeResult } from '@/storage/wakeResultsStorage';
import { formatReactionTime, formatScheduledTime, getMockPercentile } from '@/utils/time';

function getStartTime(startTimeParam: string | string[] | undefined) {
  const rawValue = Array.isArray(startTimeParam) ? startTimeParam[0] : startTimeParam;
  const parsedValue = rawValue ? Number(rawValue) : NaN;

  return Number.isFinite(parsedValue) ? parsedValue : Date.now();
}

export default function WakeScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { startTime: startTimeParam } = useLocalSearchParams<{ startTime?: string }>();
  const startTime = useMemo(() => getStartTime(startTimeParam), [startTimeParam]);
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

  const elapsedSeconds = Math.floor(elapsedMs / 1000);

  const handleStop = async () => {
    if (stopInFlightRef.current) {
      return;
    }

    stopInFlightRef.current = true;
    setIsStopping(true);

    const stoppedAt = new Date();
    const reactionTime = stoppedAt.getTime() - startTime;
    const reactionSeconds = Math.floor(Math.max(0, reactionTime) / 1000);
    const percentile = getMockPercentile(reactionSeconds);
    const savedAlarm = await getSavedAlarm();
    const scheduledTime = savedAlarm?.formattedTime ?? formatScheduledTime(new Date(startTime));
    const resultId = `${stoppedAt.toISOString()}-${reactionSeconds}`;

    await saveWakeResult({
      id: resultId,
      date: stoppedAt.toISOString(),
      scheduledTime,
      stoppedAt: stoppedAt.toISOString(),
      reactionSeconds,
      percentile,
      snoozeCount: 0,
      success: true,
    });

    router.replace({
      pathname: '/result',
      params: {
        reactionSeconds: String(reactionSeconds),
        percentile: String(percentile),
        saved: 'true',
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: t('wake.title') }} />

      <View style={styles.content}>
        <Text style={styles.kicker}>{t('wake.kicker')}</Text>
        <Text style={styles.title}>{t('wake.title')}</Text>
        <Text style={styles.timerLabel}>{t('wake.timerLabel')}</Text>
        <Text style={styles.timerValue}>{formatReactionTime(elapsedSeconds)}</Text>

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
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  kicker: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontSize: 52,
    fontWeight: '800',
    marginBottom: 20,
  },
  timerLabel: {
    color: colors.secondaryText,
    fontSize: 18,
    marginBottom: 12,
  },
  timerValue: {
    color: colors.text,
    fontSize: 40,
    fontWeight: '700',
    marginBottom: 48,
  },
  stopButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 999,
    justifyContent: 'center',
    minHeight: 180,
    minWidth: 180,
    padding: 24,
  },
  stopButtonText: {
    color: colors.background,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
