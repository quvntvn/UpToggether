import { BADGE_CATALOG } from '@/lib/badges';
import { didUserBeatBuddy } from '@/lib/contracts';
import { unlockBadge } from '@/storage/badgesStorage';
import { getContractHistory } from '@/storage/contractsStorage';
import type { WakeResult } from '@/storage/wakeResultsStorage';
import type { BadgeDefinition, UnlockedBadge } from '@/types/badges';
import { getCurrentStreak } from '@/utils/streak';

type EvaluateBadgesParams = {
  wakeResults: WakeResult[];
  latestWakeResult?: WakeResult;
};

function countSuccessfulWakes(results: WakeResult[]) {
  return results.filter((result) => result.success).length;
}

function countNoSnoozeWakes(results: WakeResult[]) {
  return results.filter((result) => result.success && result.snoozeCount === 0).length;
}

function countBuddyWins(results: WakeResult[]) {
  return results.filter((result) => result.success && didUserBeatBuddy(result.reactionSeconds, new Date(result.stoppedAt))).length;
}

function doesBadgeMatch(
  badge: BadgeDefinition,
  params: EvaluateBadgesParams & { completedContracts: number; currentStreak: number },
) {
  const { wakeResults, latestWakeResult, completedContracts, currentStreak } = params;
  const successfulWakes = countSuccessfulWakes(wakeResults);
  const noSnoozeWakes = countNoSnoozeWakes(wakeResults);
  const buddyWins = countBuddyWins(wakeResults);

  switch (badge.rule.type) {
    case 'first-wake':
      return successfulWakes >= 1;
    case 'wake-count':
      return successfulWakes >= badge.rule.target;
    case 'streak':
      return currentStreak >= badge.rule.target;
    case 'no-snooze-count':
      return noSnoozeWakes >= badge.rule.target;
    case 'beat-buddy-count':
      return buddyWins >= badge.rule.target;
    case 'percentile-at-least':
      return (latestWakeResult?.percentile ?? 0) >= badge.rule.target;
    case 'reaction-under-seconds':
      return (latestWakeResult?.reactionSeconds ?? Number.MAX_SAFE_INTEGER) < badge.rule.target;
    case 'contract-completed-count':
      return completedContracts >= badge.rule.target;
    default:
      return false;
  }
}

export async function evaluateAndUnlockBadges({ wakeResults, latestWakeResult }: EvaluateBadgesParams) {
  const contractHistory = await getContractHistory();
  const completedContracts = contractHistory.filter((contract) => contract.status === 'completed').length;
  const currentStreak = getCurrentStreak(wakeResults);

  const newlyUnlocked: UnlockedBadge[] = [];

  for (const badge of BADGE_CATALOG) {
    const didMatch = doesBadgeMatch(badge, {
      wakeResults,
      latestWakeResult,
      completedContracts,
      currentStreak,
    });

    if (!didMatch) {
      continue;
    }

    const unlockedBadge: UnlockedBadge = {
      badgeId: badge.id,
      unlockedAt: new Date().toISOString(),
      relatedWakeResultId: latestWakeResult?.id,
      metadata: latestWakeResult
        ? {
            reactionSeconds: latestWakeResult.reactionSeconds,
            percentile: latestWakeResult.percentile,
          }
        : undefined,
    };

    const wasUnlocked = await unlockBadge(unlockedBadge);

    if (wasUnlocked) {
      newlyUnlocked.push(unlockedBadge);
    }
  }

  return newlyUnlocked;
}
