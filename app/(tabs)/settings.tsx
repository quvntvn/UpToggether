import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useLanguage } from '@/context/language-context';
import { getGoalById } from '@/lib/onboardingGoals';
import type { Language } from '@/lib/i18n';
import { colors } from '@/lib/theme';
import { clearUserProfile, getUserProfile } from '@/storage/profileStorage';

const languageOptions: Language[] = ['fr', 'en'];

export default function SettingsTabScreen() {
  const { language, setLanguage, t } = useLanguage();
  const [goalTitle, setGoalTitle] = useState<string>('—');

  const loadGoal = useCallback(async () => {
    const profile = await getUserProfile();

    if (!profile?.selectedGoalId) {
      setGoalTitle('—');
      return;
    }

    const fallbackGoal = getGoalById(profile.selectedGoalId);
    setGoalTitle(profile.selectedGoalTitle || fallbackGoal?.title || '—');
  }, []);

  useEffect(() => {
    void loadGoal();
  }, [loadGoal]);

  const handleResetOnboarding = () => {
    Alert.alert(t('settings.profile.resetTitle'), t('settings.profile.resetMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.profile.resetConfirm'),
        style: 'destructive',
        onPress: () => {
          void clearUserProfile().then(() => {
            setGoalTitle('—');
          });
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{t('settings.title')}</Text>
        <Text style={styles.subtitle}>{t('settings.subtitle')}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.languageSection')}</Text>
          {languageOptions.map((option) => {
            const isSelected = option === language;
            const label = option === 'fr' ? t('settings.french') : t('settings.english');

            return (
              <Pressable
                key={option}
                style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                onPress={() => void setLanguage(option)}>
                <View>
                  <Text style={styles.optionTitle}>{label}</Text>
                  <Text style={styles.optionSubtitle}>{option}</Text>
                </View>
                {isSelected ? <Text style={styles.selectedBadge}>{t('settings.activeLabel')}</Text> : null}
              </Pressable>
            );
          })}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.profile.sectionTitle')}</Text>
          <View style={styles.profileInfoCard}>
            <Text style={styles.optionSubtitle}>{t('settings.profile.currentGoal')}</Text>
            <Text style={styles.optionTitle}>{goalTitle}</Text>
          </View>
          <Pressable style={styles.resetButton} onPress={handleResetOnboarding}>
            <Text style={styles.resetButtonText}>{t('settings.profile.redoOnboarding')}</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sound & preferences</Text>
          <View style={styles.profileInfoCard}>
            <Text style={styles.optionTitle}>Alarm sound follows your selected schedule settings.</Text>
            <Text style={styles.optionSubtitle}>Advanced controls can be added here as the app scales.</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 24, gap: 16, paddingBottom: 40 },
  title: { color: colors.text, fontSize: 30, fontWeight: '800', marginBottom: 8 },
  subtitle: { color: colors.secondaryText, fontSize: 16, lineHeight: 22, marginBottom: 4 },
  section: {
    backgroundColor: colors.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
  },
  sectionTitle: {
    color: colors.mutedText,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  optionCard: {
    backgroundColor: colors.background,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    marginBottom: 12,
  },
  optionCardSelected: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(255, 213, 74, 0.12)',
  },
  optionTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  optionSubtitle: { color: colors.secondaryText, fontSize: 13, marginTop: 4 },
  selectedBadge: {
    color: '#111827',
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    fontWeight: '700',
    fontSize: 12,
  },
  profileInfoCard: {
    backgroundColor: colors.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 12,
  },
  resetButton: {
    backgroundColor: 'rgba(248, 113, 113, 0.15)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EF4444',
    paddingVertical: 12,
    alignItems: 'center',
  },
  resetButtonText: { color: '#FCA5A5', fontWeight: '700' },
});
