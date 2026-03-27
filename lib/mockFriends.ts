import type { MockFriend } from '@/types/social';

export const mockFriends: MockFriend[] = [
  {
    id: 'emma',
    name: 'Emma',
    avatar: '🌞',
    behavior: 'fast',
    archetypeLabel: 'Early bird',
    behaviorSummary: 'Usually reacts quickly and checks in early.',
  },
  {
    id: 'lucas',
    name: 'Lucas',
    avatar: '⚡️',
    behavior: 'average',
    archetypeLabel: 'Consistent',
    behaviorSummary: 'Steady wake times most mornings.',
  },
  {
    id: 'sarah',
    name: 'Sarah',
    avatar: '😴',
    behavior: 'sleepy',
    archetypeLabel: 'Snooze lover',
    behaviorSummary: 'Needs extra time before feeling fully awake.',
  },
  {
    id: 'noah',
    name: 'Noah',
    avatar: '🧠',
    behavior: 'average',
    archetypeLabel: 'Consistent',
    behaviorSummary: 'Reliable routine with occasional slow starts.',
  },
  {
    id: 'jade',
    name: 'Jade',
    avatar: '🏃‍♀️',
    behavior: 'fast',
    archetypeLabel: 'Early bird',
    behaviorSummary: 'Often active before everyone else.',
  },
];
