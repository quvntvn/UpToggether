import React from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { useLanguage } from '@/context/language-context';
import { colors } from '@/lib/theme';
import { formatAlarmTime } from '@/services/alarm';
import type { AlarmSchedule } from '@/types/alarmSchedule';
import { formatRepeatDaysShort, getReadableRepeatLabel } from '@/utils/alarm-format';

interface AlarmCardProps {
  alarm: AlarmSchedule;
  onToggle: (id: string) => void;
  onPress: (id: string) => void;
}

export const AlarmCard: React.FC<AlarmCardProps> = ({ alarm, onToggle, onPress }) => {
  const { language } = useLanguage();

  const shortDays = formatRepeatDaysShort(alarm.repeatDays, language);
  const readableLabel = getReadableRepeatLabel(alarm.repeatDays, language, alarm.isOneTime);
  const displayTime = formatAlarmTime(alarm.hour, alarm.minute);

  return (
    <Pressable
      onPress={() => onPress(alarm.id)}
      style={({ pressed }) => [
        styles.container,
        !alarm.enabled && styles.disabled,
        pressed && styles.pressed,
      ]}>
      <View style={styles.leftContent}>
        <Text style={styles.time}>{displayTime}</Text>
        <View style={styles.infoContainer}>
          <Text style={styles.label}>{alarm.label}</Text>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.repeatLabel}>{readableLabel}</Text>
        </View>
        {alarm.repeatDays.length > 0 && !alarm.isOneTime ? (
          <Text style={styles.shortDays}>{shortDays}</Text>
        ) : null}
      </View>

      <Switch
        value={alarm.enabled}
        onValueChange={() => onToggle(alarm.id)}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor={alarm.enabled ? '#FFFFFF' : '#CBD5E1'}
        ios_backgroundColor={colors.border}
      />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.8,
  },
  leftContent: {
    flex: 1,
  },
  time: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.secondaryText,
  },
  dot: {
    fontSize: 14,
    color: colors.mutedText,
    marginHorizontal: 6,
  },
  repeatLabel: {
    fontSize: 14,
    color: colors.mutedText,
  },
  shortDays: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 6,
    letterSpacing: 1,
  },
});
