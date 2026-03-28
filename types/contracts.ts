export type WakeContractType = 'no-snooze' | 'wake-before-7' | 'reaction-under-20s' | 'beat-buddy' | 'maintain-streak';

export type WakeContractStatus = 'active' | 'completed' | 'failed';

export type WakeContractTemplate = {
  id: WakeContractType;
  type: WakeContractType;
  title: {
    en: string;
    fr: string;
  };
  description: {
    en: string;
    fr: string;
  };
  targetLabel: {
    en: string;
    fr: string;
  };
  metadata: {
    targetHour?: number;
    targetSeconds?: number;
    targetStreakDays?: number;
  };
};

export type WakeContractProgress = {
  current?: number;
  target?: number;
  note?: string;
  lastCheckedAt?: string;
};

export type ActiveWakeContract = {
  id: WakeContractType;
  type: WakeContractType;
  title: string;
  description: string;
  createdAt: string;
  targetDate: string;
  status: WakeContractStatus;
  progress?: WakeContractProgress;
};

export type ContractEvaluationInput = {
  stoppedAt: string;
  scheduledTime?: string;
  reactionSeconds: number;
  snoozeCount: number;
  currentStreak: number;
  buddyWon: boolean;
};

export type ContractEvaluationResult = {
  status: WakeContractStatus;
  progress?: WakeContractProgress;
  summary: string;
};
