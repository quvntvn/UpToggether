import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { useLanguage } from '@/context/language-context';
import { colors } from '@/lib/theme';
import { formatAlarmTime } from '@/services/alarm';
import { syncAlarmSchedules } from '@/services/alarmScheduleManager';
import { deleteAlarmSchedule, getAlarmSchedules, updateAlarmSchedule } from '@/storage/alarmScheduleStorage';
import { getWeekdayLabel, WEEKDAY_ORDER, type AlarmSchedule, type WeekdayKey } from '@/types/alarmSchedule';

export default function AlarmEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t, language } = useLanguage();
  const [schedule, setSchedule] = useState<AlarmSchedule | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editingDay, setEditingDay] = useState<WeekdayKey | null>(null);
  const [pickerDate, setPickerDate] = useState(() => new Date());

  useEffect(() => {
    async function loadSchedule() {
      const schedules = await getAlarmSchedules();
      const found = schedules.find((item) => item.id === id);
      setSchedule(found ?? null);
    }

    void loadSchedule();
  }, [id]);

  const enabledDaysCount = useMemo(() => {
    if (!schedule) {
      return 0;
    }
    return WEEKDAY_ORDER.filter((day) => schedule.days[day].enabled).length;
  }, [schedule]);

  const openDayTimePicker = (day: WeekdayKey) => {
    if (!schedule) {
      return;
    }
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
    setSchedule((previous) => {
      if (!previous) {
        return previous;
      }

      return {
        ...previous,
        days: {
          ...previous.days,
          [editingDay]: {
            ...previous.days[editingDay],
            hour: selectedDate.getHours(),
            minute: selectedDate.getMinutes(),
          },
        },
      };
    });

    if (Platform.OS === 'android') {
      setEditingDay(null);
    }
  };

  const handleSaveAlarm = async () => {
    if (!schedule) {
      return;
    }

    if (schedule.enabled && enabledDaysCount === 0 && !schedule.oneTimeDate) {
      Alert.alert('No active days', 'Enable at least one day or disable this schedule.');
      return;
    }

    try {
      setIsSaving(true);
      await updateAlarmSchedule(schedule.id, () => schedule);

      const { permissionsGranted } = await syncAlarmSchedules({ requirePermissions: schedule.enabled });
      if (!permissionsGranted) {
        Alert.alert(t('setAlarm.notificationsDisabledTitle'), t('setAlarm.notificationsDisabledMessage'));
        return;
      }

      Alert.alert('Schedule saved', 'Your alarm schedule has been updated.', [
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

  const handleDelete = async () => {
    if (!schedule) {
      return;
    }

    Alert.alert('Delete schedule', `Remove "${schedule.label}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            await deleteAlarmSchedule(schedule.id);
            await syncAlarmSchedules();
            router.back();
          })();
        },
      },
    ]);
  };

  if (!schedule) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Alarm editor' }} />
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Alarm not found</Text>
          <Pressable style={styles.secondaryButton} onPress={() => router.back()}>
            <Text style={styles.secondaryButtonText}>{t('common.cancel')}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: schedule.label }} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.topCard}>
          <Text style={styles.sectionTitle}>Alarm label</Text>
          <TextInput
            value={schedule.label}
            onChangeText={(value) => setSchedule((previous) => (previous ? { ...previous, label: value } : previous))}
            placeholder="Work"
            placeholderTextColor={colors.mutedText}
            style={styles.input}
          />

          <Pressable
            style={[styles.toggleButton, schedule.enabled ? styles.toggleOn : styles.toggleOff]}
            onPress={() => setSchedule((previous) => (previous ? { ...previous, enabled: !previous.enabled } : previous))}>
            <Text style={styles.toggleButtonText}>{schedule.enabled ? 'Schedule Enabled' : 'Schedule Disabled'}</Text>
          </Pressable>
        </View>

        {WEEKDAY_ORDER.map((day) => {
          const config = schedule.days[day];
          const timeLabel = formatAlarmTime(config.hour, config.minute);

          return (
            <View key={day} style={[styles.dayCard, !config.enabled && styles.dayCardDisabled]}>
              <View style={styles.dayRow}>
                <View>
                  <Text style={styles.dayTitle}>{getWeekdayLabel(day, language)}</Text>
                  <Text style={styles.daySubtitle}>{config.enabled ? 'Enabled' : 'Disabled'}</Text>
                </View>

                <Pressable
                  style={[styles.dayToggle, config.enabled ? styles.dayToggleOn : styles.dayToggleOff]}
                  onPress={() =>
                    setSchedule((previous) =>
                      previous
                        ? {
                            ...previous,
                            days: {
                              ...previous.days,
                              [day]: {
                                ...previous.days[day],
                                enabled: !previous.days[day].enabled,
                              },
                            },
                          }
                        : previous,
                    )
                  }>
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

        <Pressable style={[styles.primaryButton, isSaving && styles.disabledButton]} onPress={() => void handleSaveAlarm()} disabled={isSaving}>
          <Text style={styles.primaryButtonText}>{isSaving ? t('setAlarm.saving') : 'Save Alarm'}</Text>
        </Pressable>

        <Pressable style={styles.deleteButton} onPress={() => void handleDelete()}>
          <Text style={styles.deleteButtonText}>Delete schedule</Text>
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
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: 20, paddingBottom: 36 },
  topCard: { backgroundColor: colors.card, borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 14 },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '800', marginBottom: 8 },
  input: { backgroundColor: '#0B1220', color: colors.text, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 14 },
  toggleButton: { borderRadius: 14, paddingVertical: 12, alignItems: 'center' },
  toggleOn: { backgroundColor: colors.primary },
  toggleOff: { backgroundColor: '#475569' },
  toggleButtonText: { color: '#111827', fontWeight: '800' },
  dayCard: { backgroundColor: colors.card, borderRadius: 18, borderWidth: 1, borderColor: colors.border, padding: 14, marginBottom: 12 },
  dayCardDisabled: { opacity: 0.7 },
  dayRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  dayTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  daySubtitle: { color: colors.mutedText, marginTop: 2 },
  dayToggle: { minWidth: 64, borderRadius: 999, paddingVertical: 8, alignItems: 'center' },
  dayToggleOn: { backgroundColor: colors.primary },
  dayToggleOff: { backgroundColor: '#334155' },
  dayToggleText: { color: '#111827', fontWeight: '800' },
  timeButton: { borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 12 },
  timeButtonDisabled: { backgroundColor: '#0B1220' },
  timeButtonText: { color: colors.primary, fontWeight: '800', fontSize: 20 },
  timeButtonHelper: { color: colors.secondaryText, marginTop: 2 },
  mutedText: { color: colors.mutedText },
  primaryButton: { marginTop: 8, borderRadius: 16, backgroundColor: colors.primary, paddingVertical: 14, alignItems: 'center' },
  primaryButtonText: { color: '#111827', fontWeight: '900', fontSize: 16 },
  deleteButton: { marginTop: 10, borderRadius: 16, borderWidth: 1, borderColor: '#7f1d1d', paddingVertical: 13, alignItems: 'center' },
  deleteButtonText: { color: '#fca5a5', fontWeight: '700' },
  secondaryButton: { marginTop: 16, borderRadius: 16, borderWidth: 1, borderColor: colors.border, paddingVertical: 13, alignItems: 'center' },
  secondaryButtonText: { color: colors.text, fontWeight: '700' },
  disabledButton: { opacity: 0.6 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  emptyTitle: { color: colors.text, fontSize: 20, fontWeight: '800' },
});
