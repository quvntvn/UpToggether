import type { Language } from '@/lib/i18n';
import { getMockGroup } from '@/lib/mockGroups';
import type { GroupFeedItem, GroupMemberStatus, GroupSnapshot, GroupWakeStatus, MockGroupMember } from '@/types/group';

type BuildGroupSnapshotParams = {
  groupId?: string;
  userReactionSeconds?: number | null;
  hasUserWakeResult?: boolean;
  date?: Date;
  language?: Language;
};

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

function seededUnit(seedInput: string) {
  const hash = hashString(seedInput);
  return (hash % 10000) / 10000;
}

function getReactionRange(behavior: MockGroupMember['behavior']) {
  if (behavior === 'fast') {
    return { min: 6, max: 18 };
  }

  if (behavior === 'sleepy') {
    return { min: 22, max: 65 };
  }

  return { min: 12, max: 34 };
}

function generateMockMemberStatus(member: MockGroupMember, dateKey: string, groupId: string): GroupMemberStatus {
  const statusSeed = seededUnit(`${dateKey}:${groupId}:${member.id}:status`);
  const reactionSeed = seededUnit(`${dateKey}:${groupId}:${member.id}:reaction`);

  if (statusSeed < 0.58) {
    const range = getReactionRange(member.behavior);
    const reactionSeconds = Math.round(range.min + reactionSeed * (range.max - range.min));

    return {
      id: member.id,
      name: member.name,
      avatar: member.avatar,
      isUser: Boolean(member.isUser),
      status: 'awake',
      reactionSeconds,
      rank: 0,
    };
  }

  if (statusSeed < 0.83) {
    return {
      id: member.id,
      name: member.name,
      avatar: member.avatar,
      isUser: Boolean(member.isUser),
      status: 'snoozing',
      rank: 0,
    };
  }

  return {
    id: member.id,
    name: member.name,
    avatar: member.avatar,
    isUser: Boolean(member.isUser),
    status: 'pending',
    rank: 0,
  };
}

function compareStatusOrder(left: GroupWakeStatus, right: GroupWakeStatus) {
  const order: Record<GroupWakeStatus, number> = {
    awake: 0,
    snoozing: 1,
    pending: 2,
  };

  return order[left] - order[right];
}

function buildGroupFeed(members: GroupMemberStatus[], userPosition: number, language: Language): GroupFeedItem[] {
  const awakeFriend = members.find((member) => !member.isUser && member.status === 'awake');
  const snoozingFriend = members.find((member) => !member.isUser && member.status === 'snoozing');
  const teammatesBeaten = Math.max(0, members.length - userPosition);

  return [
    {
      id: 'feed-awake',
      message: awakeFriend
        ? language === 'fr'
          ? `${awakeFriend.name} a assuré ce matin`
          : `${awakeFriend.name} crushed it today`
        : language === 'fr'
          ? 'Ton squad se réveille ensemble'
          : 'Your squad is waking up together',
    },
    {
      id: 'feed-snooze',
      message: snoozingFriend
        ? language === 'fr'
          ? `${snoozingFriend.name} a encore snoozé 😴`
          : `${snoozingFriend.name} snoozed again 😴`
        : language === 'fr'
          ? 'Aucun snoozer pour l’instant dans Morning Squad'
          : 'No snoozers yet in Morning Squad',
    },
    {
      id: 'feed-user',
      message:
        language === 'fr'
          ? `Tu as dépassé ${teammatesBeaten} équipier${teammatesBeaten === 1 ? '' : 's'} ce matin`
          : `You beat ${teammatesBeaten} teammate${teammatesBeaten === 1 ? '' : 's'} this morning`,
    },
  ];
}

export function buildMockGroupSnapshot({
  groupId,
  userReactionSeconds,
  hasUserWakeResult = false,
  date = new Date(),
  language = 'en',
}: BuildGroupSnapshotParams = {}): GroupSnapshot {
  const group = getMockGroup(groupId, language);
  const dateKey = getDateKey(date);

  const members = group.members.map((member) => {
    if (member.isUser) {
      if (hasUserWakeResult && typeof userReactionSeconds === 'number') {
        return {
          id: member.id,
          name: member.name,
          avatar: member.avatar,
          isUser: true,
          status: 'awake' as const,
          reactionSeconds: Math.max(1, Math.round(userReactionSeconds)),
          rank: 0,
        };
      }

      const fallbackSeed = seededUnit(`${dateKey}:${group.id}:${member.id}:fallback`);
      const fallbackStatus: GroupWakeStatus = fallbackSeed < 0.5 ? 'snoozing' : 'pending';

      return {
        id: member.id,
        name: member.name,
        avatar: member.avatar,
        isUser: true,
        status: fallbackStatus,
        rank: 0,
      };
    }

    return generateMockMemberStatus(member, dateKey, group.id);
  });

  const sortedMembers = [...members].sort((left, right) => {
    const statusOrder = compareStatusOrder(left.status, right.status);

    if (statusOrder !== 0) {
      return statusOrder;
    }

    if (left.status === 'awake' && right.status === 'awake') {
      const leftReaction = left.reactionSeconds ?? Number.MAX_SAFE_INTEGER;
      const rightReaction = right.reactionSeconds ?? Number.MAX_SAFE_INTEGER;

      if (leftReaction !== rightReaction) {
        return leftReaction - rightReaction;
      }
    }

    return left.name.localeCompare(right.name);
  });

  const rankedMembers = sortedMembers.map((member, index) => ({
    ...member,
    rank: index + 1,
  }));

  const userPosition = rankedMembers.find((member) => member.isUser)?.rank ?? rankedMembers.length;
  const awakeCount = rankedMembers.filter((member) => member.status === 'awake').length;

  return {
    groupId: group.id,
    groupName: group.name,
    streakDays: group.streakDays,
    streakRule: group.streakRule,
    members: rankedMembers,
    userPosition,
    awakeCount,
    feed: buildGroupFeed(rankedMembers, userPosition, language),
  };
}

export function formatGroupStatusLabel(member: GroupMemberStatus, language: Language = 'en') {
  if (member.status === 'awake') {
    return language === 'fr' ? 'Réveillé' : 'Awake';
  }

  if (member.status === 'snoozing') {
    return language === 'fr' ? 'En snooze' : 'Snoozing';
  }

  return language === 'fr' ? 'Pas encore réveillé' : 'Not awake yet';
}
