import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Stack, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { useLanguage } from '@/context/language-context';
import { colors } from '@/lib/theme';
import {
  cancelScheduledAlarm,
  formatAlarmTime,
  requestAlarmPermissions,
  scheduleAlarmNotification,
} from '@/services/alarm';
import { getSavedAlarm, saveAlarm } from '@/storage/alarmStorage';

export default function SetAlarmScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const [time, setTime] = useState(() => new Date());
  const [isSaving, setIsSaving] = useState(false);

  const formattedSelectedTime = useMemo(
    () => formatAlarmTime(time.getHours(), time.getMinutes()),
    [time],
  );

  const handleTimeChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (selectedDate) {
      setTime(selectedDate);
    }
  };

  const handleSaveAlarm = async () => {
    try {
      setIsSaving(true);

      const permissionsGranted = await requestAlarmPermissions();

      if (!permissionsGranted) {
        Alert.alert(
          t('setAlarm.notificationsDisabledTitle'),
          t('setAlarm.notificationsDisabledMessage'),
        );
        return;
      }

      const previousAlarm = await getSavedAlarm();
      await cancelScheduledAlarm(previousAlarm?.notificationId);

      const { notificationId, nextAlarmDate } = await scheduleAlarmNotification(
        time.getHours(),
        time.getMinutes(),
      );

      await saveAlarm({
        hour: time.getHours(),
        minute: time.getMinutes(),
        formattedTime: formattedSelectedTime,
        nextScheduledTimestamp: nextAlarmDate.getTime(),
        enabled: true,
        notificationId,
      });

      Alert.alert(
        t('setAlarm.alarmSavedTitle'),
        t('setAlarm.alarmSavedMessage', { time: formattedSelectedTime }),
        [
          {
            text: t('setAlarm.alarmSavedButton'),
            onPress: () => router.back(),
          },
        ],
      );
    } catch (error) {
      console.error('Failed to save alarm', error);
      Alert.alert(t('setAlarm.saveFailedTitle'), t('setAlarm.saveFailedMessage'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: t('setAlarm.title') }} />

      <View style={styles.card}>
        <Text style={styles.label}>{t('setAlarm.selectedTime')}</Text>
        <Text style={styles.time}>{formattedSelectedTime}</Text>
        <Text style={styles.helper}>{t('setAlarm.helper')}</Text>

        <DateTimePicker
          value={time}
          mode="time"
          is24Hour
          display="spinner"
          onChange={handleTimeChange}
          textColor={colors.text}
          accentColor={colors.primary}
          themeVariant="dark"
          style={styles.picker}
        />
      </View>

      <Pressable
        style={[styles.primaryButton, isSaving && styles.disabledButton]}
        onPress={handleSaveAlarm}
        disabled={isSaving}>
        <Text style={styles.primaryButtonText}>
          {isSaving ? t('setAlarm.saving') : t('setAlarm.saveAlarm')}
        </Text>
      </Pressable>

      <Pressable style={styles.secondaryButton} onPress={() => router.back()} disabled={isSaving}>
        <Text style={styles.secondaryButtonText}>{t('common.cancel')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 24,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    marginBottom: 20,
  },
  label: {
    color: colors.mutedText,
    fontSize: 14,
    marginBottom: 8,
  },
  time: {
    color: colors.primary,
    fontSize: 42,
    fontWeight: '800',
  },
  helper: {
    color: colors.secondaryText,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 12,
    marginBottom: 16,
  },
  picker: {
    alignSelf: 'center',
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
