import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useLanguage } from '@/context/language-context';
import { getOnboardingGoals } from '@/lib/onboardingGoals';
import { colors } from '@/lib/theme';
import { completeOnboarding } from '@/storage/profileStorage';

export default function OnboardingScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const goals = useMemo(() => getOnboardingGoals(t), [t]);
  const [step, setStep] = useState(0);
  const [selectedGoalId, setSelectedGoalId] = useState(goals[0]?.id ?? '');
  const [displayName, setDisplayName] = useState('');
  const selectedGoal = goals.find((goal) => goal.id === selectedGoalId) ?? goals[0];

  const ctaLabel = step === 0 ? t('onboarding.continue') : step === 1 ? t('onboarding.confirmGoal') : t('onboarding.finish');

  const handleContinue = async () => {
    if (step < 2) {
      setStep((current) => current + 1);
      return;
    }

    if (!selectedGoal) {
      return;
    }

    await completeOnboarding({
      selectedGoalId: selectedGoal.id,
      selectedGoalTitle: selectedGoal.title,
      displayName,
    });

    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.heroCard}>
            <Text style={styles.brand}>{t('appName')}</Text>
            <Text style={styles.slogan}>{t('onboarding.heroSlogan')}</Text>
            <Text style={styles.description}>{t('onboarding.heroDescription')}</Text>
          </View>

          {step >= 1 ? (
            <View style={styles.stepCard}>
              <Text style={styles.stepTitle}>{t('onboarding.goalStepTitle')}</Text>
              <Text style={styles.stepSubtitle}>{t('onboarding.goalStepSubtitle')}</Text>

              <View style={styles.goalList}>
                {goals.map((goal) => {
                  const isSelected = goal.id === selectedGoalId;

                  return (
                    <Pressable
                      key={goal.id}
                      style={[styles.goalCard, isSelected && styles.goalCardSelected]}
                      onPress={() => setSelectedGoalId(goal.id)}>
                      <View style={styles.goalHeader}>
                        <Text style={styles.goalTitle}>{goal.emoji ? `${goal.emoji} ${goal.title}` : goal.title}</Text>
                        {isSelected ? <Text style={styles.selectedBadge}>{t('onboarding.selected')}</Text> : null}
                      </View>
                      <Text style={styles.goalDescription}>{goal.description}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null}

          {step >= 2 && selectedGoal ? (
            <View style={styles.stepCard}>
              <Text style={styles.stepTitle}>{t('onboarding.confirmTitle')}</Text>
              <Text style={styles.stepSubtitle}>{t('onboarding.confirmSubtitle')}</Text>

              <View style={styles.confirmGoalCard}>
                <Text style={styles.confirmGoalLabel}>{t('onboarding.yourGoal')}</Text>
                <Text style={styles.confirmGoalTitle}>
                  {selectedGoal.emoji ? `${selectedGoal.emoji} ` : ''}
                  {selectedGoal.title}
                </Text>
                {selectedGoal.helperText ? <Text style={styles.confirmGoalHelper}>{selectedGoal.helperText}</Text> : null}
              </View>

              <Text style={styles.inputLabel}>{t('onboarding.nameLabel')}</Text>
              <TextInput
                value={displayName}
                onChangeText={setDisplayName}
                placeholder={t('onboarding.namePlaceholder')}
                placeholderTextColor={colors.mutedText}
                style={styles.nameInput}
                maxLength={24}
              />
              <Text style={styles.inputHelper}>{t('onboarding.nameHelper')}</Text>
            </View>
          ) : null}

          <Pressable style={styles.primaryButton} onPress={() => void handleContinue()}>
            <Text style={styles.primaryButtonText}>{ctaLabel}</Text>
          </Pressable>

          <View style={styles.progressRow}>
            {[0, 1, 2].map((item) => (
              <View key={item} style={[styles.progressDot, item <= step && styles.progressDotActive]} />
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardContainer: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 40,
    gap: 16,
  },
  heroCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 24,
    padding: 22,
  },
  brand: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '800',
  },
  slogan: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
  },
  description: {
    color: colors.secondaryText,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10,
  },
  stepCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 24,
    padding: 20,
  },
  stepTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  stepSubtitle: {
    color: colors.secondaryText,
    fontSize: 14,
    marginTop: 6,
  },
  goalList: {
    marginTop: 14,
    gap: 10,
  },
  goalCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    padding: 14,
  },
  goalCardSelected: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(255, 213, 74, 0.12)',
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  goalTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  goalDescription: {
    color: colors.secondaryText,
    fontSize: 13,
    marginTop: 6,
  },
  selectedBadge: {
    color: colors.background,
    backgroundColor: colors.primary,
    borderRadius: 999,
    fontSize: 11,
    fontWeight: '800',
    paddingVertical: 5,
    paddingHorizontal: 10,
    textTransform: 'uppercase',
    overflow: 'hidden',
  },
  confirmGoalCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: 'rgba(255, 213, 74, 0.12)',
    padding: 14,
    marginTop: 14,
  },
  confirmGoalLabel: {
    color: colors.mutedText,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '700',
  },
  confirmGoalTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    marginTop: 6,
  },
  confirmGoalHelper: {
    color: colors.secondaryText,
    fontSize: 13,
    marginTop: 8,
  },
  inputLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 16,
  },
  nameInput: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    color: colors.text,
    fontSize: 15,
  },
  inputHelper: {
    color: colors.mutedText,
    marginTop: 8,
    fontSize: 12,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '800',
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  progressDot: {
    width: 9,
    height: 9,
    borderRadius: 999,
    backgroundColor: colors.border,
  },
  progressDotActive: {
    backgroundColor: colors.primary,
  },
});
