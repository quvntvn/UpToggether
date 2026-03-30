import type { TranslationKey } from '@/lib/i18n';
import type { UserGoal } from '@/types/profile';

type GoalTranslationMap = {
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
  helperTextKey: TranslationKey;
};

const baseGoals: Array<UserGoal & GoalTranslationMap> = [
  {
    id: 'wake-faster',
    title: 'Wake up faster',
    description: 'Train quick reactions right when your alarm starts.',
    emoji: '⚡️',
    helperText: 'Today’s mission: beat your reaction time.',
    titleKey: 'onboarding.goals.wakeFaster.title',
    descriptionKey: 'onboarding.goals.wakeFaster.description',
    helperTextKey: 'onboarding.goals.wakeFaster.helper',
  },
  {
    id: 'stop-snoozing',
    title: 'Stop snoozing',
    description: 'Build momentum by ending your wake flow without snooze.',
    emoji: '⏰',
    helperText: 'Today’s mission: no snooze.',
    titleKey: 'onboarding.goals.stopSnoozing.title',
    descriptionKey: 'onboarding.goals.stopSnoozing.description',
    helperTextKey: 'onboarding.goals.stopSnoozing.helper',
  },
  {
    id: 'build-routine',
    title: 'Build a routine',
    description: 'Show up every morning and protect your streak.',
    emoji: '📅',
    helperText: 'Protect your streak this morning.',
    titleKey: 'onboarding.goals.buildRoutine.title',
    descriptionKey: 'onboarding.goals.buildRoutine.description',
    helperTextKey: 'onboarding.goals.buildRoutine.helper',
  },
  {
    id: 'wake-with-friends',
    title: 'Wake up with friends',
    description: 'Use your Morning Squad to stay accountable together.',
    emoji: '👥',
    helperText: 'Your crew is waiting for you.',
    titleKey: 'onboarding.goals.wakeWithFriends.title',
    descriptionKey: 'onboarding.goals.wakeWithFriends.description',
    helperTextKey: 'onboarding.goals.wakeWithFriends.helper',
  },
  {
    id: 'beat-my-buddy',
    title: 'Beat my buddy',
    description: 'Compete daily with your Wake Buddy and climb rankings.',
    emoji: '🥇',
    helperText: 'Catch your buddy before they claim the top spot.',
    titleKey: 'onboarding.goals.beatMyBuddy.title',
    descriptionKey: 'onboarding.goals.beatMyBuddy.description',
    helperTextKey: 'onboarding.goals.beatMyBuddy.helper',
  },
  {
    id: 'more-disciplined',
    title: 'Become more disciplined',
    description: 'Make wake-ups consistent and keep promises to yourself.',
    emoji: '🧠',
    helperText: 'One intentional wake-up at a time.',
    titleKey: 'onboarding.goals.moreDisciplined.title',
    descriptionKey: 'onboarding.goals.moreDisciplined.description',
    helperTextKey: 'onboarding.goals.moreDisciplined.helper',
  },
];

export function getOnboardingGoals(t: (key: TranslationKey) => string): UserGoal[] {
  return baseGoals.map((goal) => ({
    id: goal.id,
    title: t(goal.titleKey),
    description: t(goal.descriptionKey),
    emoji: goal.emoji,
    helperText: t(goal.helperTextKey),
  }));
}

export function getGoalById(goalId: string) {
  return baseGoals.find((goal) => goal.id === goalId) ?? null;
}
