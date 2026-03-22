import en from '@/locales/en';
import fr from '@/locales/fr';

export const translations = {
  en,
  fr,
} as const;

export type Language = keyof typeof translations;
export type TranslationDictionary = typeof en;

type NestedKeyOf<T> = T extends object
  ? {
      [K in keyof T & string]: T[K] extends object
        ? `${K}` | `${K}.${NestedKeyOf<T[K]>}`
        : `${K}`;
    }[keyof T & string]
  : never;

export type TranslationKey = NestedKeyOf<TranslationDictionary>;

type TranslationValues = Record<string, string | number>;

function getNestedValue(source: unknown, key: string): string | undefined {
  return key.split('.').reduce<unknown>((currentValue, currentKey) => {
    if (typeof currentValue === 'object' && currentValue !== null && currentKey in currentValue) {
      return (currentValue as Record<string, unknown>)[currentKey];
    }

    return undefined;
  }, source) as string | undefined;
}

function interpolate(template: string, values?: TranslationValues) {
  if (!values) {
    return template;
  }

  return template.replace(/\{\{(.*?)\}\}/g, (_match, rawKey) => {
    const value = values[rawKey.trim()];
    return value === undefined ? '' : String(value);
  });
}

function getDeviceLocale() {
  const intlLocale = Intl.DateTimeFormat().resolvedOptions().locale;

  if (intlLocale) {
    return intlLocale.toLowerCase();
  }

  if (typeof navigator !== 'undefined' && typeof navigator.language === 'string') {
    return navigator.language.toLowerCase();
  }

  return 'en';
}

export function detectDeviceLanguage(): Language {
  const locale = getDeviceLocale();
  return locale.startsWith('fr') ? 'fr' : 'en';
}

export function translate(language: Language, key: TranslationKey, values?: TranslationValues) {
  const currentTranslation = getNestedValue(translations[language], key);
  const fallbackTranslation = getNestedValue(translations.en, key);
  const message = currentTranslation ?? fallbackTranslation ?? key;

  return interpolate(message, values);
}
