import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AlarmCard } from '@/components/AlarmCard';
import { useLanguage } from '@/context/language-context';
import { colors } from '@/lib/theme';
import { syncAlarmSchedules } from '@/services/alarmScheduleManager';
import {
  createAlarmSchedule,
  getAlarmSchedules,
  toggleAlarmScheduleEnabled,
} from '@/storage/alarmScheduleStorage';
import type { AlarmSchedule } from '@/types/alarmSchedule';

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
          labelPresets: ['Boulot', 'Salle', 'Etudes', 'Week-end', 'Perso'],
          fallbackLabel: 'Reveil',
          customLabel: 'Perso',
          customAlarmLabel: 'Reveil perso',
          sectionTitle: 'Alarmes',
          helperText: 'Gerez vos programmations et restez synchronise avec votre squad.',
          create: 'Ajouter une alarme',
          emptyState: 'Aucune alarme programmee',
        }
      : {
          labelPresets: ['Work', 'Gym', 'Study', 'Weekend', 'Custom'],
          fallbackLabel: 'Alarm',
          customLabel: 'Custom',
          customAlarmLabel: 'Custom Alarm',
          sectionTitle: 'Alarms',
          helperText: 'Manage your schedules and stay synced with your squad.',
          create: 'Add new alarm',
          emptyState: 'No alarms scheduled',
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

  const handlePressAlarm = (scheduleId: string) => {
    router.push({ pathname: '/alarm/[id]', params: { id: scheduleId } });
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.sectionTitle}>{copy.sectionTitle}</Text>
      <Text style={styles.helperText}>{copy.helperText}</Text>
    </View>
  );

  const renderFooter = () => (
    <Pressable style={styles.primaryButton} onPress={() => void handleCreate()}>
      <Text style={styles.primaryButtonText}>{copy.create}</Text>
    </Pressable>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>{copy.emptyState}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={schedules}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <AlarmCard alarm={item} onToggle={handleToggleEnabled} onPress={handlePressAlarm} />}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '800',
  },
  helperText: {
    color: colors.secondaryText,
    marginTop: 8,
    fontSize: 16,
    lineHeight: 22,
  },
  primaryButton: {
    marginTop: 10,
    borderRadius: 16,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#111827',
    fontWeight: '800',
    fontSize: 16,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.mutedText,
    fontSize: 16,
    fontWeight: '600',
  },
});
