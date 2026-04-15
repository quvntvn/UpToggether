import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useLanguage } from '@/context/language-context';
import { colors } from '@/lib/theme';
import { formatAlarmTime } from '@/services/alarm';
import { getEnabledDaysSummary, getNextAlarmOccurrenceRespectingSkip } from '@/services/alarmScheduler';
import { syncAlarmSchedules } from '@/services/alarmScheduleManager';
import {
  createAlarmSchedule,
  getAlarmSchedules,
  skipNextAlarmOccurrence,
  toggleAlarmScheduleEnabled,
} from '@/storage/alarmScheduleStorage';
import { getWeekdayLabel, type AlarmSchedule } from '@/types/alarmSchedule';

export default function AlarmsTabScreen() {
  const router = useRouter();
  const { language } = useLanguage();
  const [schedules, setSchedules] = useState<AlarmSchedule[]>([]);

  const loadSchedules = useCallback(async () => {
    setSchedules(await getAlarmSchedules());
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadSchedules();
    }, [loadSchedules]),
  );

  const copy =
    language === 'fr'
      ? {
          labelPresets: ['Boulot', 'Salle', 'Études', 'Week-end', 'Perso'],
          fallbackLabel: 'Réveil',
          customLabel: 'Perso',
          customAlarmLabel: 'Réveil perso',
          countLabel: `${schedules.length} alarme${schedules.length > 1 ? 's' : ''}`,
          sectionTitle: 'Programmations d’alarme',
          helperText: 'Crée, modifie, saute la prochaine occurrence ou active chaque programmation en un instant.',
          noActiveDays: 'Aucun jour actif',
          skippedOnce: 'Prochaine occurrence sautée une fois',
          disable: 'Désactiver',
          enable: 'Activer',
          skipNext: 'Sauter la prochaine',
          create: 'Créer une programmation',
        }
      : {
          labelPresets: ['Work', 'Gym', 'Study', 'Weekend', 'Custom'],
          fallbackLabel: 'Alarm',
          customLabel: 'Custom',
          customAlarmLabel: 'Custom Alarm',
          countLabel: `${schedules.length} alarm${schedules.length === 1 ? '' : 's'}`,
          sectionTitle: 'Alarm schedules',
          helperText: 'Create, edit, skip-next, and toggle each schedule instantly.',
          noActiveDays: 'No active days',
          skippedOnce: 'Next occurrence skipped once',
          disable: 'Disable',
          enable: 'Enable',
          skipNext: 'Skip next',
          create: 'Create new schedule',
        };

  const handleCreate = async () => {
    const defaultLabel = copy.labelPresets[schedules.length % copy.labelPresets.length] ?? copy.fallbackLabel;
    const created = await createAlarmSchedule(defaultLabel === copy.customLabel ? copy.customAlarmLabel : defaultLabel);
    await syncAlarmSchedules();
    router.push({ pathname: '/alarm/[id]', params: { id: created.id } });
  };

  const handleToggleEnabled = async (scheduleId: string) => {
    await toggleAlarmScheduleEnabled(scheduleId);
    await syncAlarmSchedules();
    await loadSchedules();
  };

  const handleSkipNext = async (scheduleId: string) => {
    await skipNextAlarmOccurrence(scheduleId);
    await syncAlarmSchedules();
    await loadSchedules();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.topCard}>
          <Text style={styles.sectionTitle}>{copy.sectionTitle}</Text>
          <Text style={styles.helperText}>{copy.helperText}</Text>
          <Text style={styles.countLabel}>{copy.countLabel}</Text>
        </View>

        {schedules.map((schedule) => {
          const days = getEnabledDaysSummary(schedule)
            .map((day) => getWeekdayLabel(day, language))
            .join(' ');
          const next = getNextAlarmOccurrenceRespectingSkip(schedule);
          const displayTime = next ? next.formattedTime : formatAlarmTime(schedule.hour, schedule.minute);

          return (
            <Pressable
              key={schedule.id}
              style={[styles.scheduleCard, !schedule.enabled && styles.disabledCard]}
              onPress={() => router.push({ pathname: '/alarm/[id]', params: { id: schedule.id } })}>
              <Text style={styles.scheduleTitle}>{schedule.label}</Text>
              <Text style={styles.scheduleSummary}>
                {days || copy.noActiveDays} — {displayTime}
              </Text>
              {schedule.skipNextOccurrence ? <Text style={styles.skipInfo}>{copy.skippedOnce}</Text> : null}

              <View style={styles.rowActions}>
                <Pressable style={styles.inlineButton} onPress={() => void handleToggleEnabled(schedule.id)}>
                  <Text style={styles.inlineButtonText}>{schedule.enabled ? copy.disable : copy.enable}</Text>
                </Pressable>

                <Pressable
                  style={[styles.inlineButton, (!schedule.enabled || schedule.skipNextOccurrence) && styles.inlineButtonDisabled]}
                  onPress={() => void handleSkipNext(schedule.id)}
                  disabled={!schedule.enabled || schedule.skipNextOccurrence}>
                  <Text style={styles.inlineButtonText}>{copy.skipNext}</Text>
                </Pressable>
              </View>
            </Pressable>
          );
        })}

        <Pressable style={styles.primaryButton} onPress={() => void handleCreate()}>
          <Text style={styles.primaryButtonText}>{copy.create}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: 20, paddingBottom: 40 },
  topCard: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 16, marginBottom: 14 },
  sectionTitle: { color: colors.text, fontSize: 24, fontWeight: '800' },
  helperText: { color: colors.secondaryText, marginTop: 6 },
  countLabel: { color: colors.primary, marginTop: 10, fontWeight: '700' },
  scheduleCard: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 14, marginBottom: 12 },
  disabledCard: { opacity: 0.65 },
  scheduleTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  scheduleSummary: { color: colors.secondaryText, marginTop: 5 },
  skipInfo: { color: colors.primary, marginTop: 8, fontWeight: '700' },
  rowActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  inlineButton: { flex: 1, alignItems: 'center', borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingVertical: 10 },
  inlineButtonDisabled: { opacity: 0.4 },
  inlineButtonText: { color: colors.text, fontWeight: '700' },
  primaryButton: { marginTop: 8, borderRadius: 16, backgroundColor: colors.primary, paddingVertical: 14, alignItems: 'center' },
  primaryButtonText: { color: '#111827', fontWeight: '900', fontSize: 16 },
});
