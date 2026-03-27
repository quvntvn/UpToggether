export type BuddyPersonality = 'supportive' | 'competitive' | 'sleepy' | 'strict';

export type BuddyWakeStyle = 'early-bird' | 'steady' | 'late-sprinter';

export type BuddyStatusKind =
  | 'pending'
  | 'awake'
  | 'snoozing'
  | 'sent-reminder'
  | 'buddy-won'
  | 'user-won'
  | 'tie';

export type MockBuddy = {
  id: string;
  name: string;
  avatar: string;
  personality: BuddyPersonality;
  profile: string;
  wakeStyle: BuddyWakeStyle;
};

export type BuddyStatus = {
  kind: BuddyStatusKind;
  shortLabel: string;
  accountabilityText: string;
  relationshipText: string;
};

export type BuddyFeedItem = {
  id: string;
  author: string;
  message: string;
};

export type BuddyComparison = {
  buddyName: string;
  userReactionSeconds: number;
  buddyReactionSeconds: number;
  outcome: 'user' | 'buddy' | 'tie';
  summary: string;
};
