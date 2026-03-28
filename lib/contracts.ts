import { buildBuddyComparison } from '@/lib/mockBuddyStatus';
import type {
  ActiveWakeContract,
  ContractEvaluationInput,
  ContractEvaluationResult,
  WakeContractTemplate,
  WakeContractType,
} from '@/types/contracts';

const CONTRACT_TARGET_HOUR = 7;
const CONTRACT_REACTION_SECONDS = 20;
const CONTRACT_STREAK_DAYS = 7;

export const WAKE_CONTRACT_TEMPLATES: WakeContractTemplate[] = [
  {
    id: 'no-snooze',
    type: 'no-snooze',
    title: {
      en: 'No snooze tomorrow',
      fr: 'Pas de snooze demain',
    },
    description: {
      en: 'Promise to stop your alarm without hitting snooze.',
      fr: 'Promets de stopper ton réveil sans snoozer.',
    },
    targetLabel: {
      en: 'Target: tomorrow morning',
      fr: 'Objectif : demain matin',
    },
    metadata: {},
  },
  {
    id: 'wake-before-7',
    type: 'wake-before-7',
    title: {
      en: 'Wake before 07:00',
      fr: 'Réveil avant 07:00',
    },
    description: {
      en: 'Complete your wake flow before 7 AM.',
      fr: 'Termine ton réveil avant 7h.',
    },
    targetLabel: {
      en: 'Target: before 07:00',
      fr: 'Objectif : avant 07:00',
    },
    metadata: {
      targetHour: CONTRACT_TARGET_HOUR,
    },
  },
  {
    id: 'reaction-under-20s',
    type: 'reaction-under-20s',
    title: {
      en: 'React in under 20s',
      fr: 'Réagir en moins de 20s',
    },
    description: {
      en: 'Stop your alarm in less than 20 seconds.',
      fr: 'Arrête ton réveil en moins de 20 secondes.',
    },
    targetLabel: {
      en: 'Target: reaction < 20s',
      fr: 'Objectif : réaction < 20s',
    },
    metadata: {
      targetSeconds: CONTRACT_REACTION_SECONDS,
    },
  },
  {
    id: 'beat-buddy',
    type: 'beat-buddy',
    title: {
      en: 'Beat my buddy tomorrow',
      fr: 'Battre mon buddy demain',
    },
    description: {
      en: 'Wake faster than your mock Wake Buddy.',
      fr: 'Réveille-toi plus vite que ton Wake Buddy mock.',
    },
    targetLabel: {
      en: 'Target: win buddy battle',
      fr: 'Objectif : gagner contre le buddy',
    },
    metadata: {},
  },
  {
    id: 'maintain-streak',
    type: 'maintain-streak',
    title: {
      en: 'Maintain a 7-day streak',
      fr: 'Tenir une série de 7 jours',
    },
    description: {
      en: 'Keep your wake streak alive until day 7.',
      fr: 'Garde ta série de réveils jusqu’au jour 7.',
    },
    targetLabel: {
      en: 'Target: 7-day streak',
      fr: 'Objectif : série de 7 jours',
    },
    metadata: {
      targetStreakDays: CONTRACT_STREAK_DAYS,
    },
  },
];

export function getContractTemplate(contractId: WakeContractType) {
  return WAKE_CONTRACT_TEMPLATES.find((template) => template.id === contractId) ?? null;
}

export function createTargetDateIso(contractType: WakeContractType, createdAt: Date) {
  if (contractType === 'maintain-streak') {
    const targetDate = new Date(createdAt);
    targetDate.setDate(targetDate.getDate() + CONTRACT_STREAK_DAYS - 1);
    return targetDate.toISOString();
  }

  const targetDate = new Date(createdAt);
  targetDate.setDate(targetDate.getDate() + 1);
  return targetDate.toISOString();
}

function isWakeBeforeHour(stoppedAt: string, targetHour: number) {
  const wakeDate = new Date(stoppedAt);
  return wakeDate.getHours() < targetHour;
}

export function evaluateWakeContract(
  activeContract: ActiveWakeContract,
  input: ContractEvaluationInput,
): ContractEvaluationResult {
  switch (activeContract.type) {
    case 'no-snooze': {
      if (input.snoozeCount === 0) {
        return {
          status: 'completed',
          summary: 'You kept your promise today. No snoozes.',
        };
      }

      return {
        status: 'failed',
        summary: `Contract failed: you snoozed ${input.snoozeCount} time${input.snoozeCount === 1 ? '' : 's'}.`,
      };
    }
    case 'wake-before-7': {
      const targetHour = 7;
      const didWakeInTime = isWakeBeforeHour(input.stoppedAt, targetHour);

      return didWakeInTime
        ? {
            status: 'completed',
            summary: 'Great discipline. You woke before 07:00.',
          }
        : {
            status: 'failed',
            summary: 'Contract failed: wake time was after 07:00.',
          };
    }
    case 'reaction-under-20s': {
      const targetSeconds = 20;
      return input.reactionSeconds < targetSeconds
        ? {
            status: 'completed',
            summary: `Contract completed ✅ ${input.reactionSeconds}s reaction time.`,
          }
        : {
            status: 'failed',
            summary: `Contract failed: ${input.reactionSeconds}s is not under 20s.`,
          };
    }
    case 'beat-buddy': {
      return input.buddyWon
        ? {
            status: 'completed',
            summary: 'You beat your buddy today. Promise kept.',
          }
        : {
            status: 'failed',
            summary: 'Buddy won this morning. Come back stronger tomorrow.',
          };
    }
    case 'maintain-streak': {
      const target = 7;
      const current = Math.max(0, input.currentStreak);

      if (current >= target) {
        return {
          status: 'completed',
          summary: '7-day streak achieved. Contract completed.',
          progress: {
            current,
            target,
            note: 'Streak goal reached.',
            lastCheckedAt: input.stoppedAt,
          },
        };
      }

      return {
        status: 'active',
        summary: `Still active: ${current}/${target} streak days. Keep going tomorrow.`,
        progress: {
          current,
          target,
          note: 'Contract remains active until target streak is reached.',
          lastCheckedAt: input.stoppedAt,
        },
      };
    }
    default:
      return {
        status: 'active',
        summary: 'Contract is still active.',
      };
  }
}

export function didUserBeatBuddy(reactionSeconds: number, date = new Date()) {
  const comparison = buildBuddyComparison({
    date,
    hasUserWakeResult: reactionSeconds > 0,
    userReactionSeconds: reactionSeconds,
  });

  return comparison?.outcome === 'user';
}
