import type { Language } from '@/lib/i18n';
import type { QuickMessage } from '@/types/reaction';

export const QUICK_MORNING_MESSAGES: QuickMessage[] = [
  {
    id: 'good-day',
    emoji: '☀️',
    labels: {
      en: 'Have a great day',
      fr: 'Bonne journée',
    },
  },
  {
    id: 'i-won-today',
    emoji: '🏆',
    labels: {
      en: 'I won today',
      fr: 'J’ai gagné aujourd’hui',
    },
  },
  {
    id: 'im-exhausted',
    emoji: '😴',
    labels: {
      en: 'I’m totally wiped',
      fr: 'Ptn je suis KO',
    },
  },
  {
    id: 'who-snoozed',
    emoji: '😡',
    labels: {
      en: 'Who snoozed?',
      fr: 'Qui a snooze ?',
    },
  },
  {
    id: 'lets-crush-it',
    emoji: '💪',
    labels: {
      en: 'Let’s crush today',
      fr: 'On va tout casser aujourd’hui',
    },
  },
];

export function getQuickMessageLabel(message: QuickMessage, language: Language) {
  return message.labels[language] ?? message.labels.en;
}

export function getQuickMessageById(id: string) {
  return QUICK_MORNING_MESSAGES.find((message) => message.id === id);
}
