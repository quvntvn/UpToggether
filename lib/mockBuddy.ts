import type { MockBuddy } from '@/types/buddy';

const MOCK_BUDDIES: MockBuddy[] = [
  {
    id: 'buddy-emma',
    name: 'Emma',
    avatar: '🌅',
    personality: 'supportive',
    profile: 'Cheering you on every morning with positive energy.',
    wakeStyle: 'early-bird',
  },
  {
    id: 'buddy-lucas',
    name: 'Lucas',
    avatar: '🔥',
    personality: 'competitive',
    profile: 'Always wants to win the morning race.',
    wakeStyle: 'steady',
  },
  {
    id: 'buddy-sarah',
    name: 'Sarah',
    avatar: '⏰',
    personality: 'strict',
    profile: 'Will call out snoozes and keep you accountable.',
    wakeStyle: 'late-sprinter',
  },
];

function getDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getDaySeed(date: Date) {
  return Number(getDateKey(date).split('-').join(''));
}

export function getAllMockBuddies() {
  return MOCK_BUDDIES;
}

export function getDailyWakeBuddy(date: Date = new Date()): MockBuddy {
  const seed = getDaySeed(date);
  const index = seed % MOCK_BUDDIES.length;

  return MOCK_BUDDIES[index] ?? MOCK_BUDDIES[0];
}
