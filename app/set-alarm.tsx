import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

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

const LABEL_PRESETS = ['Work', 'Gym', 'Study', 'Weekend', 'Custom'];

export default function SetAlarmScreen() {
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

  const handleCreate = async () => {
    const defaultLabel = LABEL_PRESETS[schedules.length % LABEL_PRESETS.length] ?? 'Alarm';
    const created = await createAlarmSchedule(defaultLabel === 'Custom' ? 'Custom Alarm' : defaultLabel);
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

  const scheduleCountLabel = useMemo(
    () => `${schedules.length} schedule${schedules.length === 1 ? '' : 's'}`,
    [schedules.length],
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Alarm schedules' }} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.topCard}>
          <Text style={styles.sectionTitle}>Multiple alarms</Text>
          <Text style={styles.helperText}>Create separate schedules for work, gym, study, and weekends.</Text>
          <Text style={styles.countLabel}>{scheduleCountLabel}</Text>
        </View>

        {schedules.map((schedule) => {
          const days = getEnabledDaysSummary(schedule).map((day) => getWeekdayLabel(day, language)).join(' ');
          const next = getNextAlarmOccurrenceRespectingSkip(schedule);
          const displayTime = next ? next.formattedTime : formatAlarmTime(schedule.hour, schedule.minute);

          return (
            <Pressable
              key={schedule.id}
              style={[styles.scheduleCard, !schedule.enabled && styles.disabledCard]}
              onPress={() => router.push({ pathname: '/alarm/[id]', params: { id: schedule.id } })}>
              <Text style={styles.scheduleTitle}>{schedule.label}</Text>
              <Text style={styles.scheduleSummary}>
                {days || 'No active days'} — {displayTime}
              </Text>
              {schedule.skipNextOccurrence ? <Text style={styles.skipInfo}>Next occurrence skipped once</Text> : null}

              <View style={styles.rowActions}>
                <Pressable style={styles.inlineButton} onPress={() => void handleToggleEnabled(schedule.id)}>
                  <Text style={styles.inlineButtonText}>{schedule.enabled ? 'Disable' : 'Enable'}</Text>
                </Pressable>

                <Pressable
                  style={[styles.inlineButton, (!schedule.enabled || schedule.skipNextOccurrence) && styles.inlineButtonDisabled]}
                  onPress={() => void handleSkipNext(schedule.id)}
                  disabled={!schedule.enabled || schedule.skipNextOccurrence}>
                  <Text style={styles.inlineButtonText}>Skip next</Text>
                </Pressable>
              </View>
            </Pressable>
          );
        })}

        <Pressable style={styles.primaryButton} onPress={() => void handleCreate()}>
          <Text style={styles.primaryButtonText}>Create new schedule</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: 20, paddingBottom: 40 },
  topCard: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 16, marginBottom: 14 },
  sectionTitle: { color: colors.text, fontSize: 22, fontWeight: '800' },
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
