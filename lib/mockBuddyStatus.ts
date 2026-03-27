import { getDailyWakeBuddy } from '@/lib/mockBuddy';
import type { BuddyComparison, BuddyFeedItem, BuddyStatus, MockBuddy } from '@/types/buddy';

type BuildBuddyStatusParams = {
  date?: Date;
  hasUserWakeResult?: boolean;
  userReactionSeconds?: number | null;
  userSnoozeCount?: number;
  latestReactionLine?: string | null;
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

function getSeededUnit(seedInput: string) {
  const hash = hashString(seedInput);
  return (hash % 10000) / 10000;
}

function getBuddyReactionRange(buddy: MockBuddy) {
  if (buddy.wakeStyle === 'early-bird') {
    return { min: 7, max: 18 };
  }

  if (buddy.wakeStyle === 'late-sprinter') {
    return { min: 18, max: 42 };
  }

  return { min: 11, max: 28 };
}

function getReminderMessage(buddy: MockBuddy, dateKey: string) {
  const remindersByPersonality = {
    supportive: ['Debout 👀', 'You got this. Alarm first, snooze never.', 'I know you can do this morning.'],
    competitive: ['Race you to awake mode 🏁', 'Don’t let me beat you again.', 'Today is not a snooze day.'],
    sleepy: ['I almost snoozed… don’t copy me 😴', 'Tiny steps, just get up now.', 'Wake up with me, please.'],
    strict: ['No snooze excuses today.', 'I saw that snooze button 😡', 'Phone down, feet on the floor.'],
  } as const;

  const messages = remindersByPersonality[buddy.personality];
  const index = Math.floor(getSeededUnit(`${dateKey}:${buddy.id}:reminder`) * messages.length);

  return messages[index] ?? messages[0];
}

export function buildBuddyComparison({
  date = new Date(),
  hasUserWakeResult = false,
  userReactionSeconds,
}: BuildBuddyStatusParams): BuddyComparison | null {
  if (!hasUserWakeResult || typeof userReactionSeconds !== 'number') {
    return null;
  }

  const buddy = getDailyWakeBuddy(date);
  const dateKey = getDateKey(date);
  const range = getBuddyReactionRange(buddy);
  const seed = getSeededUnit(`${dateKey}:${buddy.id}:reaction:${Math.round(userReactionSeconds)}`);
  const trendOffset = Math.round((userReactionSeconds - 16) * 0.08);
  const buddyReactionSeconds = Math.max(5, Math.round(range.min + seed * (range.max - range.min) + trendOffset));
  const safeUserReactionSeconds = Math.max(1, Math.round(userReactionSeconds));

  if (safeUserReactionSeconds < buddyReactionSeconds) {
    return {
      buddyName: buddy.name,
      userReactionSeconds: safeUserReactionSeconds,
      buddyReactionSeconds,
      outcome: 'user',
      summary: `You beat ${buddy.name} this morning`,
    };
  }

  if (safeUserReactionSeconds > buddyReactionSeconds) {
    return {
      buddyName: buddy.name,
      userReactionSeconds: safeUserReactionSeconds,
      buddyReactionSeconds,
      outcome: 'buddy',
      summary: `${buddy.name} beat you today`,
    };
  }

  return {
    buddyName: buddy.name,
    userReactionSeconds: safeUserReactionSeconds,
    buddyReactionSeconds,
    outcome: 'tie',
    summary: `You and ${buddy.name} tied today`,
  };
}

export function buildBuddyStatus({
  date = new Date(),
  hasUserWakeResult = false,
  userReactionSeconds,
  userSnoozeCount = 0,
}: BuildBuddyStatusParams): BuddyStatus {
  const buddy = getDailyWakeBuddy(date);
  const comparison = buildBuddyComparison({ date, hasUserWakeResult, userReactionSeconds });
  const reminder = getReminderMessage(buddy, getDateKey(date));

  if (comparison?.outcome === 'user') {
    return {
      kind: 'user-won',
      shortLabel: `You beat ${buddy.name} today`,
      accountabilityText: `${buddy.name} noticed your fast wake-up.`,
      relationshipText: `${buddy.name} says: "Nice one, keep the streak alive."`,
    };
  }

  if (comparison?.outcome === 'buddy') {
    return {
      kind: 'buddy-won',
      shortLabel: `${buddy.name} is already awake`,
      accountabilityText: `${buddy.name} is counting on you tomorrow morning.`,
      relationshipText: `${buddy.name} says: "I’ll wait for your comeback."`,
    };
  }

  if (comparison?.outcome === 'tie') {
    return {
      kind: 'tie',
      shortLabel: `You and ${buddy.name} tied`,
      accountabilityText: 'A tiny push tomorrow can decide the winner.',
      relationshipText: `${buddy.name} says: "Round two tomorrow?"`,
    };
  }

  if (userSnoozeCount > 0) {
    return {
      kind: 'sent-reminder',
      shortLabel: `${buddy.name} saw that you snoozed`,
      accountabilityText: `${buddy.name} sent: "${reminder}"`,
      relationshipText: 'Your buddy is counting on you to avoid another snooze.',
    };
  }

  const dateKey = getDateKey(date);
  const statusRoll = getSeededUnit(`${dateKey}:${buddy.id}:status`);

  if (statusRoll < 0.38) {
    return {
      kind: 'awake',
      shortLabel: `${buddy.name} is already awake`,
      accountabilityText: `${buddy.name} is waiting for your wake result.`,
      relationshipText: 'You are not waking up alone today.',
    };
  }

  if (statusRoll < 0.72) {
    return {
      kind: 'pending',
      shortLabel: `${buddy.name} is waiting for you`,
      accountabilityText: `${buddy.name} sent: "${reminder}"`,
      relationshipText: 'Your buddy will check your result this morning.',
    };
  }

  return {
    kind: 'snoozing',
    shortLabel: `${buddy.name} snoozed again`,
    accountabilityText: 'Beat your buddy before the next snooze hits.',
    relationshipText: `${buddy.name} says: "Don’t copy my snooze habit."`,
  };
}

export function buildBuddyFeed({
  date = new Date(),
  hasUserWakeResult = false,
  userReactionSeconds,
  userSnoozeCount = 0,
  latestReactionLine,
}: BuildBuddyStatusParams): BuddyFeedItem[] {
  const buddy = getDailyWakeBuddy(date);
  const dateKey = getDateKey(date);
  const reminder = getReminderMessage(buddy, dateKey);
  const comparison = buildBuddyComparison({ date, hasUserWakeResult, userReactionSeconds });

  const lines: BuddyFeedItem[] = [
    {
      id: `${dateKey}-reminder`,
      author: buddy.name,
      message: reminder,
    },
    {
      id: `${dateKey}-accountability`,
      author: buddy.name,
      message: userSnoozeCount > 0 ? 'I noticed that snooze 😅' : 'Your buddy is counting on you.',
    },
  ];

  if (latestReactionLine) {
    lines.push({
      id: `${dateKey}-user-reaction`,
      author: 'You',
      message: latestReactionLine,
    });
  }

  if (comparison) {
    lines.push({
      id: `${dateKey}-result`,
      author: buddy.name,
      message: comparison.outcome === 'user' ? 'Okay you won today. Respect 👏' : comparison.summary,
    });
  }

  return lines;
}
