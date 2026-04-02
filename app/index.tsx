import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { getDailyWakeBuddy } from '@/lib/mockBuddy';
import { BADGE_CATALOG, getBadgeById, getBadgeTitle } from '@/lib/badges';
import { buildBuddyStatus } from '@/lib/mockBuddyStatus';
import { buildMockGroupSnapshot, formatGroupStatusLabel } from '@/lib/mockGroupStatus';
import { buildMockFriendReactions } from '@/lib/mockReactions';
import { buildMorningPreview } from '@/lib/mockRanking';
import { getOnboardingGoals } from '@/lib/onboardingGoals';
import { colors } from '@/lib/theme';
import { useLanguage } from '@/context/language-context';
import { syncWeeklyAlarmSchedule } from '@/services/alarmScheduleManager';
import { getEnabledDaysSummary, getNextAlarmOccurrenceRespectingSkip } from '@/services/alarmScheduler';
import {
  getAlarmSchedule,
  setSkipNextOccurrence,
  toggleScheduleEnabled,
} from '@/storage/alarmScheduleStorage';
import { getLatestUnlockedBadge, getUnlockedBadges } from '@/storage/badgesStorage';
import { getActiveContract, getContractHistory } from '@/storage/contractsStorage';
import { getLatestReaction } from '@/storage/reactionsStorage';
import { getUserProfile } from '@/storage/profileStorage';
import { getWakeResults, type WakeResult } from '@/storage/wakeResultsStorage';
import type { ActiveWakeContract } from '@/types/contracts';
import type { SavedReaction } from '@/types/reaction';
import type { UnlockedBadge } from '@/types/badges';
import { WEEKDAY_LABELS, type WeeklyAlarmSchedule } from '@/types/alarmSchedule';
import { getBestStreak, getCurrentStreak } from '@/utils/streak';
import { formatReactionTime, getAverageReactionSeconds } from '@/utils/time';

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

export default function HomeScreen() {
  const router = useRouter();
  const { language, t } = useLanguage();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const [alarm, setAlarm] = useState<WeeklyAlarmSchedule | null>(null);
  const [results, setResults] = useState<WakeResult[]>([]);
  const [latestReaction, setLatestReaction] = useState<SavedReaction | null>(null);
  const [activeContract, setActiveContract] = useState<ActiveWakeContract | null>(null);
  const [latestContractOutcome, setLatestContractOutcome] = useState<ActiveWakeContract | null>(null);
  const [goalHelperText, setGoalHelperText] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>('');
  const [unlockedBadges, setUnlockedBadges] = useState<UnlockedBadge[]>([]);
  const [latestUnlockedBadgeId, setLatestUnlockedBadgeId] = useState<string | null>(null);

  const goalDefinitions = useMemo(() => getOnboardingGoals(t), [t]);

  const loadData = useCallback(async () => {
    const [savedAlarm, savedResults, savedLatestReaction, savedActiveContract, contractHistory, profile, badges, latestBadge] =
      await Promise.all([
        getAlarmSchedule(),
        getWakeResults(),
        getLatestReaction(),
        getActiveContract(),
        getContractHistory(),
        getUserProfile(),
        getUnlockedBadges(),
        getLatestUnlockedBadge(),
      ]);
    setAlarm(savedAlarm);
    setResults(savedResults);
    setLatestReaction(savedLatestReaction);
    setActiveContract(savedActiveContract);
    setLatestContractOutcome(contractHistory[0] ?? null);
    setDisplayName(profile?.displayName?.trim() ?? '');
    setUnlockedBadges(badges);
    setLatestUnlockedBadgeId(latestBadge?.badgeId ?? null);

    if (profile?.selectedGoalId) {
      const goal = goalDefinitions.find((item) => item.id === profile.selectedGoalId);
      setGoalHelperText(goal?.helperText ?? null);
      return;
    }

    setGoalHelperText(null);
  }, [goalDefinitions]);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData]),
  );

  const nextOccurrence = useMemo(() => {
    if (!alarm) {
      return null;
    }

    return getNextAlarmOccurrenceRespectingSkip(alarm, new Date());
  }, [alarm]);

  const enabledDaysSummary = useMemo(() => {
    if (!alarm) {
      return [] as string[];
    }

    return getEnabledDaysSummary(alarm).map((day) => WEEKDAY_LABELS[day]);
  }, [alarm]);

  const nextOccurrenceLabel = useMemo(() => {
    if (!nextOccurrence) {
      return null;
    }

    return `${WEEKDAY_LABELS[nextOccurrence.day]} at ${nextOccurrence.formattedTime}`;
  }, [nextOccurrence]);

  const currentStreak = useMemo(() => getCurrentStreak(results), [results]);
  const bestStreak = useMemo(() => getBestStreak(results), [results]);
  const averageReactionSeconds = useMemo(
    () => getAverageReactionSeconds(results.map((result) => result.reactionSeconds)),
    [results],
  );

  const latestResultSeconds = results.length > 0 ? results[0]?.reactionSeconds ?? 18 : 18;
  const morningPreview = useMemo(() => buildMorningPreview(latestResultSeconds), [latestResultSeconds]);
  const todaysWakeResult = useMemo(() => {
    const todayKey = new Date().toISOString().slice(0, 10);
    return results.find((result) => result.stoppedAt.slice(0, 10) === todayKey);
  }, [results]);
  const morningSquadSnapshot = useMemo(
    () =>
      buildMockGroupSnapshot({
        userReactionSeconds: todaysWakeResult?.reactionSeconds,
        hasUserWakeResult: Boolean(todaysWakeResult),
      }),
    [todaysWakeResult],
  );
  const userGroupStatus = morningSquadSnapshot.members.find((member) => member.isUser);
  const topStatuses = morningSquadSnapshot.members.filter((member) => !member.isUser).slice(0, 2);
  const friendReactions = useMemo(() => buildMockFriendReactions(new Date()), []);
  const wakeBuddy = useMemo(() => getDailyWakeBuddy(new Date()), []);
  const buddyStatus = useMemo(
    () =>
      buildBuddyStatus({
        hasUserWakeResult: Boolean(todaysWakeResult),
        userReactionSeconds: todaysWakeResult?.reactionSeconds,
        userSnoozeCount: todaysWakeResult?.snoozeCount ?? 0,
      }),
    [todaysWakeResult],
  );

  const socialPreviewFeed = useMemo(() => {
    const todayKey = new Date().toISOString().slice(0, 10);
    const userReactionLine =
      latestReaction && latestReaction.relatedDate === todayKey
        ? `You: ${latestReaction.text} ${latestReaction.emoji}`
        : null;
    const friendLine = friendReactions[0]
      ? `${friendReactions[0].name}: ${friendReactions[0].message}${friendReactions[0].emoji ? ` ${friendReactions[0].emoji}` : ''}`
      : null;

    return [userReactionLine, friendLine].filter((item): item is string => Boolean(item));
  }, [friendReactions, latestReaction]);

  const activeContractStatusLabel = useMemo(() => {
    if (!activeContract) {
      return 'No active contract';
    }

    if (activeContract.status === 'completed') {
      return 'Completed ✅';
    }

    if (activeContract.status === 'failed') {
      return 'Failed ❌';
    }

    return 'Active ⏳';
  }, [activeContract]);

  const latestUnlockedBadgeDefinition = useMemo(() => {
    if (!latestUnlockedBadgeId) {
      return null;
    }
    return getBadgeById(latestUnlockedBadgeId);
  }, [latestUnlockedBadgeId]);
  const unlockedBadgeProgress = Math.round((unlockedBadges.length / BADGE_CATALOG.length) * 100);


  const handleToggleScheduleEnabled = async () => {
    if (!alarm) {
      return;
    }

    const updated = await toggleScheduleEnabled(!alarm.enabled);
    const { schedule } = await syncWeeklyAlarmSchedule(updated);
    setAlarm(schedule);
  };

  const handleSkipNext = async () => {
    if (!alarm || !alarm.enabled) {
      return;
    }

    const updated = await setSkipNextOccurrence(true);
    const { schedule } = await syncWeeklyAlarmSchedule(updated);
    setAlarm(schedule);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            minHeight: windowHeight - insets.top - insets.bottom,
            paddingBottom: insets.bottom + 28,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.hero}>
            <Text style={styles.brand}>UpTogether</Text>
            <Text style={styles.slogan}>Don&apos;t wake up alone.</Text>
          </View>

          {goalHelperText ? (
            <View style={styles.goalCard}>
              <Text style={styles.goalKicker}>{displayName ? `Hey ${displayName},` : "Today's mission"}</Text>
              <Text style={styles.goalHelperText}>{goalHelperText}</Text>
            </View>
          ) : null}

          <View style={styles.card}>
            <Text style={styles.cardLabel}>Alarm schedule</Text>
            {!alarm ? (
              <>
                <Text style={styles.placeholderTitle}>No alarm saved yet</Text>
                <Text style={styles.cardInfo}>Set your first wake-up to keep your mornings on track.</Text>
              </>
            ) : !alarm.enabled ? (
              <>
                <Text style={styles.placeholderTitle}>Schedule disabled</Text>
                <Text style={styles.cardInfo}>No active alarms until you re-enable this schedule.</Text>
              </>
            ) : nextOccurrenceLabel ? (
              <>
                <Text style={styles.cardTime}>{nextOccurrence?.formattedTime}</Text>
                <Text style={styles.cardInfo}>Next alarm: {nextOccurrenceLabel}</Text>
                <Text style={styles.cardInfo}>Active days: {enabledDaysSummary.join(', ') || 'None'}</Text>
                {alarm.skipNextOccurrence ? (
                  <Text style={styles.skipInfo}>Next occurrence will be skipped once.</Text>
                ) : null}
              </>
            ) : (
              <>
                <Text style={styles.placeholderTitle}>No active alarms</Text>
                <Text style={styles.cardInfo}>Enable at least one day to schedule alarms.</Text>
              </>
            )}

            {alarm ? (
              <View style={styles.alarmActionsRow}>
                <Pressable style={styles.cardActionButton} onPress={() => void handleToggleScheduleEnabled()}>
                  <Text style={styles.cardActionText}>{alarm.enabled ? 'Disable schedule' : 'Enable schedule'}</Text>
                </Pressable>
                <Pressable
                  style={[styles.cardActionButton, (!alarm.enabled || alarm.skipNextOccurrence) && styles.cardActionButtonDisabled]}
                  onPress={() => void handleSkipNext()}
                  disabled={!alarm.enabled || alarm.skipNextOccurrence}>
                  <Text style={styles.cardActionText}>Skip next alarm</Text>
                </Pressable>
              </View>
            ) : null}
          </View>

          <Pressable style={styles.primaryButton} onPress={() => router.push('/set-alarm')}>
            <Text style={styles.primaryButtonText}>Set Weekly Alarm</Text>
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

          <Pressable style={styles.contractCard} onPress={() => router.push('/contracts')}>
            <View style={styles.contractHeader}>
              <Text style={styles.contractKicker}>Wake Contract</Text>
              <Text style={styles.contractLink}>Open</Text>
            </View>
            {activeContract ? (
              <>
                <Text style={styles.contractTitle}>{activeContract.title}</Text>
                <Text style={styles.contractDetail}>Target: {new Date(activeContract.targetDate).toLocaleDateString('en-US')}</Text>
                <Text style={styles.contractStatus}>Status: {activeContractStatusLabel}</Text>
                {activeContract.progress?.note ? <Text style={styles.contractDetail}>{activeContract.progress.note}</Text> : null}
              </>
            ) : (
              <>
                <Text style={styles.contractTitle}>Set a wake contract</Text>
                <Text style={styles.contractDetail}>Choose one promise for tomorrow and stay accountable.</Text>
              </>
            )}
            {!activeContract && latestContractOutcome ? (
              <Text style={styles.contractHistoryNote}>
                Last outcome: {latestContractOutcome.title} ({latestContractOutcome.status})
              </Text>
            ) : null}
          </Pressable>

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

          <Pressable style={styles.achievementsCard} onPress={() => router.push('/badges')}>
            <View style={styles.achievementHeader}>
              <Text style={styles.achievementTitle}>Achievements</Text>
              <Text style={styles.achievementLink}>Open</Text>
            </View>
            <Text style={styles.achievementCount}>{unlockedBadges.length} unlocked</Text>
            <Text style={styles.achievementLatest}>
              Latest:{' '}
              {latestUnlockedBadgeDefinition ? getBadgeTitle(latestUnlockedBadgeDefinition, language) : 'Unlock your first badge'}
            </Text>
            <Text style={styles.achievementLatest}>{unlockedBadgeProgress}% complete</Text>
          </Pressable>

          <View style={styles.socialPreviewCard}>
            <Text style={styles.socialTitle}>Morning Crew</Text>
            <Text style={styles.socialSubtitle}>Today&apos;s mock social check-in and quick reactions.</Text>

            <View style={styles.previewList}>
              {(socialPreviewFeed.length > 0 ? socialPreviewFeed : morningPreview.map((item) => item.message)).map((line, index) => (
                <View key={`social-line-${index}`} style={styles.previewRow}>
                  <Text style={styles.previewBullet}>•</Text>
                  <Text style={styles.previewText}>{line}</Text>
                </View>
              ))}
            </View>

            <Pressable style={styles.previewButton} onPress={() => router.push('/friends')}>
              <Text style={styles.previewButtonText}>Open Friends</Text>
            </Pressable>
          </View>



          <Pressable style={styles.buddyCard} onPress={() => router.push('/buddy')}>
            <View style={styles.buddyHeader}>
              <View>
                <Text style={styles.buddyTitle}>Wake Buddy</Text>
                <Text style={styles.buddyName}>{wakeBuddy.name}</Text>
              </View>
              <Text style={styles.buddyAvatar}>{wakeBuddy.avatar}</Text>
            </View>
            <Text style={styles.buddyStatus}>{buddyStatus.shortLabel}</Text>
            <Text style={styles.buddyHint}>{buddyStatus.accountabilityText}</Text>
            <View style={styles.buddyButton}>
              <Text style={styles.buddyButtonText}>Open Buddy</Text>
            </View>
          </Pressable>

          <Pressable style={styles.groupCard} onPress={() => router.push('/group')}>
            <View style={styles.groupHeader}>
              <Text style={styles.groupTitle}>{morningSquadSnapshot.groupName}</Text>
              <Text style={styles.groupStreak}>Streak: {morningSquadSnapshot.streakDays} days</Text>
            </View>
            <Text style={styles.groupSubtitle}>Don&apos;t wake up alone.</Text>

            <View style={styles.previewList}>
              {topStatuses.map((member) => (
                <View key={member.id} style={styles.previewRow}>
                  <Text style={styles.previewBullet}>•</Text>
                  <Text style={styles.previewText}>
                    {member.name} is {formatGroupStatusLabel(member).toLowerCase()}
                  </Text>
                </View>
              ))}
              <View style={styles.previewRow}>
                <Text style={styles.previewBullet}>•</Text>
                <Text style={styles.previewText}>
                  You are currently {toOrdinal(morningSquadSnapshot.userPosition)}{' '}
                  {userGroupStatus?.status === 'awake' ? 'today' : 'in the queue'}
                </Text>
              </View>
            </View>

            <View style={styles.groupButton}>
              <Text style={styles.groupButtonText}>Open Morning Squad</Text>
            </View>
          </Pressable>

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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  content: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
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
  goalCard: {
    backgroundColor: 'rgba(255, 213, 74, 0.12)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary,
    padding: 18,
    marginBottom: 14,
  },
  goalKicker: {
    color: colors.mutedText,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '700',
  },
  goalHelperText: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 6,
  },
  statsCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    marginBottom: 16,
  },
  contractCard: {
    backgroundColor: colors.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.primary,
    padding: 18,
    marginTop: 14,
    marginBottom: 16,
  },
  contractHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contractKicker: {
    color: colors.mutedText,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  contractLink: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  contractTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    marginTop: 8,
  },
  contractDetail: {
    color: colors.secondaryText,
    fontSize: 14,
    marginTop: 6,
  },
  contractStatus: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 6,
  },
  contractHistoryNote: {
    color: colors.mutedText,
    fontSize: 12,
    marginTop: 10,
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
  skipInfo: {
    color: colors.primary,
    marginTop: 10,
    fontSize: 13,
    fontWeight: '700',
  },
  alarmActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  cardActionButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
    alignItems: 'center',
  },
  cardActionButtonDisabled: {
    opacity: 0.5,
  },
  cardActionText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
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
  achievementsCard: {
    backgroundColor: colors.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.primary,
    padding: 18,
    marginBottom: 20,
  },
  achievementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  achievementTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  achievementLink: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  achievementCount: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: '800',
    marginTop: 10,
  },
  achievementLatest: {
    color: colors.secondaryText,
    fontSize: 14,
    marginTop: 8,
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

  buddyCard: {
    backgroundColor: colors.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    marginBottom: 20,
  },
  buddyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buddyTitle: {
    color: colors.mutedText,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '700',
  },
  buddyName: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    marginTop: 4,
  },
  buddyAvatar: {
    fontSize: 30,
  },
  buddyStatus: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 12,
  },
  buddyHint: {
    color: colors.secondaryText,
    fontSize: 14,
    marginTop: 6,
  },
  buddyButton: {
    marginTop: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: 'rgba(255, 213, 74, 0.14)',
    paddingVertical: 12,
    alignItems: 'center',
  },
  buddyButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  groupCard: {
    backgroundColor: colors.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    marginBottom: 20,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  groupTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    flex: 1,
  },
  groupStreak: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  groupSubtitle: {
    color: colors.secondaryText,
    fontSize: 13,
    marginTop: 4,
  },
  groupButton: {
    marginTop: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: 'rgba(255, 213, 74, 0.14)',
    paddingVertical: 12,
    alignItems: 'center',
  },
  groupButtonText: {
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
