import type { Language } from '@/lib/i18n';
import { getDailyWakeBuddy } from '@/lib/mockBuddy';
import type { BuddyComparison, BuddyFeedItem, BuddyStatus, MockBuddy } from '@/types/buddy';

type BuildBuddyStatusParams = {
  date?: Date;
  hasUserWakeResult?: boolean;
  userReactionSeconds?: number | null;
  userSnoozeCount?: number;
  latestReactionLine?: string | null;
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

function getReminderMessage(buddy: MockBuddy, dateKey: string, language: Language) {
  const remindersByPersonality = {
    supportive: {
      en: ['Up already 👀', 'You got this. Alarm first, snooze never.', 'I know you can do this morning.'],
      fr: ['Debout 👀', 'Tu peux le faire. D’abord le réveil, jamais le snooze.', 'Je sais que tu peux gérer ce matin.'],
    },
    competitive: {
      en: ['Race you to awake mode 🏁', 'Don’t let me beat you again.', 'Today is not a snooze day.'],
      fr: ['Course jusqu’au réveil 🏁', 'Ne me laisse pas te battre encore.', 'Aujourd’hui, pas de snooze.'],
    },
    sleepy: {
      en: ['I almost snoozed… don’t copy me 😴', 'Tiny steps, just get up now.', 'Wake up with me, please.'],
      fr: ['J’ai failli snoozer… ne fais pas comme moi 😴', 'Petit pas par petit pas, lève-toi maintenant.', 'Réveille-toi avec moi, s’il te plaît.'],
    },
    strict: {
      en: ['No snooze excuses today.', 'I saw that snooze button 😡', 'Phone down, feet on the floor.'],
      fr: ['Aucune excuse de snooze aujourd’hui.', 'J’ai vu ce bouton snooze 😡', 'Téléphone posé, pieds au sol.'],
    },
  } as const;

  const messages = remindersByPersonality[buddy.personality][language] ?? remindersByPersonality[buddy.personality].en;
  const index = Math.floor(getSeededUnit(`${dateKey}:${buddy.id}:reminder`) * messages.length);

  return messages[index] ?? messages[0];
}

export function buildBuddyComparison({
  date = new Date(),
  hasUserWakeResult = false,
  userReactionSeconds,
  language = 'en',
}: BuildBuddyStatusParams): BuddyComparison | null {
  if (!hasUserWakeResult || typeof userReactionSeconds !== 'number') {
    return null;
  }

  const buddy = getDailyWakeBuddy(date, language);
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
      summary: language === 'fr' ? `Tu as battu ${buddy.name} ce matin` : `You beat ${buddy.name} this morning`,
    };
  }

  if (safeUserReactionSeconds > buddyReactionSeconds) {
    return {
      buddyName: buddy.name,
      userReactionSeconds: safeUserReactionSeconds,
      buddyReactionSeconds,
      outcome: 'buddy',
      summary: language === 'fr' ? `${buddy.name} t’a battu aujourd’hui` : `${buddy.name} beat you today`,
    };
  }

  return {
    buddyName: buddy.name,
    userReactionSeconds: safeUserReactionSeconds,
    buddyReactionSeconds,
    outcome: 'tie',
    summary: language === 'fr' ? `Égalité avec ${buddy.name} aujourd’hui` : `You and ${buddy.name} tied today`,
  };
}

export function buildBuddyStatus({
  date = new Date(),
  hasUserWakeResult = false,
  userReactionSeconds,
  userSnoozeCount = 0,
  language = 'en',
}: BuildBuddyStatusParams): BuddyStatus {
  const buddy = getDailyWakeBuddy(date, language);
  const comparison = buildBuddyComparison({ date, hasUserWakeResult, userReactionSeconds, language });
  const reminder = getReminderMessage(buddy, getDateKey(date), language);

  if (comparison?.outcome === 'user') {
    return {
      kind: 'user-won',
      shortLabel: language === 'fr' ? `Tu as battu ${buddy.name} aujourd’hui` : `You beat ${buddy.name} today`,
      accountabilityText:
        language === 'fr'
          ? `${buddy.name} a remarqué ton réveil rapide.`
          : `${buddy.name} noticed your fast wake-up.`,
      relationshipText:
        language === 'fr'
          ? `${buddy.name} dit : "Bien joué, garde la série en vie."`
          : `${buddy.name} says: "Nice one, keep the streak alive."`,
    };
  }

  if (comparison?.outcome === 'buddy') {
    return {
      kind: 'buddy-won',
      shortLabel: language === 'fr' ? `${buddy.name} est déjà réveillé` : `${buddy.name} is already awake`,
      accountabilityText:
        language === 'fr'
          ? `${buddy.name} compte sur toi demain matin.`
          : `${buddy.name} is counting on you tomorrow morning.`,
      relationshipText:
        language === 'fr'
          ? `${buddy.name} dit : "J’attends ton retour demain."`
          : `${buddy.name} says: "I’ll wait for your comeback."`,
    };
  }

  if (comparison?.outcome === 'tie') {
    return {
      kind: 'tie',
      shortLabel: language === 'fr' ? `Égalité avec ${buddy.name}` : `You and ${buddy.name} tied`,
      accountabilityText:
        language === 'fr'
          ? 'Un petit effort demain peut faire la différence.'
          : 'A tiny push tomorrow can decide the winner.',
      relationshipText:
        language === 'fr' ? `${buddy.name} dit : "Revanche demain ?"` : `${buddy.name} says: "Round two tomorrow?"`,
    };
  }

  if (userSnoozeCount > 0) {
    return {
      kind: 'sent-reminder',
      shortLabel: language === 'fr' ? `${buddy.name} a vu ton snooze` : `${buddy.name} saw that you snoozed`,
      accountabilityText:
        language === 'fr' ? `${buddy.name} a envoyé : "${reminder}"` : `${buddy.name} sent: "${reminder}"`,
      relationshipText:
        language === 'fr'
          ? 'Ton buddy compte sur toi pour éviter un autre snooze.'
          : 'Your buddy is counting on you to avoid another snooze.',
    };
  }

  const dateKey = getDateKey(date);
  const statusRoll = getSeededUnit(`${dateKey}:${buddy.id}:status`);

  if (statusRoll < 0.38) {
    return {
      kind: 'awake',
      shortLabel: language === 'fr' ? `${buddy.name} est déjà réveillé` : `${buddy.name} is already awake`,
      accountabilityText:
        language === 'fr'
          ? `${buddy.name} attend ton résultat du matin.`
          : `${buddy.name} is waiting for your wake result.`,
      relationshipText: language === 'fr' ? 'Tu ne te réveilles pas seul aujourd’hui.' : 'You are not waking up alone today.',
    };
  }

  if (statusRoll < 0.72) {
    return {
      kind: 'pending',
      shortLabel: language === 'fr' ? `${buddy.name} t’attend` : `${buddy.name} is waiting for you`,
      accountabilityText:
        language === 'fr' ? `${buddy.name} a envoyé : "${reminder}"` : `${buddy.name} sent: "${reminder}"`,
      relationshipText:
        language === 'fr'
          ? 'Ton buddy regardera ton résultat ce matin.'
          : 'Your buddy will check your result this morning.',
    };
  }

  return {
    kind: 'snoozing',
    shortLabel: language === 'fr' ? `${buddy.name} a encore snoozé` : `${buddy.name} snoozed again`,
    accountabilityText:
      language === 'fr'
        ? 'Bats ton buddy avant le prochain snooze.'
        : 'Beat your buddy before the next snooze hits.',
    relationshipText:
      language === 'fr'
        ? `${buddy.name} dit : "Ne copie pas mon habitude du snooze."`
        : `${buddy.name} says: "Don’t copy my snooze habit."`,
  };
}

export function buildBuddyFeed({
  date = new Date(),
  hasUserWakeResult = false,
  userReactionSeconds,
  userSnoozeCount = 0,
  latestReactionLine,
  language = 'en',
}: BuildBuddyStatusParams): BuddyFeedItem[] {
  const buddy = getDailyWakeBuddy(date, language);
  const dateKey = getDateKey(date);
  const reminder = getReminderMessage(buddy, dateKey, language);
  const comparison = buildBuddyComparison({ date, hasUserWakeResult, userReactionSeconds, language });

  const lines: BuddyFeedItem[] = [
    {
      id: `${dateKey}-reminder`,
      author: buddy.name,
      message: reminder,
    },
    {
      id: `${dateKey}-accountability`,
      author: buddy.name,
      message:
        userSnoozeCount > 0
          ? language === 'fr'
            ? 'J’ai vu ce snooze 😅'
            : 'I noticed that snooze 😅'
          : language === 'fr'
            ? 'Ton buddy compte sur toi.'
            : 'Your buddy is counting on you.',
    },
  ];

  if (latestReactionLine) {
    lines.push({
      id: `${dateKey}-user-reaction`,
      author: language === 'fr' ? 'Toi' : 'You',
      message: latestReactionLine,
    });
  }

  if (comparison) {
    lines.push({
      id: `${dateKey}-result`,
      author: buddy.name,
      message:
        comparison.outcome === 'user'
          ? language === 'fr'
            ? 'Ok, tu as gagné aujourd’hui. Respect 👏'
            : 'Okay you won today. Respect 👏'
          : comparison.summary,
    });
  }

  return lines;
}
