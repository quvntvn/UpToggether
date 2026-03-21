import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/lib/theme';
import { getSavedAlarm, type SavedAlarm } from '@/storage/alarmStorage';

export default function HomeScreen() {
  const router = useRouter();
  const [alarm, setAlarm] = useState<SavedAlarm | null>(null);

  const loadAlarm = useCallback(async () => {
    const savedAlarm = await getSavedAlarm();
    setAlarm(savedAlarm);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadAlarm();
    }, [loadAlarm]),
  );

  const nextAlarmDate = alarm ? new Date(alarm.nextScheduledTimestamp) : null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.brand}>UpTogether</Text>
          <Text style={styles.slogan}>Don’t wake up alone.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Next alarm</Text>
          {alarm?.enabled && nextAlarmDate ? (
            <>
              <Text style={styles.cardTime}>{alarm.formattedTime}</Text>
              <Text style={styles.cardInfo}>
                Scheduled for {nextAlarmDate.toLocaleDateString()} at {alarm.formattedTime}
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.placeholderTitle}>No alarm saved yet</Text>
              <Text style={styles.cardInfo}>
                Set your first wake-up to keep your mornings on track.
              </Text>
            </>
          )}
        </View>

        <Pressable style={styles.primaryButton} onPress={() => router.push('/set-alarm')}>
          <Text style={styles.primaryButtonText}>Set Alarm</Text>
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={() => router.push('/friends')}>
          <Text style={styles.secondaryButtonText}>Friends</Text>
        </Pressable>

        <Pressable style={styles.linkButton} onPress={() => router.push('/result')}>
          <Text style={styles.linkButtonText}>Preview wake result</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    justifyContent: 'center',
  },
  hero: {
    marginBottom: 32,
  },
  brand: {
    color: colors.text,
    fontSize: 36,
    fontWeight: '800',
    textAlign: 'center',
  },
  slogan: {
    color: colors.secondaryText,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    marginBottom: 20,
  },
  cardLabel: {
    color: colors.mutedText,
    fontSize: 14,
    marginBottom: 10,
  },
  cardTime: {
    color: colors.primary,
    fontSize: 48,
    fontWeight: '800',
  },
  placeholderTitle: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '700',
  },
  cardInfo: {
    color: colors.secondaryText,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10,
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
  linkButton: {
    alignItems: 'center',
    marginTop: 20,
  },
  linkButtonText: {
    color: colors.secondaryText,
    fontSize: 14,
    fontWeight: '600',
  },
});
