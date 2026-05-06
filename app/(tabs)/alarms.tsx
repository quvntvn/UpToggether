import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
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
  const { t } = useLanguage();
  const [schedules, setSchedules] = useState<AlarmSchedule[]>([]);

  const loadSchedules = useCallback(async () => {
    setSchedules(await getAlarmSchedules());
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadSchedules();
    }, [loadSchedules]),
  );

  const labelPresets = useMemo(
    () => [
      t('alarmsTab.presetWork'),
      t('alarmsTab.presetGym'),
      t('alarmsTab.presetStudy'),
      t('alarmsTab.presetWeekend'),
      t('alarmsTab.presetCustom'),
    ],
    [t],
  );

  const handleCreate = async () => {
    const fallback = t('alarmsTab.fallbackLabel');
    const customLabel = t('alarmsTab.presetCustom');
    const customAlarmLabel = t('alarmsTab.customAlarmLabel');
    const defaultLabel = labelPresets[schedules.length % labelPresets.length] ?? fallback;
    const created = await createAlarmSchedule(defaultLabel === customLabel ? customAlarmLabel : defaultLabel);
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
      <Text style={styles.sectionTitle}>{t('alarmsTab.sectionTitle')}</Text>
      <Text style={styles.helperText}>{t('alarmsTab.helperText')}</Text>
    </View>
  );

  const renderFooter = () => (
    <Pressable style={styles.primaryButton} onPress={() => void handleCreate()}>
      <Text style={styles.primaryButtonText}>{t('alarmsTab.create')}</Text>
    </Pressable>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>{t('alarmsTab.emptyState')}</Text>
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
