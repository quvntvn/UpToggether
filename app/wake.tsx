import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { useLanguage } from '@/context/language-context';
import { colors } from '@/lib/theme';
import { formatSeconds } from '@/utils/time';

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

  useEffect(() => {
    setElapsedMs(Math.max(0, Date.now() - startTime));

    const interval = setInterval(() => {
      setElapsedMs(Math.max(0, Date.now() - startTime));
    }, 100);

    return () => clearInterval(interval);
  }, [startTime]);

  const elapsedSeconds = Math.floor(elapsedMs / 1000);

  const handleStop = () => {
    const reactionTime = Date.now() - startTime;
    const reactionSeconds = Math.floor(Math.max(0, reactionTime) / 1000);

    router.replace({
      pathname: '/result',
      params: {
        reactionSeconds: String(reactionSeconds),
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
        <Text style={styles.timerValue}>{formatSeconds(elapsedSeconds)}</Text>

        <Pressable style={styles.stopButton} onPress={handleStop}>
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
