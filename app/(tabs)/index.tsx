import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useLanguage } from '@/context/language-context';
import { buildMorningPreview } from '@/lib/mockRanking';
import { colors } from '@/lib/theme';
import { getNextUpcomingSchedule } from '@/services/alarmScheduler';
import { getAlarmSchedules } from '@/storage/alarmScheduleStorage';
import { getUserProfile } from '@/storage/profileStorage';
import { getWakeResults, type WakeResult } from '@/storage/wakeResultsStorage';
import { getWeekdayLabel, type AlarmSchedule } from '@/types/alarmSchedule';
import { getCurrentStreak } from '@/utils/streak';

export default function HomeTabScreen() {
  const router = useRouter();
  const { language } = useLanguage();
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
  const morningPreview = useMemo(() => buildMorningPreview(latestResultSeconds, new Date(), language), [language, latestResultSeconds]);

  const copy =
    language === 'fr'
      ? {
          subtitle: displayName ? `Bonjour, ${displayName}` : 'Ton tableau de bord du matin',
          webBanner: 'Les notifications fonctionnent uniquement sur mobile',
          nextAlarm: 'PROCHAIN RÉVEIL',
          noAlarm: 'Aucune alarme',
          noAlarmBody: 'Crée ta première programmation pour rester régulier.',
          manageAlarms: 'Gérer les alarmes',
          streak: 'SÉRIE',
          streakValue: `${currentStreak} jour${currentStreak > 1 ? 's' : ''}`,
          streakBody: 'Garde ton élan avec un réveil propre demain.',
          today: 'AUJOURD’HUI',
          quickPreviews: 'APERÇUS RAPIDES',
          squadTitle: 'Morning Squad',
          squadBody: 'Buddy, amis et mises à jour sociales',
          progressTitle: 'Progrès',
          progressBody: 'Historique, badges et contrats de réveil',
          wakeTitle: 'Défi réveil',
          wakeBody: 'Lance directement le parcours de réveil',
        }
      : {
          subtitle: displayName ? `Good morning, ${displayName}` : 'Your morning dashboard',
          webBanner: 'Notifications only work on mobile',
          nextAlarm: 'NEXT ALARM',
          noAlarm: 'No alarm',
          noAlarmBody: 'Create your first schedule to stay consistent.',
          manageAlarms: 'Manage alarms',
          streak: 'STREAK',
          streakValue: `${currentStreak} day${currentStreak === 1 ? '' : 's'}`,
          streakBody: 'Keep momentum with one clean wake-up tomorrow.',
          today: 'TODAY',
          quickPreviews: 'QUICK PREVIEWS',
          squadTitle: 'Morning Squad',
          squadBody: 'Buddy, friends, and social updates',
          progressTitle: 'Progress',
          progressBody: 'History, badges, and wake contracts',
          wakeTitle: 'Wake challenge',
          wakeBody: 'Jump straight into the alarm challenge flow',
        };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.brand}>UpTogether</Text>
        <Text style={styles.subtitle}>{copy.subtitle}</Text>

        {Platform.OS === 'web' ? (
          <View style={styles.webBanner}>
            <Text style={styles.webBannerText}>{copy.webBanner}</Text>
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.kicker}>{copy.nextAlarm}</Text>
          {nextUpcoming ? (
            <>
              <Text style={styles.primaryValue}>{nextUpcoming.occurrence.formattedTime}</Text>
              <Text style={styles.secondaryText}>
                {nextUpcoming.schedule.label} · {getWeekdayLabel(nextUpcoming.occurrence.day, language)}
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.primaryValue}>{copy.noAlarm}</Text>
              <Text style={styles.secondaryText}>{copy.noAlarmBody}</Text>
            </>
          )}
          <Pressable style={styles.inlineButton} onPress={() => router.push('/(tabs)/alarms')}>
            <Text style={styles.inlineButtonText}>{copy.manageAlarms}</Text>
          </Pressable>
        </View>

        <View style={styles.row}>
          <View style={[styles.card, styles.halfCard]}>
            <Text style={styles.kicker}>{copy.streak}</Text>
            <Text style={styles.metricValue}>{copy.streakValue}</Text>
            <Text style={styles.secondaryText}>{copy.streakBody}</Text>
          </View>

          <View style={[styles.card, styles.halfCard]}>
            <Text style={styles.kicker}>{copy.today}</Text>
            <Text style={styles.metricValue}>{morningPreview.positionLabel}</Text>
            <Text style={styles.secondaryText}>{morningPreview.message}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.kicker}>{copy.quickPreviews}</Text>
          <Pressable style={styles.quickRow} onPress={() => router.push('/(tabs)/squad')}>
            <Text style={styles.quickTitle}>{copy.squadTitle}</Text>
            <Text style={styles.quickSubtitle}>{copy.squadBody}</Text>
          </Pressable>
          <Pressable style={styles.quickRow} onPress={() => router.push('/(tabs)/progress')}>
            <Text style={styles.quickTitle}>{copy.progressTitle}</Text>
            <Text style={styles.quickSubtitle}>{copy.progressBody}</Text>
          </Pressable>
          <Pressable style={styles.quickRow} onPress={() => router.push('/wake')}>
            <Text style={styles.quickTitle}>{copy.wakeTitle}</Text>
            <Text style={styles.quickSubtitle}>{copy.wakeBody}</Text>
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
  webBanner: {
    backgroundColor: 'rgba(255, 213, 74, 0.12)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 213, 74, 0.35)',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  webBannerText: { color: colors.primary, fontSize: 13, fontWeight: '700' },
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
