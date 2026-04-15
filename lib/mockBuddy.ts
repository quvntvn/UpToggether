import type { Language } from '@/lib/i18n';
import type { MockBuddy } from '@/types/buddy';

type LocalizedText = {
  en: string;
  fr: string;
};

type LocalizedBuddy = Omit<MockBuddy, 'profile'> & {
  profile: LocalizedText;
};

const MOCK_BUDDIES: LocalizedBuddy[] = [
  {
    id: 'buddy-emma',
    name: 'Emma',
    avatar: '🌄',
    personality: 'supportive',
    profile: {
      en: 'Cheering you on every morning with positive energy.',
      fr: 'T’encourage chaque matin avec une énergie positive.',
    },
    wakeStyle: 'early-bird',
  },
  {
    id: 'buddy-lucas',
    name: 'Lucas',
    avatar: '🔥',
    personality: 'competitive',
    profile: {
      en: 'Always wants to win the morning race.',
      fr: 'Veut toujours gagner la course du matin.',
    },
    wakeStyle: 'steady',
  },
  {
    id: 'buddy-sarah',
    name: 'Sarah',
    avatar: '⏰',
    personality: 'strict',
    profile: {
      en: 'Will call out snoozes and keep you accountable.',
      fr: 'Repère les snoozes et te garde responsable.',
    },
    wakeStyle: 'late-sprinter',
  },
];

function getDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getDaySeed(date: Date) {
  return Number(getDateKey(date).split('-').join(''));
}

export function getAllMockBuddies(language: Language = 'en'): MockBuddy[] {
  return MOCK_BUDDIES.map((buddy) => ({
    ...buddy,
    profile: buddy.profile[language] ?? buddy.profile.en,
  }));
}

export function getDailyWakeBuddy(date: Date = new Date(), language: Language = 'en'): MockBuddy {
  const seed = getDaySeed(date);
  const index = seed % MOCK_BUDDIES.length;
  const buddy = MOCK_BUDDIES[index] ?? MOCK_BUDDIES[0];

  return {
    ...buddy,
    profile: buddy.profile[language] ?? buddy.profile.en,
  };
}

export function getBuddyPersonalityLabel(personality: MockBuddy['personality'], language: Language) {
  const labels = {
    supportive: { en: 'Supportive', fr: 'Encourageant' },
    competitive: { en: 'Competitive', fr: 'Compétitif' },
    sleepy: { en: 'Sleepy', fr: 'Somnolent' },
    strict: { en: 'Strict', fr: 'Strict' },
  } as const;

  return labels[personality][language] ?? labels[personality].en;
}

export function getBuddyWakeStyleLabel(wakeStyle: MockBuddy['wakeStyle'], language: Language) {
  const labels = {
    'early-bird': { en: 'Early bird', fr: 'Lève-tôt' },
    steady: { en: 'Steady', fr: 'Régulier' },
    'late-sprinter': { en: 'Late sprinter', fr: 'Réveil progressif' },
  } as const;

  return labels[wakeStyle][language] ?? labels[wakeStyle].en;
}
