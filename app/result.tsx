import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useLanguage } from '@/context/language-context';
import { getBadgeById, getBadgeDescription, getBadgeTitle } from '@/lib/badges';
import { evaluateAndUnlockBadges } from '@/lib/badgeEvaluator';
import { didUserBeatBuddy, evaluateWakeContract } from '@/lib/contracts';
import { getQuickMessageLabel, QUICK_MORNING_MESSAGES } from '@/lib/quickMessages';
import { getDailyWakeBuddy } from '@/lib/mockBuddy';
import { buildBuddyComparison, buildBuddyFeed } from '@/lib/mockBuddyStatus';
import { buildMockGroupSnapshot } from '@/lib/mockGroupStatus';
import { buildMorningFeed, buildTodayRanking } from '@/lib/mockRanking';
import { colors } from '@/lib/theme';
import {
  completeContract,
  failContract,
  getActiveContract,
  updateContractProgress,
} from '@/storage/contractsStorage';
import { getLatestReaction, saveReaction } from '@/storage/reactionsStorage';
import { getWakeResults, type WakeResult } from '@/storage/wakeResultsStorage';
import type { UnlockedBadge } from '@/types/badges';
import type { ActiveWakeContract, WakeContractStatus } from '@/types/contracts';
import { getCurrentStreak } from '@/utils/streak';
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
  const { language } = useLanguage();
  const {
    reactionSeconds: reactionSecondsParam,
    reactionTime: reactionTimeParam,
    percentile: percentileParam,
    saved: savedParam,
    wakeResultId: wakeResultIdParam,
  } = useLocalSearchParams<{
    reactionSeconds?: string;
    reactionTime?: string;
    percentile?: string;
    saved?: string;
    wakeResultId?: string;
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
  const todayDate = useMemo(() => new Date(), []);
  const [selectedQuickMessageId, setSelectedQuickMessageId] = useState<string | null>(null);
  const [hasSentQuickMessage, setHasSentQuickMessage] = useState(false);
  const [activeContract, setActiveContract] = useState<ActiveWakeContract | null>(null);
  const [contractMessage, setContractMessage] = useState<string | null>(null);
  const [contractStatus, setContractStatus] = useState<WakeContractStatus | null>(null);
  const [newlyUnlockedBadges, setNewlyUnlockedBadges] = useState<UnlockedBadge[]>([]);

  useEffect(() => {
    async function loadLatestReaction() {
      const latestReaction = await getLatestReaction();
      const todayKey = new Date().toISOString().slice(0, 10);

      if (!latestReaction || latestReaction.relatedDate !== todayKey) {
        return;
      }

      setSelectedQuickMessageId(latestReaction.quickMessageId);
      setHasSentQuickMessage(true);
    }

    void loadLatestReaction();
  }, []);

  useEffect(() => {
    async function evaluateContractForWakeResult() {
      const currentActiveContract = await getActiveContract();
      setActiveContract(currentActiveContract);

      if (!currentActiveContract || reactionSeconds <= 0) {
        return;
      }

      const wakeResults = await getWakeResults();
      const currentStreak = getCurrentStreak(wakeResults);
      const buddyWon = didUserBeatBuddy(reactionSeconds, todayDate);
      const evaluation = evaluateWakeContract(currentActiveContract, {
        stoppedAt: todayDate.toISOString(),
        scheduledTime: undefined,
        reactionSeconds,
        snoozeCount: 0,
        currentStreak,
        buddyWon,
      });

      if (evaluation.status === 'completed') {
        const updatedContract = await completeContract(evaluation.summary, evaluation.progress);
        setActiveContract(updatedContract ?? currentActiveContract);
      } else if (evaluation.status === 'failed') {
        const updatedContract = await failContract(evaluation.summary, evaluation.progress);
        setActiveContract(updatedContract ?? currentActiveContract);
      } else {
        const updatedContract = await updateContractProgress(evaluation.summary, evaluation.progress);
        setActiveContract(updatedContract ?? currentActiveContract);
      }

      setContractStatus(evaluation.status);
      setContractMessage(evaluation.summary);
    }

    void evaluateContractForWakeResult();
  }, [reactionSeconds, todayDate]);

  useEffect(() => {
    async function evaluateBadgesForWakeResult() {
      if (!wakeResultId || reactionSeconds <= 0) {
        return;
      }

      const wakeResults = await getWakeResults();
      const matchingWakeResult =
        wakeResults.find((result) => result.id === wakeResultId) ??
        ({
          id: wakeResultId,
          date: todayDate.toISOString(),
          scheduledTime: '',
          stoppedAt: todayDate.toISOString(),
          reactionSeconds,
          reactionTime,
          percentile,
          snoozeCount: 0,
          success: true,
        } satisfies WakeResult);
      const unlocked = await evaluateAndUnlockBadges({
        wakeResults,
        latestWakeResult: matchingWakeResult,
      });

      setNewlyUnlockedBadges(unlocked);
    }

    void evaluateBadgesForWakeResult();
  }, [percentile, reactionSeconds, reactionTime, todayDate, wakeResultId]);

  const quickMessages = useMemo(
    () =>
      QUICK_MORNING_MESSAGES.map((message) => ({
        ...message,
        localizedLabel: getQuickMessageLabel(message, language),
      })),
    [language],
  );

  const quickReactionsTitle = language === 'fr' ? 'Réactions rapides' : 'Quick reactions';
  const quickReactionsSubtitle =
    language === 'fr'
      ? 'Partage une vibe du matin avec ta team (simulation locale).'
      : 'Share your morning vibe with your crew (local mock only).';
  const quickReactionsConfirmation =
    language === 'fr' ? 'Message envoyé à Morning Squad.' : 'Message sent to Morning Squad.';
  const contractTitle = language === 'fr' ? 'Wake Contract' : 'Wake Contract';
  const unlockedAchievementsTitle =
    language === 'fr'
      ? newlyUnlockedBadges.length > 1
        ? '🏆 Nouveaux succès débloqués'
        : '🏆 Nouveau succès débloqué'
      : newlyUnlockedBadges.length > 1
        ? '🏆 New achievements unlocked'
        : '🏆 New achievement unlocked';

  const wakeResultId = Array.isArray(wakeResultIdParam) ? wakeResultIdParam[0] : wakeResultIdParam;
  const wakeBuddy = useMemo(() => getDailyWakeBuddy(todayDate), [todayDate]);
  const buddyComparison = useMemo(
    () =>
      buildBuddyComparison({
        date: todayDate,
        hasUserWakeResult: reactionSeconds > 0,
        userReactionSeconds: reactionSeconds,
      }),
    [reactionSeconds, todayDate],
  );
  const buddyFeed = useMemo(() => {
    const latestReactionLine = selectedQuickMessageId
      ? getQuickMessageLabel(
          QUICK_MORNING_MESSAGES.find((message) => message.id === selectedQuickMessageId) ?? QUICK_MORNING_MESSAGES[0],
          language,
        )
      : null;

    return buildBuddyFeed({
      date: todayDate,
      hasUserWakeResult: reactionSeconds > 0,
      userReactionSeconds: reactionSeconds,
      latestReactionLine,
    });
  }, [language, reactionSeconds, selectedQuickMessageId, todayDate]);

  const handleQuickReactionPress = async (quickMessageId: string) => {
    const selectedMessage = QUICK_MORNING_MESSAGES.find((message) => message.id === quickMessageId);

    if (!selectedMessage) {
      return;
    }

    const now = new Date();
    const reactionId = `${now.getTime()}-${quickMessageId}`;

    await saveReaction({
      id: reactionId,
      quickMessageId: selectedMessage.id,
      text: getQuickMessageLabel(selectedMessage, language),
      emoji: selectedMessage.emoji,
      createdAt: now.toISOString(),
      relatedDate: now.toISOString().slice(0, 10),
      relatedWakeResultId: wakeResultId,
      targetGroupId: 'morning-squad',
    });

    setSelectedQuickMessageId(quickMessageId);
    setHasSentQuickMessage(true);
  };

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

        {newlyUnlockedBadges.length > 0 ? (
          <View style={styles.achievementCard}>
            <Text style={styles.achievementTitle}>{unlockedAchievementsTitle}</Text>
            {newlyUnlockedBadges.map((unlockedBadge) => {
              const badge = getBadgeById(unlockedBadge.badgeId);

              if (!badge) {
                return null;
              }

              return (
                <View key={unlockedBadge.badgeId} style={styles.achievementBadge}>
                  <Text style={styles.achievementBadgeTitle}>
                    {badge.emoji ?? '🏅'} {getBadgeTitle(badge, language)}
                  </Text>
                  <Text style={styles.achievementBadgeDescription}>{getBadgeDescription(badge, language)}</Text>
                </View>
              );
            })}
            <Pressable style={styles.achievementButton} onPress={() => router.push('/badges')}>
              <Text style={styles.achievementButtonText}>View all badges</Text>
            </Pressable>
          </View>
        ) : null}

        {activeContract ? (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{contractTitle}</Text>
            <Text style={styles.contractResultTitle}>{activeContract.title}</Text>
            <Text
              style={[
                styles.contractResultStatus,
                contractStatus === 'completed'
                  ? styles.contractStatusCompleted
                  : contractStatus === 'failed'
                    ? styles.contractStatusFailed
                    : styles.contractStatusActive,
              ]}>
              {contractStatus === 'completed'
                ? 'Contract completed ✅'
                : contractStatus === 'failed'
                  ? 'Contract failed ❌'
                  : 'Contract still active ⏳'}
            </Text>
            <Text style={styles.sectionSubtitle}>
              {contractMessage ?? activeContract.progress?.note ?? 'Still active: keep going tomorrow.'}
            </Text>
          </View>
        ) : null}

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



        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Buddy battle</Text>
          {buddyComparison ? (
            <>
              <View style={styles.buddyRow}>
                <Text style={styles.buddyLabel}>You</Text>
                <Text style={styles.buddyValue}>{formatReactionTime(buddyComparison.userReactionSeconds)}</Text>
              </View>
              <View style={styles.buddyRow}>
                <Text style={styles.buddyLabel}>{wakeBuddy.name}</Text>
                <Text style={styles.buddyValue}>{formatReactionTime(buddyComparison.buddyReactionSeconds)}</Text>
              </View>
              <Text style={styles.buddySummary}>Result: {buddyComparison.summary}</Text>
            </>
          ) : (
            <Text style={styles.sectionSubtitle}>Buddy comparison will appear after your wake result.</Text>
          )}

          <View style={styles.feedList}>
            {buddyFeed.slice(0, 2).map((item) => (
              <View key={item.id} style={styles.feedRow}>
                <Text style={styles.feedBullet}>•</Text>
                <Text style={styles.feedText}>
                  {item.author}: {item.message}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{quickReactionsTitle}</Text>
          <Text style={styles.sectionSubtitle}>{quickReactionsSubtitle}</Text>
          <View style={styles.quickMessagesWrap}>
            {quickMessages.map((message) => {
              const isSelected = selectedQuickMessageId === message.id;

              return (
                <Pressable
                  key={message.id}
                  style={[styles.quickMessageChip, isSelected ? styles.quickMessageChipSelected : null]}
                  onPress={() => {
                    void handleQuickReactionPress(message.id);
                  }}>
                  <Text style={styles.quickMessageEmoji}>{message.emoji}</Text>
                  <Text style={[styles.quickMessageText, isSelected ? styles.quickMessageTextSelected : null]}>
                    {message.localizedLabel}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {hasSentQuickMessage ? <Text style={styles.quickReactionConfirmation}>{quickReactionsConfirmation}</Text> : null}
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
  achievementCard: {
    backgroundColor: 'rgba(255, 213, 74, 0.14)',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 22,
    padding: 16,
    marginBottom: 14,
  },
  achievementTitle: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '800',
  },
  achievementBadge: {
    marginTop: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
  },
  achievementBadgeTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  achievementBadgeDescription: {
    color: colors.secondaryText,
    fontSize: 13,
    marginTop: 6,
  },
  achievementButton: {
    marginTop: 12,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  achievementButtonText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '800',
  },
  contractResultTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 6,
  },
  contractResultStatus: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 10,
  },
  contractStatusCompleted: {
    color: colors.success,
  },
  contractStatusFailed: {
    color: '#EF4444',
  },
  contractStatusActive: {
    color: colors.primary,
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

  buddyRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  buddyLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  buddyValue: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  buddySummary: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 12,
  },
  groupStreakText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  quickMessagesWrap: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickMessageChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quickMessageChipSelected: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(255, 213, 74, 0.15)',
  },
  quickMessageEmoji: {
    fontSize: 16,
  },
  quickMessageText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  quickMessageTextSelected: {
    color: colors.primary,
  },
  quickReactionConfirmation: {
    marginTop: 12,
    color: colors.success,
    fontSize: 13,
    fontWeight: '700',
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
