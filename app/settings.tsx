import { Stack } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { useLanguage } from '@/context/language-context';
import { getGoalById } from '@/lib/onboardingGoals';
import type { Language } from '@/lib/i18n';
import { colors } from '@/lib/theme';
import { clearUserProfile, getUserProfile } from '@/storage/profileStorage';

const languageOptions: Language[] = ['fr', 'en'];

export default function SettingsScreen() {
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
      {
        text: t('common.cancel'),
        style: 'cancel',
      },
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
      <Stack.Screen options={{ title: t('settings.title') }} />

      <View style={styles.content}>
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
                  <Text style={styles.optionSubtitle}>{option === 'fr' ? 'fr' : 'en'}</Text>
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
    padding: 24,
    gap: 16,
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    color: colors.secondaryText,
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 12,
  },
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
  optionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  optionSubtitle: {
    color: colors.mutedText,
    fontSize: 13,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  selectedBadge: {
    color: colors.background,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    fontSize: 13,
    fontWeight: '800',
  },
  profileInfoCard: {
    backgroundColor: colors.background,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
  },
  resetButton: {
    marginTop: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: 'rgba(255, 213, 74, 0.12)',
    alignItems: 'center',
    paddingVertical: 14,
  },
  resetButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
});
