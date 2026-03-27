import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { buildMorningPreview } from '@/lib/mockRanking';
import { colors } from '@/lib/theme';
import { getSavedAlarm, type SavedAlarm } from '@/storage/alarmStorage';
import { getWakeResults, type WakeResult } from '@/storage/wakeResultsStorage';
import { getBestStreak, getCurrentStreak } from '@/utils/streak';
import { formatReactionTime, getAverageReactionSeconds } from '@/utils/time';

export default function HomeScreen() {
  const router = useRouter();
  const [alarm, setAlarm] = useState<SavedAlarm | null>(null);
  const [results, setResults] = useState<WakeResult[]>([]);

  const loadData = useCallback(async () => {
    const [savedAlarm, savedResults] = await Promise.all([getSavedAlarm(), getWakeResults()]);
    setAlarm(savedAlarm);
    setResults(savedResults);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData]),
  );

  const nextAlarmDate = useMemo(
    () => (alarm ? new Date(alarm.nextScheduledTimestamp) : null),
    [alarm],
  );
  const formattedAlarmDate = useMemo(() => {
    if (!nextAlarmDate) {
      return null;
    }

    return nextAlarmDate.toLocaleDateString('en-US');
  }, [nextAlarmDate]);

  const currentStreak = useMemo(() => getCurrentStreak(results), [results]);
  const bestStreak = useMemo(() => getBestStreak(results), [results]);
  const averageReactionSeconds = useMemo(
    () => getAverageReactionSeconds(results.map((result) => result.reactionSeconds)),
    [results],
  );

  const latestResultSeconds = results.length > 0 ? results[0]?.reactionSeconds ?? 18 : 18;
  const morningPreview = useMemo(() => buildMorningPreview(latestResultSeconds), [latestResultSeconds]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.brand}>UpTogether</Text>
          <Text style={styles.slogan}>Don&apos;t wake up alone.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Next alarm</Text>
          {alarm?.enabled && nextAlarmDate && formattedAlarmDate ? (
            <>
              <Text style={styles.cardTime}>{alarm.formattedTime}</Text>
              <Text style={styles.cardInfo}>Scheduled for {formattedAlarmDate} at {alarm.formattedTime}</Text>
            </>
          ) : (
            <>
              <Text style={styles.placeholderTitle}>No alarm saved yet</Text>
              <Text style={styles.cardInfo}>Set your first wake-up to keep your mornings on track.</Text>
            </>
          )}
        </View>

        <View style={styles.statsCard}>
          <Text style={styles.cardLabel}>Your wake stats</Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{results.length > 0 ? `${currentStreak}` : '--'}</Text>
              <Text style={styles.statLabel}>Current streak</Text>
            </View>

            <View style={styles.statItem}>
              <Text style={styles.statValue}>{results.length > 0 ? `${bestStreak}` : '--'}</Text>
              <Text style={styles.statLabel}>Best streak</Text>
            </View>
          </View>

          <View style={styles.averageCard}>
            <Text style={styles.statLabel}>Average reaction time</Text>
            <Text style={styles.averageValue}>
              {averageReactionSeconds === null ? 'No wake history yet' : formatReactionTime(averageReactionSeconds)}
            </Text>
          </View>

          <Pressable style={styles.historyButton} onPress={() => router.push('/history')}>
            <Text style={styles.historyButtonText}>View History</Text>
          </Pressable>
        </View>

        <View style={styles.socialPreviewCard}>
          <Text style={styles.socialTitle}>Morning Crew</Text>
          <Text style={styles.socialSubtitle}>Today&apos;s mock social check-in.</Text>

          <View style={styles.previewList}>
            {morningPreview.map((item) => (
              <View key={item.id} style={styles.previewRow}>
                <Text style={styles.previewBullet}>•</Text>
                <Text style={styles.previewText}>{item.message}</Text>
              </View>
            ))}
          </View>

          <Pressable style={styles.previewButton} onPress={() => router.push('/friends')}>
            <Text style={styles.previewButtonText}>Open Friends</Text>
          </Pressable>
        </View>

        <Pressable style={styles.primaryButton} onPress={() => router.push('/set-alarm')}>
          <Text style={styles.primaryButtonText}>Set Alarm</Text>
        </Pressable>

        <Pressable
          style={styles.secondaryButton}
          onPress={() =>
            router.push({
              pathname: '/wake',
              params: { startTime: String(Date.now()) },
            })
          }>
          <Text style={styles.secondaryButtonText}>Test Wake</Text>
        </Pressable>

        <View style={styles.rowButtons}>
          <Pressable style={styles.rowButton} onPress={() => router.push('/friends')}>
            <Text style={styles.rowButtonText}>Friends</Text>
          </Pressable>

          <Pressable style={styles.rowButton} onPress={() => router.push('/settings')}>
            <Text style={styles.rowButtonText}>Settings</Text>
          </Pressable>
        </View>

        <Pressable
          style={styles.linkButton}
          onPress={() =>
            router.push({
              pathname: '/result',
              params: { reactionSeconds: '12', percentile: '64' },
            })
          }>
          <Text style={styles.linkButtonText}>Preview wake result</Text>
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
    paddingHorizontal: 24,
    paddingVertical: 32,
    justifyContent: 'center',
  },
  hero: {
    marginBottom: 32,
  },
  brand: {
    color: colors.text,
    fontSize: 36,
    fontWeight: '800',
    textAlign: 'center',
  },
  slogan: {
    color: colors.secondaryText,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    marginBottom: 16,
  },
  statsCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    marginBottom: 16,
  },
  cardLabel: {
    color: colors.mutedText,
    fontSize: 14,
    marginBottom: 10,
  },
  cardTime: {
    color: colors.primary,
    fontSize: 48,
    fontWeight: '800',
  },
  placeholderTitle: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '700',
  },
  cardInfo: {
    color: colors.secondaryText,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  statItem: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
  },
  statLabel: {
    color: colors.secondaryText,
    fontSize: 14,
    marginTop: 8,
  },
  averageCard: {
    backgroundColor: colors.background,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 12,
  },
  averageValue: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: '800',
    marginTop: 8,
  },
  historyButton: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 16,
    marginTop: 16,
  },
  historyButtonText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  socialPreviewCard: {
    backgroundColor: colors.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    marginBottom: 20,
  },
  socialTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  socialSubtitle: {
    color: colors.secondaryText,
    fontSize: 13,
    marginTop: 4,
  },
  previewList: {
    marginTop: 12,
    gap: 8,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  previewBullet: {
    color: colors.primary,
    width: 16,
    fontSize: 18,
    lineHeight: 20,
  },
  previewText: {
    color: colors.secondaryText,
    flex: 1,
    fontSize: 14,
  },
  previewButton: {
    backgroundColor: 'rgba(255, 213, 74, 0.14)',
    borderRadius: 14,
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 14,
  },
  previewButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 12,
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
    marginBottom: 12,
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  rowButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  rowButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 18,
    alignItems: 'center',
  },
  rowButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  linkButton: {
    alignItems: 'center',
    marginTop: 20,
  },
  linkButtonText: {
    color: colors.secondaryText,
    fontSize: 14,
    fontWeight: '600',
  },
});
