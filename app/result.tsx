import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { useLanguage } from '@/context/language-context';
import { colors } from '@/lib/theme';
import { formatReactionTime, getMockPercentile } from '@/utils/time';

function getNumberParam(value: string | string[] | undefined) {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const parsedValue = rawValue ? Number(rawValue) : NaN;

  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    return 0;
  }

  return parsedValue;
}

function getBooleanParam(value: string | string[] | undefined) {
  const rawValue = Array.isArray(value) ? value[0] : value;
  return rawValue === 'true';
}

function formatReactionMilliseconds(milliseconds: number) {
  const seconds = Math.floor(milliseconds / 1000);
  const centiseconds = Math.floor((milliseconds % 1000) / 10);

  return `${formatReactionTime(seconds)} ${String(centiseconds).padStart(2, '0')}cs`;
}

export default function ResultScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const {
    reactionSeconds: reactionSecondsParam,
    reactionTime: reactionTimeParam,
    percentile: percentileParam,
    saved: savedParam,
  } = useLocalSearchParams<{
    reactionSeconds?: string;
    reactionTime?: string;
    percentile?: string;
    saved?: string;
  }>();
  const reactionSeconds = Math.floor(getNumberParam(reactionSecondsParam));
  const reactionTime = Math.floor(getNumberParam(reactionTimeParam));
  const percentile = Math.max(1, Math.floor(getNumberParam(percentileParam)) || getMockPercentile(reactionSeconds));
  const wasSaved = getBooleanParam(savedParam);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: t('result.title') }} />

      <View style={styles.content}>
        <Text style={styles.kicker}>{t('result.kicker')}</Text>
        <Text style={styles.title}>{formatReactionTime(reactionSeconds)}</Text>
        {reactionTime > 0 ? <Text style={styles.subTitleMs}>{formatReactionMilliseconds(reactionTime)}</Text> : null}
        <Text style={styles.subtitle}>{t('result.reactionTime')}</Text>

        <View style={styles.heroCard}>
          <Text style={styles.percentile}>{t('result.percentile', { value: percentile })}</Text>
          <Text style={styles.helper}>{t('result.fasterThanUsers', { value: percentile })}</Text>
          {wasSaved ? <Text style={styles.savedText}>{t('result.savedToHistory')}</Text> : null}
        </View>

        <View style={styles.actions}>
          <Pressable style={styles.primaryButton} onPress={() => router.replace('/')}>
            <Text style={styles.primaryButtonText}>{t('common.backHome')}</Text>
          </Pressable>

          <Pressable style={styles.secondaryButton} onPress={() => router.push('/history')}>
            <Text style={styles.secondaryButtonText}>{t('result.viewHistory')}</Text>
          </Pressable>
        </View>
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
    padding: 24,
    justifyContent: 'center',
  },
  kicker: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  title: {
    color: colors.text,
    fontSize: 44,
    fontWeight: '800',
  },
  subTitleMs: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: '700',
    marginTop: 6,
  },
  subtitle: {
    color: colors.secondaryText,
    fontSize: 18,
    marginTop: 8,
    marginBottom: 24,
  },
  heroCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
  },
  percentile: {
    color: colors.primary,
    fontSize: 28,
    fontWeight: '800',
  },
  helper: {
    color: colors.secondaryText,
    fontSize: 15,
    marginTop: 8,
  },
  savedText: {
    color: colors.success,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 12,
  },
  actions: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryButton: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 18,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
});
