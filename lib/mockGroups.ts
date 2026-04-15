import type { Language } from '@/lib/i18n';
import type { MockGroup } from '@/types/group';

export const MAIN_GROUP_ID = 'morning-squad';

type LocalizedText = {
  en: string;
  fr: string;
};

type LocalizedMockGroup = Omit<MockGroup, 'name' | 'streakRule' | 'members'> & {
  name: LocalizedText;
  streakRule: LocalizedText;
  members: Array<
    Omit<MockGroup['members'][number], 'name'> & {
      name: LocalizedText;
    }
  >;
};

const MOCK_GROUP_SEEDS: LocalizedMockGroup[] = [
  {
    id: MAIN_GROUP_ID,
    name: { en: 'Morning Squad', fr: 'Morning Squad' },
    streakDays: 4,
    streakRule: {
      en: 'All members woke up before 7:00 AM',
      fr: 'Tous les membres se sont réveillés avant 7h00',
    },
    members: [
      { id: 'you', name: { en: 'You', fr: 'Toi' }, avatar: '🫵', isUser: true, behavior: 'steady' },
      { id: 'emma', name: { en: 'Emma', fr: 'Emma' }, avatar: '🌞', behavior: 'fast' },
      { id: 'lucas', name: { en: 'Lucas', fr: 'Lucas' }, avatar: '😴', behavior: 'sleepy' },
      { id: 'noah', name: { en: 'Noah', fr: 'Noah' }, avatar: '🏃', behavior: 'steady' },
      { id: 'maya', name: { en: 'Maya', fr: 'Maya' }, avatar: '☕️', behavior: 'fast' },
    ],
  },
  {
    id: 'six-am-club',
    name: { en: '6AM Club', fr: 'Club 6h' },
    streakDays: 2,
    streakRule: {
      en: 'Most members checked in before sunrise',
      fr: 'La plupart des membres se sont signalés avant le lever du soleil',
    },
    members: [
      { id: 'you', name: { en: 'You', fr: 'Toi' }, avatar: '🫵', isUser: true, behavior: 'steady' },
      { id: 'zoe', name: { en: 'Zoe', fr: 'Zoe' }, avatar: '🎧', behavior: 'fast' },
      { id: 'liam', name: { en: 'Liam', fr: 'Liam' }, avatar: '📚', behavior: 'steady' },
    ],
  },
  {
    id: 'gym-crew',
    name: { en: 'Gym Crew', fr: 'Team gym' },
    streakDays: 6,
    streakRule: {
      en: 'Every workout alarm got a response',
      fr: 'Chaque alarme d’entraînement a reçu une réponse',
    },
    members: [
      { id: 'you', name: { en: 'You', fr: 'Toi' }, avatar: '🫵', isUser: true, behavior: 'steady' },
      { id: 'alex', name: { en: 'Alex', fr: 'Alex' }, avatar: '💪', behavior: 'fast' },
      { id: 'riley', name: { en: 'Riley', fr: 'Riley' }, avatar: '🏋️', behavior: 'sleepy' },
    ],
  },
];

export function getMockGroup(groupId = MAIN_GROUP_ID, language: Language = 'en'): MockGroup {
  const group = MOCK_GROUP_SEEDS.find((candidate) => candidate.id === groupId) ?? MOCK_GROUP_SEEDS[0];

  return {
    ...group,
    name: group.name[language] ?? group.name.en,
    streakRule: group.streakRule[language] ?? group.streakRule.en,
    members: group.members.map((member) => ({
      ...member,
      name: member.name[language] ?? member.name.en,
    })),
  };
}
