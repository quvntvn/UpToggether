import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useLanguage } from '@/context/language-context';
import { colors } from '@/lib/theme';
import { syncWeeklyAlarmSchedule } from '@/services/alarmScheduleManager';
import {
  createDefaultAlarmSchedule,
  getAlarmSchedule,
  setSkipNextOccurrence,
} from '@/storage/alarmScheduleStorage';
import { WEEKDAY_LABELS, WEEKDAY_ORDER, type WeekdayKey, type WeeklyAlarmSchedule } from '@/types/alarmSchedule';
import { formatAlarmTime } from '@/services/alarm';

export default function SetAlarmScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const [schedule, setSchedule] = useState<WeeklyAlarmSchedule>(() => createDefaultAlarmSchedule());
  const [isSaving, setIsSaving] = useState(false);
  const [editingDay, setEditingDay] = useState<WeekdayKey | null>(null);
  const [pickerDate, setPickerDate] = useState(() => new Date());

  useEffect(() => {
    async function loadSchedule() {
      const savedSchedule = await getAlarmSchedule();
      if (savedSchedule) {
        setSchedule(savedSchedule);
      }
    }

    void loadSchedule();
  }, []);

  const enabledDaysCount = useMemo(
    () => WEEKDAY_ORDER.filter((day) => schedule.days[day].enabled).length,
    [schedule.days],
  );

  const openDayTimePicker = (day: WeekdayKey) => {
    const dayConfig = schedule.days[day];
    const base = new Date();
    base.setHours(dayConfig.hour, dayConfig.minute, 0, 0);
    setPickerDate(base);
    setEditingDay(day);
  };

  const handleTimeChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (!editingDay || !selectedDate) {
      return;
    }

    setPickerDate(selectedDate);
    setSchedule((previous) => ({
      ...previous,
      days: {
        ...previous.days,
        [editingDay]: {
          ...previous.days[editingDay],
          hour: selectedDate.getHours(),
          minute: selectedDate.getMinutes(),
        },
      },
    }));

    if (Platform.OS === 'android') {
      setEditingDay(null);
    }
  };

  const handleSaveAlarm = async () => {
    if (schedule.enabled && enabledDaysCount === 0) {
      Alert.alert('No active days', 'Enable at least one day or disable this schedule.');
      return;
    }

    try {
      setIsSaving(true);

      const { permissionsGranted } = await syncWeeklyAlarmSchedule(schedule, {
        requirePermissions: schedule.enabled,
      });

      if (!permissionsGranted) {
        Alert.alert(
          t('setAlarm.notificationsDisabledTitle'),
          t('setAlarm.notificationsDisabledMessage'),
        );
        return;
      }

      Alert.alert('Schedule saved', 'Your weekly alarm schedule has been updated.', [
        {
          text: 'Done',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error('Failed to save alarm schedule', error);
      Alert.alert(t('setAlarm.saveFailedTitle'), t('setAlarm.saveFailedMessage'));
    } finally {
      setIsSaving(false);
    }
  };

  const toggleDayEnabled = (day: WeekdayKey) => {
    setSchedule((previous) => ({
      ...previous,
      days: {
        ...previous.days,
        [day]: {
          ...previous.days[day],
          enabled: !previous.days[day].enabled,
        },
      },
    }));
  };

  const toggleSchedule = () => {
    setSchedule((previous) => ({
      ...previous,
      enabled: !previous.enabled,
    }));
  };

  const armSkipNext = async () => {
    const updated = await setSkipNextOccurrence(true);
    setSchedule(updated);
    Alert.alert('Skip enabled', 'The next occurrence will be skipped once.');
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: t('setAlarm.title') }} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.topCard}>
          <Text style={styles.sectionTitle}>Weekly schedule</Text>
          <Text style={styles.helperText}>Customize wake times by weekday. Disable any day you do not need.</Text>

          <Pressable
            style={[styles.toggleButton, schedule.enabled ? styles.toggleOn : styles.toggleOff]}
            onPress={toggleSchedule}>
            <Text style={styles.toggleButtonText}>{schedule.enabled ? 'Schedule Enabled' : 'Schedule Disabled'}</Text>
          </Pressable>

          <Pressable style={styles.skipButton} onPress={() => void armSkipNext()}>
            <Text style={styles.skipButtonText}>Skip next alarm</Text>
          </Pressable>
        </View>

        {WEEKDAY_ORDER.map((day) => {
          const config = schedule.days[day];
          const timeLabel = formatAlarmTime(config.hour, config.minute);
          return (
            <View key={day} style={[styles.dayCard, !config.enabled && styles.dayCardDisabled]}>
              <View style={styles.dayRow}>
                <View>
                  <Text style={styles.dayTitle}>{WEEKDAY_LABELS[day]}</Text>
                  <Text style={styles.daySubtitle}>{config.enabled ? 'Enabled' : 'Disabled'}</Text>
                </View>

                <Pressable
                  style={[styles.dayToggle, config.enabled ? styles.dayToggleOn : styles.dayToggleOff]}
                  onPress={() => toggleDayEnabled(day)}>
                  <Text style={styles.dayToggleText}>{config.enabled ? 'On' : 'Off'}</Text>
                </Pressable>
              </View>

              <Pressable
                style={[styles.timeButton, !config.enabled && styles.timeButtonDisabled]}
                onPress={() => openDayTimePicker(day)}>
                <Text style={[styles.timeButtonText, !config.enabled && styles.mutedText]}>{timeLabel}</Text>
                <Text style={[styles.timeButtonHelper, !config.enabled && styles.mutedText]}>Edit time</Text>
              </Pressable>
            </View>
          );
        })}

        <Pressable
          style={[styles.primaryButton, isSaving && styles.disabledButton]}
          onPress={() => void handleSaveAlarm()}
          disabled={isSaving}>
          <Text style={styles.primaryButtonText}>{isSaving ? t('setAlarm.saving') : 'Save Weekly Schedule'}</Text>
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={() => router.back()} disabled={isSaving}>
          <Text style={styles.secondaryButtonText}>{t('common.cancel')}</Text>
        </Pressable>
      </ScrollView>

      {editingDay ? (
        <DateTimePicker
          value={pickerDate}
          mode="time"
          is24Hour
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleTimeChange}
          textColor={colors.text}
          accentColor={colors.primary}
          themeVariant="dark"
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 36,
  },
  topCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 14,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
  },
  helperText: {
    color: colors.secondaryText,
    lineHeight: 20,
    marginBottom: 14,
  },
  toggleButton: {
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  toggleOn: {
    backgroundColor: colors.primary,
  },
  toggleOff: {
    backgroundColor: '#475569',
  },
  toggleButtonText: {
    color: '#111827',
    fontWeight: '800',
  },
  skipButton: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    color: colors.text,
    fontWeight: '700',
  },
  dayCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 12,
  },
  dayCardDisabled: {
    opacity: 0.7,
  },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dayTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  daySubtitle: {
    color: colors.mutedText,
    marginTop: 2,
  },
  dayToggle: {
    minWidth: 64,
    borderRadius: 999,
    paddingVertical: 8,
    alignItems: 'center',
  },
  dayToggleOn: {
    backgroundColor: colors.primary,
  },
  dayToggleOff: {
    backgroundColor: '#334155',
  },
  dayToggleText: {
    color: '#111827',
    fontWeight: '800',
  },
  timeButton: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
  },
  timeButtonDisabled: {
    backgroundColor: '#0B1220',
  },
  timeButtonText: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: 20,
  },
  timeButtonHelper: {
    color: colors.secondaryText,
    marginTop: 2,
  },
  mutedText: {
    color: colors.mutedText,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#111827',
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
  disabledButton: {
    opacity: 0.7,
  },
});
