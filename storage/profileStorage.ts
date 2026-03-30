import AsyncStorage from '@react-native-async-storage/async-storage';

import type { LocalUserProfile } from '@/types/profile';

const PROFILE_STORAGE_KEY = 'uptogether.profile';

export async function getUserProfile(): Promise<LocalUserProfile | null> {
  const value = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as LocalUserProfile;
  } catch {
    return null;
  }
}

export async function saveUserProfile(profile: LocalUserProfile) {
  await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
}

export async function completeOnboarding({
  selectedGoalId,
  selectedGoalTitle,
  displayName,
}: {
  selectedGoalId: string;
  selectedGoalTitle: string;
  displayName?: string;
}) {
  const existingProfile = await getUserProfile();

  const profile: LocalUserProfile = {
    onboardingCompleted: true,
    selectedGoalId,
    selectedGoalTitle,
    createdAt: existingProfile?.createdAt ?? new Date().toISOString(),
    displayName: displayName?.trim() || existingProfile?.displayName,
    preferredWakeMode: existingProfile?.preferredWakeMode,
  };

  await saveUserProfile(profile);
  return profile;
}

export async function clearUserProfile() {
  await AsyncStorage.removeItem(PROFILE_STORAGE_KEY);
}
