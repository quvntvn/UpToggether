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

function resetComputedScheduling(schedule: AlarmSchedule): AlarmSchedule {
  return {
    ...schedule,
    skipNextOccurrence: false,
    skipNextTimestamp: null,
    oneTimeDate: schedule.isOneTime ? null : schedule.oneTimeDate,
    nextScheduledTimestamp: null,
    notificationId: undefined,
  };
}

export default function AlarmEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t, language } = useLanguage();
  const [schedule, setSchedule] = useState<AlarmSchedule | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isShowingTimePicker, setIsShowingTimePicker] = useState(false);
  const [pickerDate, setPickerDate] = useState(() => new Date());

  useEffect(() => {
    async function loadSchedule() {
      const schedules = await getAlarmSchedules();
      const found = schedules.find((item) => item.id === id);

      if (found) {
        setSchedule(found);
        const date = new Date();
        date.setHours(found.hour, found.minute, 0, 0);
        setPickerDate(date);
      }
    }

    void loadSchedule();
  }, [id]);

  const enabledDaysCount = useMemo(() => {
    return schedule?.repeatDays?.length ?? 0;
  }, [schedule]);

  const openTimePicker = () => {
    if (!schedule) {
      return;
    }

    const base = new Date();
    base.setHours(schedule.hour, schedule.minute, 0, 0);
    setPickerDate(base);
    setIsShowingTimePicker(true);
  };

  const handleTimeChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    setIsShowingTimePicker(false);

    if (!selectedDate) {
      return;
    }

    setPickerDate(selectedDate);
    setSchedule((previous) => {
      if (!previous) {
        return previous;
      }

      return resetComputedScheduling({
        ...previous,
        hour: selectedDate.getHours(),
        minute: selectedDate.getMinutes(),
        oneTimeDate: null,
      });
    });
  };

  const toggleDay = (day: WeekdayKey) => {
    setSchedule((previous) => {
      if (!previous) {
        return previous;
      }

      const currentDays = previous.repeatDays ?? [];
      const nextDays = currentDays.includes(day)
        ? currentDays.filter((item) => item !== day)
        : [...currentDays, day].sort((left, right) => WEEKDAY_ORDER.indexOf(left) - WEEKDAY_ORDER.indexOf(right));

      return resetComputedScheduling({
        ...previous,
        repeatDays: nextDays,
        oneTimeDate: null,
      });
    });
  };

  const handleSaveAlarm = async () => {
    if (!schedule) {
      return;
    }

    if (schedule.enabled && !schedule.isOneTime && enabledDaysCount === 0) {
      Alert.alert('No active days', 'Select at least one day or set this as a one-time alarm.');
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

  const timeLabel = formatAlarmTime(schedule.hour, schedule.minute);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: schedule.label }} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.topCard}>
          <Text style={styles.sectionTitle}>Alarm label</Text>
          <TextInput
            value={schedule.label}
            onChangeText={(value) =>
              setSchedule((previous) => (previous ? { ...previous, label: value } : previous))
            }
            placeholder="Work"
            placeholderTextColor={colors.mutedText}
            style={styles.input}
          />

          <Pressable
            style={[styles.toggleButton, schedule.enabled ? styles.toggleOn : styles.toggleOff]}
            onPress={() =>
              setSchedule((previous) =>
                previous
                  ? resetComputedScheduling({
                      ...previous,
                      enabled: !previous.enabled,
                      oneTimeDate: previous.isOneTime ? null : previous.oneTimeDate,
                    })
                  : previous,
              )
            }
          >
            <Text style={styles.toggleButtonText}>{schedule.enabled ? 'Schedule Enabled' : 'Schedule Disabled'}</Text>
          </Pressable>
        </View>

        <View style={styles.topCard}>
          <Text style={styles.sectionTitle}>Time</Text>
          <Pressable style={styles.timeButton} onPress={openTimePicker}>
            <Text style={styles.timeButtonText}>{timeLabel}</Text>
            <Text style={styles.timeButtonHelper}>Tap to change</Text>
          </Pressable>

          <View style={styles.row}>
            <Pressable
              style={[styles.checkOption, schedule.isOneTime && styles.checkOptionActive]}
              onPress={() =>
                setSchedule((previous) =>
                  previous
                    ? resetComputedScheduling({
                        ...previous,
                        isOneTime: !previous.isOneTime,
                        oneTimeDate: null,
                      })
                    : previous,
                )
              }
            >
              <Text style={[styles.checkOptionText, schedule.isOneTime && styles.checkOptionTextActive]}>
                One-time alarm
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.topCard}>
          <Text style={styles.sectionTitle}>Repeat days</Text>
          <View style={styles.weekdayContainer}>
            {WEEKDAY_ORDER.map((day) => {
              const isActive = schedule.repeatDays?.includes(day);

              return (
                <Pressable
                  key={day}
                  style={[styles.weekdayCircle, isActive && styles.weekdayCircleActive]}
                  onPress={() => toggleDay(day)}
                >
                  <Text style={[styles.weekdayText, isActive && styles.weekdayTextActive]}>
                    {getWeekdayLabel(day, language).substring(0, 1)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.daySubtitle}>
            {enabledDaysCount === 0 ? 'No days selected' : `Repeats on ${enabledDaysCount} day${enabledDaysCount === 1 ? '' : 's'}`}
          </Text>
        </View>

        <Pressable
          style={[styles.primaryButton, isSaving && styles.disabledButton]}
          onPress={() => void handleSaveAlarm()}
          disabled={isSaving}
        >
          <Text style={styles.primaryButtonText}>{isSaving ? t('setAlarm.saving') : 'Save Alarm'}</Text>
        </Pressable>

        <Pressable style={styles.deleteButton} onPress={() => void handleDelete()}>
          <Text style={styles.deleteButtonText}>Delete schedule</Text>
        </Pressable>
      </ScrollView>

      {isShowingTimePicker ? (
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
  daySubtitle: { color: colors.mutedText, marginTop: 12, fontSize: 14 },
  timeButton: { borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 12, backgroundColor: '#0B1220', alignItems: 'center' },
  timeButtonText: { color: colors.primary, fontWeight: '800', fontSize: 32 },
  timeButtonHelper: { color: colors.secondaryText, marginTop: 4 },
  primaryButton: { marginTop: 8, borderRadius: 16, backgroundColor: colors.primary, paddingVertical: 14, alignItems: 'center' },
  primaryButtonText: { color: '#111827', fontWeight: '900', fontSize: 16 },
  deleteButton: { marginTop: 10, borderRadius: 16, borderWidth: 1, borderColor: '#7f1d1d', paddingVertical: 13, alignItems: 'center' },
  deleteButtonText: { color: '#fca5a5', fontWeight: '700' },
  secondaryButton: { marginTop: 16, borderRadius: 16, borderWidth: 1, borderColor: colors.border, paddingVertical: 13, alignItems: 'center' },
  secondaryButtonText: { color: colors.text, fontWeight: '700' },
  disabledButton: { opacity: 0.6 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  emptyTitle: { color: colors.text, fontSize: 20, fontWeight: '800' },
  weekdayContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  weekdayCircle: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  weekdayCircleActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  weekdayText: { color: colors.text, fontWeight: '700' },
  weekdayTextActive: { color: '#111827' },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  checkOption: { flex: 1, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  checkOptionActive: { backgroundColor: 'rgba(255, 213, 74, 0.15)', borderColor: colors.primary },
  checkOptionText: { color: colors.secondaryText, fontWeight: '600' },
  checkOptionTextActive: { color: colors.primary },
});
