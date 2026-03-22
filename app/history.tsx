import { Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useLanguage } from '@/context/language-context';
import { colors } from '@/lib/theme';
import { getWakeResults, type WakeResult } from '@/storage/wakeResultsStorage';
import { formatFullDate, formatHistoryDateLabel } from '@/utils/date';
import { formatReactionTime } from '@/utils/time';

export default function HistoryScreen() {
  const { language, t } = useLanguage();
  const [results, setResults] = useState<WakeResult[]>([]);

  const loadResults = useCallback(async () => {
    const savedResults = await getWakeResults();
    setResults(savedResults);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadResults();
    }, [loadResults]),
  );

  const locale = language === 'fr' ? 'fr-FR' : 'en-US';

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: t('history.title') }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t('history.title')}</Text>
        <Text style={styles.subtitle}>{t('history.subtitle')}</Text>

        {results.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>{t('history.emptyTitle')}</Text>
            <Text style={styles.emptyBody}>{t('history.emptyBody')}</Text>
          </View>
        ) : (
          results.map((result) => (
            <View key={result.id} style={styles.card}>
              <Text style={styles.dayLabel}>{formatHistoryDateLabel(result.stoppedAt, locale)}</Text>
              <Text style={styles.fullDate}>{formatFullDate(result.stoppedAt, locale)}</Text>

              <View style={styles.metricsRow}>
                <View style={styles.metricBlock}>
                  <Text style={styles.metricLabel}>{t('history.scheduledTime')}</Text>
                  <Text style={styles.metricValue}>{result.scheduledTime}</Text>
                </View>
                <View style={styles.metricBlock}>
                  <Text style={styles.metricLabel}>{t('history.reactionTime')}</Text>
                  <Text style={styles.metricValue}>{formatReactionTime(result.reactionSeconds)}</Text>
                </View>
              </View>

              <Text style={styles.percentile}>{t('result.fasterThanUsers', { value: result.percentile })}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  title: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.secondaryText,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
    marginBottom: 24,
  },
  emptyCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyBody: {
    color: colors.secondaryText,
    fontSize: 15,
    lineHeight: 22,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    marginBottom: 16,
  },
  dayLabel: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  fullDate: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  metricBlock: {
    flex: 1,
  },
  metricLabel: {
    color: colors.mutedText,
    fontSize: 13,
    marginBottom: 6,
  },
  metricValue: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  percentile: {
    color: colors.secondaryText,
    fontSize: 15,
  },
});
