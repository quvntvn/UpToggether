import AsyncStorage from '@react-native-async-storage/async-storage';

import type { SavedReaction } from '@/types/reaction';

const REACTIONS_STORAGE_KEY = 'uptogether.reactions';

function getDateKey(inputDate: string | Date) {
  const date = inputDate instanceof Date ? inputDate : new Date(inputDate);
  return date.toISOString().slice(0, 10);
}

export async function getReactions(): Promise<SavedReaction[]> {
  const rawValue = await AsyncStorage.getItem(REACTIONS_STORAGE_KEY);

  if (!rawValue) {
    return [];
  }

  const parsedValue = JSON.parse(rawValue) as SavedReaction[];
  return Array.isArray(parsedValue) ? parsedValue : [];
}

export async function getLatestReaction() {
  const reactions = await getReactions();
  return reactions[0] ?? null;
}

export async function saveReaction(reaction: SavedReaction) {
  const reactions = await getReactions();
  const reactionsWithoutDuplicate = reactions.filter((item) => item.id !== reaction.id);
  const nextReactions = [reaction, ...reactionsWithoutDuplicate].sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );

  await AsyncStorage.setItem(REACTIONS_STORAGE_KEY, JSON.stringify(nextReactions));
}

export async function getReactionsForDate(date: string | Date) {
  const dateKey = getDateKey(date);
  const reactions = await getReactions();

  return reactions.filter((reaction) => reaction.relatedDate === dateKey);
}

export async function clearReactions() {
  await AsyncStorage.removeItem(REACTIONS_STORAGE_KEY);
}
