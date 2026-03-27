import type { FeedReactionItem } from '@/types/reaction';

const FRIEND_REACTIONS = [
  { id: 'emma-up', name: 'Emma', message: 'Already up', emoji: '☀️' },
  { id: 'lucas-sleepy', name: 'Lucas', message: 'Still sleepy', emoji: '😴' },
  { id: 'nina-ready', name: 'Nina', message: 'Ready to win', emoji: '🏆' },
  { id: 'noah-grind', name: 'Noah', message: 'Let’s go crew', emoji: '💪' },
] as const;

function getDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getDaySeed(date: Date) {
  const dateKey = getDateKey(date);
  return dateKey.split('-').join('').split('').reduce((sum, digit) => sum + Number(digit), 0);
}

export function buildMockFriendReactions(date: Date = new Date()): FeedReactionItem[] {
  const seed = getDaySeed(date);
  const firstIndex = seed % FRIEND_REACTIONS.length;
  const secondIndex = (seed + 2) % FRIEND_REACTIONS.length;

  return [FRIEND_REACTIONS[firstIndex], FRIEND_REACTIONS[secondIndex]].map((reaction, index) => ({
    id: `friend-reaction-${reaction.id}-${index}`,
    name: reaction.name,
    message: reaction.message,
    emoji: reaction.emoji,
    createdAt: `${getDateKey(date)}T07:0${index}:00.000Z`,
  }));
}
