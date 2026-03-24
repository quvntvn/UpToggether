import AsyncStorage from '@react-native-async-storage/async-storage';

const WAKE_RESULTS_STORAGE_KEY = 'uptogether.wake-results';

export type WakeResult = {
  id: string;
  date: string;
  scheduledTime: string;
  alarmTime?: string;
  timestamp?: string;
  stoppedAt: string;
  reactionSeconds: number;
  reactionTime: number;
  percentile: number;
  snoozeCount: number;
  success: boolean;
};

export async function getWakeResults(): Promise<WakeResult[]> {
  const value = await AsyncStorage.getItem(WAKE_RESULTS_STORAGE_KEY);

  if (!value) {
    return [];
  }

  const parsedValue = JSON.parse(value) as WakeResult[];
  return Array.isArray(parsedValue) ? parsedValue : [];
}

export async function saveWakeResult(result: WakeResult) {
  const existingResults = await getWakeResults();
  const resultsWithoutDuplicate = existingResults.filter((item) => item.id !== result.id);
  const nextResults = [result, ...resultsWithoutDuplicate].sort(
    (left, right) => new Date(right.stoppedAt).getTime() - new Date(left.stoppedAt).getTime(),
  );

  await AsyncStorage.setItem(WAKE_RESULTS_STORAGE_KEY, JSON.stringify(nextResults));
}

export async function clearWakeResults() {
  await AsyncStorage.removeItem(WAKE_RESULTS_STORAGE_KEY);
}
