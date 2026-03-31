export type BadgeCategory = 'consistency' | 'speed' | 'social' | 'milestone' | 'contracts';

export type BadgeRule =
  | { type: 'first-wake' }
  | { type: 'wake-count'; target: number }
  | { type: 'streak'; target: number }
  | { type: 'no-snooze-count'; target: number }
  | { type: 'beat-buddy-count'; target: number }
  | { type: 'percentile-at-least'; target: number }
  | { type: 'reaction-under-seconds'; target: number }
  | { type: 'contract-completed-count'; target: number };

export type BadgeLabel = {
  en: string;
  fr: string;
};

export type BadgeDefinition = {
  id: string;
  title: BadgeLabel;
  description: BadgeLabel;
  category: BadgeCategory;
  emoji?: string;
  rule: BadgeRule;
};

export type UnlockedBadge = {
  badgeId: string;
  unlockedAt: string;
  relatedWakeResultId?: string;
  metadata?: Record<string, string | number | boolean>;
};
