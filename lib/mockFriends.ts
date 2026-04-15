import type { Language } from '@/lib/i18n';
import type { MockFriend } from '@/types/social';

type LocalizedText = {
  en: string;
  fr: string;
};

type LocalizedMockFriend = Omit<MockFriend, 'archetypeLabel' | 'behaviorSummary'> & {
  archetypeLabel: LocalizedText;
  behaviorSummary: LocalizedText;
};

const MOCK_FRIEND_SEEDS: LocalizedMockFriend[] = [
  {
    id: 'emma',
    name: 'Emma',
    avatar: '🌞',
    behavior: 'fast',
    archetypeLabel: { en: 'Early bird', fr: 'Lève-tôt' },
    behaviorSummary: {
      en: 'Usually reacts quickly and checks in early.',
      fr: 'Réagit vite et se signale tôt la plupart du temps.',
    },
  },
  {
    id: 'lucas',
    name: 'Lucas',
    avatar: '⚡️',
    behavior: 'average',
    archetypeLabel: { en: 'Consistent', fr: 'Régulier' },
    behaviorSummary: {
      en: 'Steady wake times most mornings.',
      fr: 'Se réveille de façon régulière la plupart des matins.',
    },
  },
  {
    id: 'sarah',
    name: 'Sarah',
    avatar: '😴',
    behavior: 'sleepy',
    archetypeLabel: { en: 'Snooze lover', fr: 'Fan du snooze' },
    behaviorSummary: {
      en: 'Needs extra time before feeling fully awake.',
      fr: 'A besoin d’un peu plus de temps avant d’être vraiment réveillée.',
    },
  },
  {
    id: 'noah',
    name: 'Noah',
    avatar: '🧠',
    behavior: 'average',
    archetypeLabel: { en: 'Consistent', fr: 'Régulier' },
    behaviorSummary: {
      en: 'Reliable routine with occasional slow starts.',
      fr: 'Routine fiable avec quelques démarrages plus lents.',
    },
  },
  {
    id: 'jade',
    name: 'Jade',
    avatar: '🏃‍♀️',
    behavior: 'fast',
    archetypeLabel: { en: 'Early bird', fr: 'Lève-tôt' },
    behaviorSummary: {
      en: 'Often active before everyone else.',
      fr: 'Est souvent active avant tout le monde.',
    },
  },
];

export function getMockFriends(language: Language = 'en'): MockFriend[] {
  return MOCK_FRIEND_SEEDS.map((friend) => ({
    ...friend,
    archetypeLabel: friend.archetypeLabel[language] ?? friend.archetypeLabel.en,
    behaviorSummary: friend.behaviorSummary[language] ?? friend.behaviorSummary.en,
  }));
}

export const mockFriends = getMockFriends('en');
