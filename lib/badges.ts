import type { Language } from '@/lib/i18n';
import type { BadgeCategory, BadgeDefinition } from '@/types/badges';

export const BADGE_CATALOG: BadgeDefinition[] = [
  {
    id: 'first-wake',
    title: { en: 'First Wake', fr: 'Premier réveil' },
    description: { en: 'Complete your first successful wake.', fr: 'Termine ton premier réveil réussi.' },
    category: 'milestone',
    emoji: '🌅',
    rule: { type: 'first-wake' },
  },
  {
    id: 'no-snooze',
    title: { en: 'No Snooze', fr: 'Sans snooze' },
    description: { en: 'Finish one wake without snoozing.', fr: 'Termine un réveil sans snoozer.' },
    category: 'consistency',
    emoji: '⏰',
    rule: { type: 'no-snooze-count', target: 1 },
  },
  {
    id: 'no-snooze-3',
    title: { en: 'No Snooze x3', fr: 'Sans snooze x3' },
    description: { en: 'Finish three wakes without snoozing.', fr: 'Termine trois réveils sans snoozer.' },
    category: 'consistency',
    emoji: '🚫',
    rule: { type: 'no-snooze-count', target: 3 },
  },
  {
    id: 'streak-3',
    title: { en: '3-Day Streak', fr: 'Série de 3 jours' },
    description: { en: 'Reach a 3-day wake streak.', fr: 'Atteins une série de 3 jours.' },
    category: 'consistency',
    emoji: '🔥',
    rule: { type: 'streak', target: 3 },
  },
  {
    id: 'streak-7',
    title: { en: '7-Day Streak', fr: 'Série de 7 jours' },
    description: { en: 'Reach a 7-day wake streak.', fr: 'Atteins une série de 7 jours.' },
    category: 'consistency',
    emoji: '🏅',
    rule: { type: 'streak', target: 7 },
  },
  {
    id: 'under-10s',
    title: { en: 'Quick Reflex', fr: 'Réflexe rapide' },
    description: { en: 'Stop your alarm in under 10 seconds.', fr: 'Arrête ton réveil en moins de 10 secondes.' },
    category: 'speed',
    emoji: '⚡',
    rule: { type: 'reaction-under-seconds', target: 10 },
  },
  {
    id: 'top-10-percent',
    title: { en: 'Top 10%', fr: 'Top 10 %' },
    description: { en: 'Place in the top 10% for a wake result.', fr: 'Entre dans le top 10 % sur un réveil.' },
    category: 'speed',
    emoji: '🏆',
    rule: { type: 'percentile-at-least', target: 90 },
  },
  {
    id: 'beat-buddy',
    title: { en: 'Beat Your Buddy', fr: 'Bats ton buddy' },
    description: { en: 'Win one buddy battle.', fr: 'Gagne un duel contre ton buddy.' },
    category: 'social',
    emoji: '🤝',
    rule: { type: 'beat-buddy-count', target: 1 },
  },
  {
    id: 'beat-buddy-3',
    title: { en: 'Buddy Rival', fr: 'Rival du buddy' },
    description: { en: 'Beat your buddy 3 times.', fr: 'Bats ton buddy 3 fois.' },
    category: 'social',
    emoji: '🥊',
    rule: { type: 'beat-buddy-count', target: 3 },
  },
  {
    id: 'five-wakes',
    title: { en: 'Morning Collector', fr: 'Collectionneur matinal' },
    description: { en: 'Save 5 wake results.', fr: 'Enregistre 5 résultats de réveil.' },
    category: 'milestone',
    emoji: '📘',
    rule: { type: 'wake-count', target: 5 },
  },
  {
    id: 'first-contract-complete',
    title: { en: 'Promise Kept', fr: 'Promesse tenue' },
    description: { en: 'Complete your first wake contract.', fr: 'Termine ton premier wake contract.' },
    category: 'contracts',
    emoji: '📜',
    rule: { type: 'contract-completed-count', target: 1 },
  },
];

export function getBadgeById(badgeId: string) {
  return BADGE_CATALOG.find((badge) => badge.id === badgeId) ?? null;
}

export function getBadgeTitle(badge: BadgeDefinition, language: Language) {
  return badge.title[language] ?? badge.title.en;
}

export function getBadgeDescription(badge: BadgeDefinition, language: Language) {
  return badge.description[language] ?? badge.description.en;
}

export function getBadgeCategoryLabel(category: BadgeCategory, language: Language) {
  const labels: Record<BadgeCategory, { en: string; fr: string }> = {
    consistency: { en: 'Consistency', fr: 'Régularité' },
    speed: { en: 'Speed', fr: 'Vitesse' },
    social: { en: 'Social', fr: 'Social' },
    milestone: { en: 'Milestone', fr: 'Étape' },
    contracts: { en: 'Contracts', fr: 'Contrats' },
  };

  return labels[category][language] ?? labels[category].en;
}
