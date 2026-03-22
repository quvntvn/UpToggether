import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Language } from '@/lib/i18n';

export const LANGUAGE_STORAGE_KEY = 'uptogether.language';

export async function getStoredLanguage(): Promise<Language | null> {
  const value = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);

  if (value === 'fr' || value === 'en') {
    return value;
  }

  return null;
}

export async function saveStoredLanguage(language: Language) {
  await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
}
