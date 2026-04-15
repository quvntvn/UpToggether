import type { Language } from '@/lib/i18n';
import type { FeedReactionItem } from '@/types/reaction';

const FRIEND_REACTIONS = [
  {
    id: 'emma-up',
    name: 'Emma',
    message: { en: 'Already up', fr: 'Déjà debout' },
    emoji: '☀️',
  },
  {
    id: 'lucas-sleepy',
    name: 'Lucas',
    message: { en: 'Still sleepy', fr: 'Encore endormi' },
    emoji: '😴',
  },
  {
    id: 'nina-ready',
    name: 'Nina',
    message: { en: 'Ready to win', fr: 'Prête à gagner' },
    emoji: '🏆',
  },
  {
    id: 'noah-grind',
    name: 'Noah',
    message: { en: 'Let’s go crew', fr: 'Allez l’équipe' },
    emoji: '💪',
  },
] as const;

function getDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getDaySeed(date: Date) {
  const dateKey = getDateKey(date);
  return dateKey.split('-').join('').split('').reduce((sum, digit) => sum + Number(digit), 0);
}

export function buildMockFriendReactions(date: Date = new Date(), language: Language = 'en'): FeedReactionItem[] {
  const seed = getDaySeed(date);
  const firstIndex = seed % FRIEND_REACTIONS.length;
  const secondIndex = (seed + 2) % FRIEND_REACTIONS.length;

  return [FRIEND_REACTIONS[firstIndex], FRIEND_REACTIONS[secondIndex]].map((reaction, index) => ({
    id: `friend-reaction-${reaction.id}-${index}`,
    name: reaction.name,
    message: reaction.message[language] ?? reaction.message.en,
    emoji: reaction.emoji,
    createdAt: `${getDateKey(date)}T07:0${index}:00.000Z`,
  }));
}
