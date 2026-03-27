export type GroupWakeStatus = 'awake' | 'snoozing' | 'pending';

export type MockGroupMember = {
  id: string;
  name: string;
  avatar: string;
  isUser?: boolean;
  behavior: 'fast' | 'steady' | 'sleepy';
};

export type MockGroup = {
  id: string;
  name: string;
  streakDays: number;
  streakRule: string;
  members: MockGroupMember[];
};

export type GroupMemberStatus = {
  id: string;
  name: string;
  avatar: string;
  isUser: boolean;
  status: GroupWakeStatus;
  reactionSeconds?: number;
  rank: number;
};

export type GroupFeedItem = {
  id: string;
  message: string;
};

export type GroupSnapshot = {
  groupId: string;
  groupName: string;
  streakDays: number;
  streakRule: string;
  members: GroupMemberStatus[];
  userPosition: number;
  awakeCount: number;
  feed: GroupFeedItem[];
};
