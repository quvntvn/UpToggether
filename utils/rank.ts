import type { Language } from '@/lib/i18n';

export function formatRankLabel(rank: number, language: Language) {
  const safeRank = Math.max(1, Math.floor(rank));

  if (language === 'fr') {
    return safeRank === 1 ? '1er' : `${safeRank}e`;
  }

  if (safeRank % 10 === 1 && safeRank % 100 !== 11) {
    return `${safeRank}st`;
  }

  if (safeRank % 10 === 2 && safeRank % 100 !== 12) {
    return `${safeRank}nd`;
  }

  if (safeRank % 10 === 3 && safeRank % 100 !== 13) {
    return `${safeRank}rd`;
  }

  return `${safeRank}th`;
}
