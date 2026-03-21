import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

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
          'Notifications disabled',
          'Allow notifications to receive your local alarm reminders in a development build.',
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

      Alert.alert('Alarm saved', `Your next alarm is set for ${formattedSelectedTime}.`, [
        {
          text: 'Nice',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error('Failed to save alarm', error);
      Alert.alert('Could not save alarm', 'Please try again in a development build with notifications enabled.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.label}>Selected time</Text>
        <Text style={styles.time}>{formattedSelectedTime}</Text>
        <Text style={styles.helper}>If today has already passed, the alarm will ring tomorrow.</Text>

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

      <Pressable style={[styles.primaryButton, isSaving && styles.disabledButton]} onPress={handleSaveAlarm} disabled={isSaving}>
        <Text style={styles.primaryButtonText}>{isSaving ? 'Saving...' : 'Save Alarm'}</Text>
      </Pressable>

      <Pressable style={styles.secondaryButton} onPress={() => router.back()} disabled={isSaving}>
        <Text style={styles.secondaryButtonText}>Cancel</Text>
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
