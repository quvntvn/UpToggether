export type UserGoal = {
  id: string;
  title: string;
  description: string;
  emoji?: string;
  helperText?: string;
};

export type LocalUserProfile = {
  onboardingCompleted: boolean;
  selectedGoalId: string;
  selectedGoalTitle: string;
  createdAt: string;
  displayName?: string;
  preferredWakeMode?: string;
};
