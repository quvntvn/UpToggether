import AsyncStorage from '@react-native-async-storage/async-storage';

import type { ActiveWakeContract, WakeContractProgress } from '@/types/contracts';

const ACTIVE_CONTRACT_STORAGE_KEY = 'uptogether.active-contract';
const CONTRACT_HISTORY_STORAGE_KEY = 'uptogether.contract-history';
const HISTORY_LIMIT = 8;

export async function getActiveContract(): Promise<ActiveWakeContract | null> {
  const value = await AsyncStorage.getItem(ACTIVE_CONTRACT_STORAGE_KEY);

  if (!value) {
    return null;
  }

  const parsedValue = JSON.parse(value) as ActiveWakeContract;
  if (!parsedValue || typeof parsedValue !== 'object') {
    return null;
  }

  return parsedValue;
}

export async function saveActiveContract(contract: ActiveWakeContract) {
  await AsyncStorage.setItem(ACTIVE_CONTRACT_STORAGE_KEY, JSON.stringify(contract));
}

export async function clearActiveContract() {
  await AsyncStorage.removeItem(ACTIVE_CONTRACT_STORAGE_KEY);
}

export async function getContractHistory(): Promise<ActiveWakeContract[]> {
  const value = await AsyncStorage.getItem(CONTRACT_HISTORY_STORAGE_KEY);

  if (!value) {
    return [];
  }

  const parsedValue = JSON.parse(value) as ActiveWakeContract[];
  return Array.isArray(parsedValue) ? parsedValue : [];
}

async function appendContractHistory(contract: ActiveWakeContract) {
  const history = await getContractHistory();
  const nextHistory = [contract, ...history.filter((item) => item.createdAt !== contract.createdAt)].slice(0, HISTORY_LIMIT);
  await AsyncStorage.setItem(CONTRACT_HISTORY_STORAGE_KEY, JSON.stringify(nextHistory));
}

export async function completeContract(summary: string, progress?: WakeContractProgress) {
  const activeContract = await getActiveContract();

  if (!activeContract) {
    return null;
  }

  const nextContract: ActiveWakeContract = {
    ...activeContract,
    status: 'completed',
    progress: {
      ...activeContract.progress,
      ...progress,
      note: summary,
      lastCheckedAt: new Date().toISOString(),
    },
  };

  await saveActiveContract(nextContract);
  await appendContractHistory(nextContract);
  return nextContract;
}

export async function failContract(summary: string, progress?: WakeContractProgress) {
  const activeContract = await getActiveContract();

  if (!activeContract) {
    return null;
  }

  const nextContract: ActiveWakeContract = {
    ...activeContract,
    status: 'failed',
    progress: {
      ...activeContract.progress,
      ...progress,
      note: summary,
      lastCheckedAt: new Date().toISOString(),
    },
  };

  await saveActiveContract(nextContract);
  await appendContractHistory(nextContract);
  return nextContract;
}

export async function updateContractProgress(summary: string, progress?: WakeContractProgress) {
  const activeContract = await getActiveContract();

  if (!activeContract) {
    return null;
  }

  const nextContract: ActiveWakeContract = {
    ...activeContract,
    status: 'active',
    progress: {
      ...activeContract.progress,
      ...progress,
      note: summary,
      lastCheckedAt: new Date().toISOString(),
    },
  };

  await saveActiveContract(nextContract);
  return nextContract;
}
