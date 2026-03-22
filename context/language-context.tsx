import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { colors } from '@/lib/theme';
import { detectDeviceLanguage, translate, type Language, type TranslationKey } from '@/lib/i18n';
import { getStoredLanguage, saveStoredLanguage } from '@/storage/languageStorage';

type TranslationValues = Record<string, string | number>;

type LanguageContextValue = {
  isReady: boolean;
  language: Language;
  setLanguage: (language: Language) => Promise<void>;
  t: (key: TranslationKey, values?: TranslationValues) => string;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function loadLanguage() {
      const storedLanguage = await getStoredLanguage();
      setLanguageState(storedLanguage ?? detectDeviceLanguage());
      setIsReady(true);
    }

    void loadLanguage();
  }, []);

  const setLanguage = async (nextLanguage: Language) => {
    setLanguageState(nextLanguage);
    await saveStoredLanguage(nextLanguage);
  };

  const value = useMemo<LanguageContextValue>(
    () => ({
      isReady,
      language,
      setLanguage,
      t: (key, values) => translate(language, key, values),
    }),
    [isReady, language],
  );

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }

  return context;
}

export function useT() {
  return useLanguage().t;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
