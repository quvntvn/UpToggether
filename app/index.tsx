import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { getDailyWakeBuddy } from '@/lib/mockBuddy';
import { buildBuddyStatus } from '@/lib/mockBuddyStatus';
import { buildMockGroupSnapshot, formatGroupStatusLabel } from '@/lib/mockGroupStatus';
import { buildMockFriendReactions } from '@/lib/mockReactions';
import { buildMorningPreview } from '@/lib/mockRanking';
import { colors } from '@/lib/theme';
import { getSavedAlarm, type SavedAlarm } from '@/storage/alarmStorage';
import { getLatestReaction } from '@/storage/reactionsStorage';
import { getWakeResults, type WakeResult } from '@/storage/wakeResultsStorage';
import type { SavedReaction } from '@/types/reaction';
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
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const [alarm, setAlarm] = useState<SavedAlarm | null>(null);
  const [results, setResults] = useState<WakeResult[]>([]);
  const [latestReaction, setLatestReaction] = useState<SavedReaction | null>(null);

  const loadData = useCallback(async () => {
    const [savedAlarm, savedResults, savedLatestReaction] = await Promise.all([
      getSavedAlarm(),
      getWakeResults(),
      getLatestReaction(),
    ]);
    setAlarm(savedAlarm);
    setResults(savedResults);
    setLatestReaction(savedLatestReaction);
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
