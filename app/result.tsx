import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { buildMockGroupSnapshot } from '@/lib/mockGroupStatus';
import { buildMorningFeed, buildTodayRanking } from '@/lib/mockRanking';
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

function toOrdinal(value: number) {
  if (value % 10 === 1 && value % 100 !== 11) {
    return `${value}st`;
  }

  if (value % 10 === 2 && value % 100 !== 12) {
    return `${value}nd`;
  }

  if (value % 10 === 3 && value % 100 !== 13) {
    return `${value}rd`;
  }

  return `${value}th`;
}

export default function ResultScreen() {
  const router = useRouter();
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

  const ranking = useMemo(() => buildTodayRanking(reactionSeconds), [reactionSeconds]);
  const feed = useMemo(() => buildMorningFeed(ranking), [ranking]);
  const morningSquad = useMemo(
    () =>
      buildMockGroupSnapshot({
        userReactionSeconds: reactionSeconds,
        hasUserWakeResult: reactionSeconds > 0,
      }),
    [reactionSeconds],
  );

  const userRank = ranking.find((entry) => entry.isUser)?.rank ?? ranking.length;
  const friendCount = Math.max(0, ranking.length - 1);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Wake Result' }} />

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.kicker}>WAKE RESULT</Text>
        <Text style={styles.title}>{formatReactionTime(reactionSeconds)}</Text>
        {reactionTime > 0 ? <Text style={styles.subTitleMs}>{formatReactionMilliseconds(reactionTime)}</Text> : null}
        <Text style={styles.subtitle}>Reaction time</Text>

        <View style={styles.heroCard}>
          <Text style={styles.percentile}>{percentile}th percentile</Text>
          <Text style={styles.helper}>Faster than {percentile}% of users</Text>
          {wasSaved ? <Text style={styles.savedText}>Saved to your history.</Text> : null}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Today&apos;s ranking</Text>
          <Text style={styles.sectionSubtitle}>You finished {userRank} out of {friendCount + 1} total wake-ups.</Text>

          <View style={styles.rankList}>
            {ranking.map((entry) => (
              <View key={entry.id} style={[styles.rankRow, entry.isUser ? styles.userRankRow : null]}>
                <Text style={[styles.rankNumber, entry.isUser ? styles.userRankText : null]}>{entry.rank}</Text>
                <Text style={styles.rankAvatar}>{entry.avatar}</Text>

                <View style={styles.rankBody}>
                  <Text style={[styles.rankName, entry.isUser ? styles.userRankText : null]}>{entry.name}</Text>
                  <Text style={styles.rankStatus}>{entry.status}</Text>
                </View>

                <Text style={[styles.rankTime, entry.isUser ? styles.userRankTime : null]}>
                  {formatReactionTime(entry.reactionSeconds)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Morning feed</Text>
          <View style={styles.feedList}>
            {feed.map((item) => (
              <View key={item.id} style={styles.feedRow}>
                <Text style={styles.feedBullet}>•</Text>
                <Text style={styles.feedText}>{item.message}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Morning Squad</Text>
          <Text style={styles.sectionSubtitle}>You finished {toOrdinal(morningSquad.userPosition)} in {morningSquad.groupName}</Text>
          <Text style={styles.groupStreakText}>
            Group streak: {morningSquad.streakDays} days · {morningSquad.streakRule}
          </Text>
        </View>

        <View style={styles.actions}>
          <Pressable style={styles.primaryButton} onPress={() => router.replace('/')}>
            <Text style={styles.primaryButtonText}>Back Home</Text>
          </Pressable>

          <Pressable style={styles.secondaryButton} onPress={() => router.push('/history')}>
            <Text style={styles.secondaryButtonText}>View History</Text>
          </Pressable>
        </View>
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
    paddingBottom: 36,
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
    marginBottom: 18,
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
  sectionCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    padding: 18,
    marginBottom: 14,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '800',
  },
  sectionSubtitle: {
    color: colors.secondaryText,
    fontSize: 14,
    marginTop: 6,
    marginBottom: 14,
  },
  rankList: {
    gap: 10,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  userRankRow: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(255, 213, 74, 0.12)',
  },
  rankNumber: {
    color: colors.secondaryText,
    width: 26,
    fontSize: 16,
    fontWeight: '700',
  },
  rankAvatar: {
    fontSize: 20,
    marginRight: 10,
  },
  rankBody: {
    flex: 1,
  },
  rankName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  rankStatus: {
    color: colors.mutedText,
    fontSize: 13,
    marginTop: 3,
  },
  rankTime: {
    color: colors.secondaryText,
    fontSize: 14,
    fontWeight: '700',
  },
  userRankText: {
    color: colors.primary,
  },
  userRankTime: {
    color: colors.primary,
    fontWeight: '800',
  },
  feedList: {
    gap: 8,
    marginTop: 12,
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
    lineHeight: 21,
  },
  groupStreakText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  actions: {
    gap: 12,
    marginTop: 6,
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
