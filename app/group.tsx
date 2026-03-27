import { Stack, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { buildMockGroupSnapshot, formatGroupStatusLabel } from '@/lib/mockGroupStatus';
import { colors } from '@/lib/theme';
import { getWakeResults, type WakeResult } from '@/storage/wakeResultsStorage';
import { formatReactionTime } from '@/utils/time';

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

export default function GroupScreen() {
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

  const todaysWakeResult = useMemo(() => {
    const todayKey = new Date().toISOString().slice(0, 10);
    return results.find((result) => result.stoppedAt.slice(0, 10) === todayKey);
  }, [results]);

  const snapshot = useMemo(
    () =>
      buildMockGroupSnapshot({
        userReactionSeconds: todaysWakeResult?.reactionSeconds,
        hasUserWakeResult: Boolean(todaysWakeResult),
      }),
    [todaysWakeResult],
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Morning Squad' }} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{snapshot.groupName}</Text>
        <Text style={styles.subtitle}>Shared wake-up progress for today (local mock simulation).</Text>

        <View style={styles.streakCard}>
          <Text style={styles.kicker}>GROUP STREAK</Text>
          <Text style={styles.streakValue}>{snapshot.streakDays} days</Text>
          <Text style={styles.streakRule}>{snapshot.streakRule}</Text>
          <Text style={styles.positionLabel}>You are currently {toOrdinal(snapshot.userPosition)} in the group.</Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Today&apos;s ranking</Text>
          <Text style={styles.sectionSubtitle}>{snapshot.awakeCount} members are already awake.</Text>

          <View style={styles.memberList}>
            {snapshot.members.map((member) => (
              <View key={member.id} style={[styles.memberRow, member.isUser ? styles.userRow : null]}>
                <Text style={[styles.rankValue, member.isUser ? styles.userText : null]}>{member.rank}</Text>
                <Text style={styles.avatar}>{member.avatar}</Text>

                <View style={styles.memberBody}>
                  <Text style={[styles.memberName, member.isUser ? styles.userText : null]}>{member.name}</Text>
                  <Text style={styles.memberStatus}>{formatGroupStatusLabel(member)}</Text>
                </View>

                <Text style={[styles.memberReaction, member.isUser ? styles.userText : null]}>
                  {member.status === 'awake' && typeof member.reactionSeconds === 'number'
                    ? formatReactionTime(member.reactionSeconds)
                    : '--'}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Squad feed</Text>
          <View style={styles.feedList}>
            {snapshot.feed.map((item) => (
              <View key={item.id} style={styles.feedRow}>
                <Text style={styles.feedBullet}>•</Text>
                <Text style={styles.feedText}>{item.message}</Text>
              </View>
            ))}
          </View>
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
  title: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.secondaryText,
    fontSize: 15,
    marginTop: 8,
    marginBottom: 16,
  },
  streakCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    marginBottom: 14,
  },
  kicker: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  streakValue: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '800',
    marginTop: 8,
  },
  streakRule: {
    color: colors.secondaryText,
    fontSize: 14,
    marginTop: 8,
  },
  positionLabel: {
    color: colors.primary,
    fontSize: 14,
    marginTop: 12,
    fontWeight: '700',
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
  sectionSubtitle: {
    color: colors.secondaryText,
    fontSize: 13,
    marginTop: 4,
    marginBottom: 12,
  },
  memberList: {
    gap: 10,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  userRow: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(255, 213, 74, 0.12)',
  },
  rankValue: {
    width: 24,
    color: colors.secondaryText,
    fontSize: 16,
    fontWeight: '800',
  },
  avatar: {
    fontSize: 20,
    marginRight: 10,
  },
  memberBody: {
    flex: 1,
  },
  memberName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  memberStatus: {
    color: colors.mutedText,
    fontSize: 13,
    marginTop: 3,
  },
  memberReaction: {
    color: colors.secondaryText,
    fontSize: 14,
    fontWeight: '700',
  },
  userText: {
    color: colors.primary,
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
    width: 16,
    lineHeight: 20,
  },
  feedText: {
    color: colors.secondaryText,
    flex: 1,
    fontSize: 14,
  },
});
