import AsyncStorage from '@react-native-async-storage/async-storage';

import type { UnlockedBadge } from '@/types/badges';

const BADGES_STORAGE_KEY = 'uptogether.badges.unlocked';

export async function getUnlockedBadges(): Promise<UnlockedBadge[]> {
  const value = await AsyncStorage.getItem(BADGES_STORAGE_KEY);

  if (!value) {
    return [];
  }

  const parsedValue = JSON.parse(value) as UnlockedBadge[];
  return Array.isArray(parsedValue) ? parsedValue : [];
}

export async function isBadgeUnlocked(badgeId: string) {
  const unlockedBadges = await getUnlockedBadges();
  return unlockedBadges.some((badge) => badge.badgeId === badgeId);
}

export async function unlockBadge(input: UnlockedBadge): Promise<boolean> {
  const unlockedBadges = await getUnlockedBadges();

  if (unlockedBadges.some((badge) => badge.badgeId === input.badgeId)) {
    return false;
  }

  const nextUnlockedBadges = [input, ...unlockedBadges].sort(
    (left, right) => new Date(right.unlockedAt).getTime() - new Date(left.unlockedAt).getTime(),
  );

  await AsyncStorage.setItem(BADGES_STORAGE_KEY, JSON.stringify(nextUnlockedBadges));
  return true;
}

export async function clearBadges() {
  await AsyncStorage.removeItem(BADGES_STORAGE_KEY);
}

export async function getLatestUnlockedBadge() {
  const unlockedBadges = await getUnlockedBadges();

  if (unlockedBadges.length === 0) {
    return null;
  }

  return [...unlockedBadges].sort(
    (left, right) => new Date(right.unlockedAt).getTime() - new Date(left.unlockedAt).getTime(),
  )[0];
}
