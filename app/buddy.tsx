import { Stack, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { getDailyWakeBuddy } from '@/lib/mockBuddy';
import { buildBuddyComparison, buildBuddyFeed, buildBuddyStatus } from '@/lib/mockBuddyStatus';
import { colors } from '@/lib/theme';
import { getLatestReaction } from '@/storage/reactionsStorage';
import { getWakeResults, type WakeResult } from '@/storage/wakeResultsStorage';
import type { SavedReaction } from '@/types/reaction';
import { formatReactionTime } from '@/utils/time';

export default function BuddyScreen() {
  const [results, setResults] = useState<WakeResult[]>([]);
  const [latestReaction, setLatestReaction] = useState<SavedReaction | null>(null);

  const loadData = useCallback(async () => {
    const [savedResults, reaction] = await Promise.all([getWakeResults(), getLatestReaction()]);
    setResults(savedResults);
    setLatestReaction(reaction);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData]),
  );

  const todayDate = useMemo(() => new Date(), []);
  const buddy = useMemo(() => getDailyWakeBuddy(todayDate), [todayDate]);

  const todaysWakeResult = useMemo(() => {
    const todayKey = new Date().toISOString().slice(0, 10);
    return results.find((result) => result.stoppedAt.slice(0, 10) === todayKey);
  }, [results]);

  const comparison = useMemo(
    () =>
      buildBuddyComparison({
        date: todayDate,
        hasUserWakeResult: Boolean(todaysWakeResult),
        userReactionSeconds: todaysWakeResult?.reactionSeconds,
      }),
    [todaysWakeResult, todayDate],
  );

  const status = useMemo(
    () =>
      buildBuddyStatus({
        date: todayDate,
        hasUserWakeResult: Boolean(todaysWakeResult),
        userReactionSeconds: todaysWakeResult?.reactionSeconds,
        userSnoozeCount: todaysWakeResult?.snoozeCount ?? 0,
      }),
    [todaysWakeResult, todayDate],
  );

  const latestReactionLine = useMemo(() => {
    const todayKey = new Date().toISOString().slice(0, 10);

    if (!latestReaction || latestReaction.relatedDate !== todayKey) {
      return null;
    }

    return `${latestReaction.text} ${latestReaction.emoji}`;
  }, [latestReaction]);

  const feed = useMemo(
    () =>
      buildBuddyFeed({
        date: todayDate,
        hasUserWakeResult: Boolean(todaysWakeResult),
        userReactionSeconds: todaysWakeResult?.reactionSeconds,
        userSnoozeCount: todaysWakeResult?.snoozeCount ?? 0,
        latestReactionLine,
      }),
    [latestReactionLine, todaysWakeResult, todayDate],
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Wake Buddy' }} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Wake Buddy</Text>
        <Text style={styles.subtitle}>A local accountability partner for your mornings.</Text>

        <View style={styles.heroCard}>
          <Text style={styles.avatar}>{buddy.avatar}</Text>
          <Text style={styles.buddyName}>{buddy.name}</Text>
          <Text style={styles.profile}>{buddy.profile}</Text>
          <Text style={styles.statusLabel}>{status.shortLabel}</Text>
          <Text style={styles.accountability}>{status.accountabilityText}</Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Today&apos;s connection</Text>
          <Text style={styles.relationshipText}>{status.relationshipText}</Text>
          <View style={styles.insightList}>
            <Text style={styles.insightItem}>• Personality: {buddy.personality}</Text>
            <Text style={styles.insightItem}>• Wake style: {buddy.wakeStyle}</Text>
            <Text style={styles.insightItem}>• You&apos;re not waking up alone today.</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Buddy battle</Text>
          {comparison ? (
            <>
              <View style={styles.comparisonRow}>
                <Text style={styles.comparisonLabel}>You</Text>
                <Text style={styles.comparisonValue}>{formatReactionTime(comparison.userReactionSeconds)}</Text>
              </View>
              <View style={styles.comparisonRow}>
                <Text style={styles.comparisonLabel}>{buddy.name}</Text>
                <Text style={styles.comparisonValue}>{formatReactionTime(comparison.buddyReactionSeconds)}</Text>
              </View>
              <Text style={styles.comparisonSummary}>{comparison.summary}</Text>
            </>
          ) : (
            <Text style={styles.emptyState}>Complete your wake challenge to unlock today&apos;s buddy battle.</Text>
          )}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Buddy feed</Text>
          <View style={styles.feedList}>
            {feed.map((item) => (
              <View key={item.id} style={styles.feedRow}>
                <Text style={styles.feedBullet}>•</Text>
                <Text style={styles.feedText}>
                  {item.author}: {item.message}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <Pressable style={styles.tipCard}>
          <Text style={styles.tipTitle}>Accountability mode</Text>
          <Text style={styles.tipText}>Your buddy is counting on you tomorrow morning.</Text>
        </Pressable>
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
    marginTop: 6,
    marginBottom: 14,
  },
  heroCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    marginBottom: 14,
  },
  avatar: {
    fontSize: 34,
  },
  buddyName: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '800',
    marginTop: 8,
  },
  profile: {
    color: colors.secondaryText,
    fontSize: 14,
    marginTop: 6,
  },
  statusLabel: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 12,
  },
  accountability: {
    color: colors.text,
    fontSize: 14,
    marginTop: 6,
    lineHeight: 20,
  },
  sectionCard: {
    backgroundColor: colors.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 14,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '800',
  },
  relationshipText: {
    color: colors.secondaryText,
    fontSize: 14,
    marginTop: 8,
    lineHeight: 20,
  },
  insightList: {
    marginTop: 10,
    gap: 6,
  },
  insightItem: {
    color: colors.mutedText,
    fontSize: 13,
  },
  comparisonRow: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  comparisonLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  comparisonValue: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  comparisonSummary: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 12,
  },
  emptyState: {
    color: colors.secondaryText,
    fontSize: 14,
    marginTop: 8,
  },
  feedList: {
    marginTop: 10,
    gap: 8,
  },
  feedRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  feedBullet: {
    color: colors.primary,
    fontSize: 18,
    width: 18,
    lineHeight: 20,
  },
  feedText: {
    color: colors.secondaryText,
    flex: 1,
    lineHeight: 20,
  },
  tipCard: {
    backgroundColor: 'rgba(255, 213, 74, 0.14)',
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
  },
  tipTitle: {
    color: colors.primary,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '800',
  },
  tipText: {
    color: colors.text,
    fontSize: 14,
    marginTop: 6,
  },
});
