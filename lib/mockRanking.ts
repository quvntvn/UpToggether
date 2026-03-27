import { mockFriends } from '@/lib/mockFriends';
import type { FeedItem, MockFriend, RankedWakeEntry } from '@/types/social';

const USER_ENTRY_ID = 'user-local';

function getDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function hashString(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function getSeededUnit(seedInput: string) {
  const hash = hashString(seedInput);
  return (hash % 10000) / 10000;
}

function getBehaviorRange(behavior: MockFriend['behavior']) {
  if (behavior === 'fast') {
    return { min: 5, max: 16 };
  }

  if (behavior === 'sleepy') {
    return { min: 24, max: 90 };
  }

  return { min: 12, max: 38 };
}

function getWakeStatus(reactionSeconds: number) {
  if (reactionSeconds <= 8) {
    return 'already awake';
  }

  if (reactionSeconds <= 16) {
    return 'crushed it today';
  }

  if (reactionSeconds <= 35) {
    return 'solid morning';
  }

  if (reactionSeconds <= 60) {
    return 'warming up slowly';
  }

  return 'still sleepy';
}

function generateFriendReactionSeconds(friend: MockFriend, userReactionSeconds: number, dateKey: string) {
  const seedInput = `${dateKey}:${friend.id}:${Math.round(userReactionSeconds)}`;
  const seededUnit = getSeededUnit(seedInput);
  const range = getBehaviorRange(friend.behavior);
  const trendOffset = Math.round((userReactionSeconds - 18) * 0.08);
  const generatedReaction = Math.round(range.min + seededUnit * (range.max - range.min) + trendOffset);

  return Math.max(4, generatedReaction);
}

export function buildTodayRanking(userReactionSeconds: number, date = new Date()): RankedWakeEntry[] {
  const safeUserReaction = Math.max(0, Math.round(userReactionSeconds));
  const dateKey = getDateKey(date);

  const friendEntries: RankedWakeEntry[] = mockFriends.map((friend) => {
    const reactionSeconds = generateFriendReactionSeconds(friend, safeUserReaction, dateKey);

    return {
      id: friend.id,
      name: friend.name,
      avatar: friend.avatar,
      reactionSeconds,
      rank: 0,
      isUser: false,
      status: getWakeStatus(reactionSeconds),
    };
  });

  const userEntry: RankedWakeEntry = {
    id: USER_ENTRY_ID,
    name: 'You',
    avatar: '🫵',
    reactionSeconds: safeUserReaction,
    rank: 0,
    isUser: true,
    status: getWakeStatus(safeUserReaction),
  };

  const sortedEntries = [...friendEntries, userEntry].sort((left, right) => {
    if (left.reactionSeconds === right.reactionSeconds) {
      return left.id.localeCompare(right.id);
    }

    return left.reactionSeconds - right.reactionSeconds;
  });

  return sortedEntries.map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));
}

export function buildMorningFeed(ranking: RankedWakeEntry[]): FeedItem[] {
  const friendHighlights = ranking
    .filter((entry) => !entry.isUser)
    .slice(0, 3)
    .map((entry) => ({
      id: `highlight-${entry.id}`,
      message: `${entry.name} is ${entry.status}`,
    }));

  const userEntry = ranking.find((entry) => entry.isUser);
  const totalFriends = ranking.filter((entry) => !entry.isUser).length;
  const beatCount = userEntry ? totalFriends - (userEntry.rank - 1) : 0;

  return [
    ...friendHighlights,
    {
      id: 'user-summary',
      message: userEntry ? `You beat ${Math.max(0, beatCount)} friend${beatCount === 1 ? '' : 's'} today` : 'Wake up to join your crew',
    },
  ];
}

export function buildMorningPreview(userReactionSeconds = 18, date = new Date()): FeedItem[] {
  const ranking = buildTodayRanking(userReactionSeconds, date);
  return buildMorningFeed(ranking).slice(0, 3);
}
