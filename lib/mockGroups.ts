import type { MockGroup } from '@/types/group';

export const MAIN_GROUP_ID = 'morning-squad';

export const mockGroups: MockGroup[] = [
  {
    id: MAIN_GROUP_ID,
    name: 'Morning Squad',
    streakDays: 4,
    streakRule: 'All members woke up before 7:00 AM',
    members: [
      { id: 'you', name: 'You', avatar: '🫵', isUser: true, behavior: 'steady' },
      { id: 'emma', name: 'Emma', avatar: '🌞', behavior: 'fast' },
      { id: 'lucas', name: 'Lucas', avatar: '😴', behavior: 'sleepy' },
      { id: 'noah', name: 'Noah', avatar: '🏃', behavior: 'steady' },
      { id: 'maya', name: 'Maya', avatar: '☕️', behavior: 'fast' },
    ],
  },
  {
    id: 'six-am-club',
    name: '6AM Club',
    streakDays: 2,
    streakRule: 'Most members checked in before sunrise',
    members: [
      { id: 'you', name: 'You', avatar: '🫵', isUser: true, behavior: 'steady' },
      { id: 'zoe', name: 'Zoe', avatar: '🎧', behavior: 'fast' },
      { id: 'liam', name: 'Liam', avatar: '📚', behavior: 'steady' },
    ],
  },
  {
    id: 'gym-crew',
    name: 'Gym Crew',
    streakDays: 6,
    streakRule: 'Every workout alarm got a response',
    members: [
      { id: 'you', name: 'You', avatar: '🫵', isUser: true, behavior: 'steady' },
      { id: 'alex', name: 'Alex', avatar: '💪', behavior: 'fast' },
      { id: 'riley', name: 'Riley', avatar: '🏋️', behavior: 'sleepy' },
    ],
  },
];

export function getMockGroup(groupId = MAIN_GROUP_ID): MockGroup {
  return mockGroups.find((group) => group.id === groupId) ?? mockGroups[0];
}
