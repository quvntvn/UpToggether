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

  return Math.floor(parsedValue);
}

function getBooleanParam(value: string | string[] | undefined) {
  const rawValue = Array.isArray(value) ? value[0] : value;
  return rawValue === 'true';
}

export default function ResultScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const {
    reactionSeconds: reactionSecondsParam,
    percentile: percentileParam,
    saved: savedParam,
  } = useLocalSearchParams<{ reactionSeconds?: string; percentile?: string; saved?: string }>();
  const reactionSeconds = getNumberParam(reactionSecondsParam);
  const percentile = Math.max(1, getNumberParam(percentileParam) || getMockPercentile(reactionSeconds));
  const wasSaved = getBooleanParam(savedParam);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: t('result.title') }} />

      <View style={styles.content}>
        <Text style={styles.kicker}>{t('result.kicker')}</Text>
        <Text style={styles.title}>{formatReactionTime(reactionSeconds)}</Text>
        <Text style={styles.subtitle}>{t('result.reactionTime')}</Text>

        <View style={styles.heroCard}>
          <Text style={styles.percentile}>{t('result.percentile', { value: percentile })}</Text>
          <Text style={styles.helper}>{t('result.fasterThanUsers', { value: percentile })}</Text>
          {wasSaved ? <Text style={styles.savedText}>{t('result.savedToHistory')}</Text> : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('result.whatHappened')}</Text>
          <Text style={styles.sectionBody}>{t('result.whatHappenedBody')}</Text>
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
  section: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
  },
  sectionBody: {
    color: colors.secondaryText,
    fontSize: 15,
    lineHeight: 22,
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
