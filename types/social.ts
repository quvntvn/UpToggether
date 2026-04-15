export type WakeBehaviorProfile = 'fast' | 'average' | 'sleepy';

export type FriendArchetypeLabel = 'Early bird' | 'Consistent' | 'Snooze lover';

export type MockFriend = {
  id: string;
  name: string;
  avatar: string;
  behavior: WakeBehaviorProfile;
  archetypeLabel: FriendArchetypeLabel;
  behaviorSummary: string;
};

export type RankedWakeEntry = {
  id: string;
  name: string;
  avatar: string;
  reactionSeconds: number;
  rank: number;
  isUser: boolean;
  status: string;
};

export type FeedItem = {
  id: string;
  message: string;
};

export type MorningPreview = {
  positionLabel: string;
  message: string;
};
