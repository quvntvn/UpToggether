import type { Language } from '@/lib/i18n';

export type QuickMessage = {
  id: string;
  emoji: string;
  labels: Record<Language, string>;
};

export type SavedReaction = {
  id: string;
  quickMessageId: string;
  text: string;
  emoji: string;
  createdAt: string;
  relatedDate: string;
  relatedWakeResultId?: string;
  targetGroupId: string;
};

export type FeedReactionItem = {
  id: string;
  name: string;
  message: string;
  emoji?: string;
  isUser?: boolean;
  createdAt: string;
};
