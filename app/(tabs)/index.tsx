import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { buildMorningPreview } from '@/lib/mockRanking';
import { colors } from '@/lib/theme';
import { getNextUpcomingSchedule } from '@/services/alarmScheduler';
import { getAlarmSchedules } from '@/storage/alarmScheduleStorage';
import { getUserProfile } from '@/storage/profileStorage';
import { getWakeResults, type WakeResult } from '@/storage/wakeResultsStorage';
import { WEEKDAY_LABELS, type AlarmSchedule } from '@/types/alarmSchedule';
import { getCurrentStreak } from '@/utils/streak';

export default function HomeTabScreen() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [alarmSchedules, setAlarmSchedules] = useState<AlarmSchedule[]>([]);
  const [results, setResults] = useState<WakeResult[]>([]);

  const loadData = useCallback(async () => {
    const [savedSchedules, savedResults, profile] = await Promise.all([
      getAlarmSchedules(),
      getWakeResults(),
      getUserProfile(),
    ]);

    setAlarmSchedules(savedSchedules);
    setResults(savedResults);
    setDisplayName(profile?.displayName?.trim() ?? '');
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData]),
  );

  const nextUpcoming = useMemo(() => getNextUpcomingSchedule(alarmSchedules, new Date()), [alarmSchedules]);
  const currentStreak = useMemo(() => getCurrentStreak(results), [results]);
  const latestResultSeconds = results.length > 0 ? results[0]?.reactionSeconds ?? 18 : 18;
  const morningPreview = useMemo(() => buildMorningPreview(latestResultSeconds), [latestResultSeconds]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.brand}>UpTogether</Text>
        <Text style={styles.subtitle}>{displayName ? `Good morning, ${displayName}` : 'Your morning dashboard'}</Text>

        <View style={styles.card}>
          <Text style={styles.kicker}>NEXT ALARM</Text>
          {nextUpcoming ? (
            <>
              <Text style={styles.primaryValue}>{nextUpcoming.occurrence.formattedTime}</Text>
              <Text style={styles.secondaryText}>
                {nextUpcoming.schedule.label} · {WEEKDAY_LABELS[nextUpcoming.occurrence.day]}
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.primaryValue}>No alarm</Text>
              <Text style={styles.secondaryText}>Create your first schedule to stay consistent.</Text>
            </>
          )}
          <Pressable style={styles.inlineButton} onPress={() => router.push('/(tabs)/alarms')}>
            <Text style={styles.inlineButtonText}>Manage alarms</Text>
          </Pressable>
        </View>

        <View style={styles.row}>
          <View style={[styles.card, styles.halfCard]}>
            <Text style={styles.kicker}>STREAK</Text>
            <Text style={styles.metricValue}>{currentStreak} days</Text>
            <Text style={styles.secondaryText}>Keep momentum with one clean wake-up tomorrow.</Text>
          </View>

          <View style={[styles.card, styles.halfCard]}>
            <Text style={styles.kicker}>TODAY</Text>
            <Text style={styles.metricValue}>{morningPreview.positionLabel}</Text>
            <Text style={styles.secondaryText}>{morningPreview.message}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.kicker}>QUICK PREVIEWS</Text>
          <Pressable style={styles.quickRow} onPress={() => router.push('/(tabs)/squad')}>
            <Text style={styles.quickTitle}>Morning Squad</Text>
            <Text style={styles.quickSubtitle}>Buddy, friends, and social updates</Text>
          </Pressable>
          <Pressable style={styles.quickRow} onPress={() => router.push('/(tabs)/progress')}>
            <Text style={styles.quickTitle}>Progress</Text>
            <Text style={styles.quickSubtitle}>History, badges, and wake contracts</Text>
          </Pressable>
          <Pressable style={styles.quickRow} onPress={() => router.push('/wake')}>
            <Text style={styles.quickTitle}>Wake challenge</Text>
            <Text style={styles.quickSubtitle}>Jump straight into the alarm challenge flow</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 36, gap: 12 },
  brand: { color: colors.text, fontSize: 32, fontWeight: '800' },
  subtitle: { color: colors.secondaryText, fontSize: 15, marginBottom: 4 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  kicker: { color: colors.primary, fontSize: 12, fontWeight: '700', letterSpacing: 0.9 },
  primaryValue: { color: colors.text, fontSize: 30, fontWeight: '800', marginTop: 8 },
  secondaryText: { color: colors.secondaryText, fontSize: 14, marginTop: 6, lineHeight: 20 },
  inlineButton: {
    alignSelf: 'flex-start',
    marginTop: 12,
    backgroundColor: 'rgba(255, 213, 74, 0.14)',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  inlineButtonText: { color: colors.primary, fontWeight: '700' },
  row: { flexDirection: 'row', gap: 12 },
  halfCard: { flex: 1 },
  metricValue: { color: colors.text, fontSize: 24, fontWeight: '800', marginTop: 8 },
  quickRow: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 12,
    marginTop: 10,
    backgroundColor: colors.background,
  },
  quickTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  quickSubtitle: { color: colors.mutedText, fontSize: 13, marginTop: 4 },
});
