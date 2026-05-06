import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useLanguage } from '@/context/language-context';
import { BADGE_CATALOG } from '@/lib/badges';
import { colors } from '@/lib/theme';
import { getUnlockedBadges } from '@/storage/badgesStorage';
import { getActiveContract } from '@/storage/contractsStorage';
import { getWakeResults, type WakeResult } from '@/storage/wakeResultsStorage';
import type { ActiveWakeContract } from '@/types/contracts';
import type { UnlockedBadge } from '@/types/badges';
import { getBestStreak, getCurrentStreak } from '@/utils/streak';

export default function ProgressTabScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const [results, setResults] = useState<WakeResult[]>([]);
  const [unlockedBadges, setUnlockedBadges] = useState<UnlockedBadge[]>([]);
  const [activeContract, setActiveContract] = useState<ActiveWakeContract | null>(null);

  const loadData = useCallback(async () => {
    const [savedResults, savedBadges, currentContract] = await Promise.all([
      getWakeResults(),
      getUnlockedBadges(),
      getActiveContract(),
    ]);

    setResults(savedResults);
    setUnlockedBadges(savedBadges);
    setActiveContract(currentContract);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData]),
  );

  const currentStreak = useMemo(() => getCurrentStreak(results), [results]);
  const bestStreak = useMemo(() => getBestStreak(results), [results]);
  const badgeProgress = Math.round((unlockedBadges.length / BADGE_CATALOG.length) * 100);
  const contractStatus =
    activeContract?.status === 'completed'
      ? t('progressTab.contractStatus.completed')
      : activeContract?.status === 'failed'
        ? t('progressTab.contractStatus.failed')
        : activeContract?.status === 'active'
          ? t('progressTab.contractStatus.active')
          : null;

  const streakUnit = t('progressTab.streakUnit');
  const historyKey = results.length === 1 ? 'progressTab.historyBodyOne' : 'progressTab.historyBodyOther';
  const historyBody = t(historyKey, { count: results.length });
  const badgesBody = t('progressTab.badgesBody', {
    unlocked: unlockedBadges.length,
    total: BADGE_CATALOG.length,
    percent: badgeProgress,
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{t('progressTab.title')}</Text>
        <Text style={styles.subtitle}>{t('progressTab.subtitle')}</Text>

        <View style={styles.metricsRow}>
          <View style={[styles.card, styles.metricCard]}>
            <Text style={styles.kicker}>{t('progressTab.currentStreak')}</Text>
            <Text style={styles.metricValue}>
              {currentStreak}
              {streakUnit}
            </Text>
          </View>
          <View style={[styles.card, styles.metricCard]}>
            <Text style={styles.kicker}>{t('progressTab.bestStreak')}</Text>
            <Text style={styles.metricValue}>
              {bestStreak}
              {streakUnit}
            </Text>
          </View>
        </View>

        <Pressable style={styles.card} onPress={() => router.push('/history')}>
          <Text style={styles.cardTitle}>{t('progressTab.historyTitle')}</Text>
          <Text style={styles.cardBody}>{historyBody}</Text>
        </Pressable>

        <Pressable style={styles.card} onPress={() => router.push('/badges')}>
          <Text style={styles.cardTitle}>{t('progressTab.badgesTitle')}</Text>
          <Text style={styles.cardBody}>{badgesBody}</Text>
        </Pressable>

        <Pressable style={styles.card} onPress={() => router.push('/contracts')}>
          <Text style={styles.cardTitle}>{t('progressTab.contractsTitle')}</Text>
          <Text style={styles.cardBody}>
            {activeContract
              ? `${activeContract.title}${contractStatus ? ` (${contractStatus})` : ''}`
              : t('progressTab.noContract')}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 40 },
  title: { color: colors.text, fontSize: 30, fontWeight: '800' },
  subtitle: { color: colors.secondaryText, fontSize: 15, marginTop: 6, marginBottom: 14 },
  metricsRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  metricCard: { flex: 1 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 10,
  },
  kicker: { color: colors.primary, fontSize: 11, fontWeight: '700' },
  metricValue: { color: colors.text, fontSize: 28, fontWeight: '800', marginTop: 8 },
  cardTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
  cardBody: { color: colors.secondaryText, fontSize: 14, lineHeight: 20, marginTop: 7 },
});
