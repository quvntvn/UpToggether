import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { useLanguage } from '@/context/language-context';
import { colors } from '@/lib/theme';
import { formatSeconds } from '@/utils/time';

function getReactionSeconds(value: string | string[] | undefined) {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const parsedValue = rawValue ? Number(rawValue) : NaN;

  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    return 0;
  }

  return Math.floor(parsedValue);
}

export default function ResultScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { reactionSeconds: reactionSecondsParam } = useLocalSearchParams<{ reactionSeconds?: string }>();
  const reactionSeconds = getReactionSeconds(reactionSecondsParam);
  const percentile = Math.max(1, 100 - reactionSeconds * 3);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: t('result.title') }} />

      <View style={styles.content}>
        <Text style={styles.kicker}>{t('result.kicker')}</Text>
        <Text style={styles.title}>{formatSeconds(reactionSeconds)}</Text>
        <Text style={styles.subtitle}>{t('result.reactionTime')}</Text>

        <View style={styles.heroCard}>
          <Text style={styles.percentile}>{t('result.percentile', { value: percentile })}</Text>
          <Text style={styles.helper}>{t('result.fasterThanUsers', { value: percentile })}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('result.whatHappened')}</Text>
          <Text style={styles.sectionBody}>{t('result.whatHappenedBody')}</Text>
        </View>

        <Pressable style={styles.primaryButton} onPress={() => router.replace('/')}>
          <Text style={styles.primaryButtonText}>{t('common.backHome')}</Text>
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
});
