import { Stack, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useLanguage } from '@/context/language-context';
import { createTargetDateIso, WAKE_CONTRACT_TEMPLATES } from '@/lib/contracts';
import { colors } from '@/lib/theme';
import { getActiveContract, saveActiveContract } from '@/storage/contractsStorage';
import type { ActiveWakeContract, WakeContractTemplate } from '@/types/contracts';

function getLocalizedContract(template: WakeContractTemplate, language: 'en' | 'fr') {
  return {
    title: template.title[language],
    description: template.description[language],
    targetLabel: template.targetLabel[language],
  };
}

export default function ContractsScreen() {
  const { language } = useLanguage();
  const [activeContract, setActiveContract] = useState<ActiveWakeContract | null>(null);
  const [isSavingId, setIsSavingId] = useState<string | null>(null);

  const loadActiveContract = useCallback(async () => {
    const currentActiveContract = await getActiveContract();
    setActiveContract(currentActiveContract);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadActiveContract();
    }, [loadActiveContract]),
  );

  const contractIntro =
    language === 'fr'
      ? 'Choisis une promesse de réveil. Un contrat actif à la fois (MVP local).'
      : 'Choose a wake-up promise. One active contract at a time (local MVP).';

  const statusLabel = useMemo(() => {
    if (!activeContract) {
      return language === 'fr' ? 'Aucun contrat actif' : 'No active contract';
    }

    if (activeContract.status === 'completed') {
      return language === 'fr' ? 'Statut: Terminé ✅' : 'Status: Completed ✅';
    }

    if (activeContract.status === 'failed') {
      return language === 'fr' ? 'Statut: Échoué ❌' : 'Status: Failed ❌';
    }

    return language === 'fr' ? 'Statut: Actif ⏳' : 'Status: Active ⏳';
  }, [activeContract, language]);

  const handleActivateContract = async (template: WakeContractTemplate) => {
    setIsSavingId(template.id);

    const now = new Date();
    const localized = getLocalizedContract(template, language);

    await saveActiveContract({
      id: template.id,
      type: template.type,
      title: localized.title,
      description: localized.description,
      createdAt: now.toISOString(),
      targetDate: createTargetDateIso(template.type, now),
      status: 'active',
      progress: {
        note: localized.targetLabel,
      },
    });

    setActiveContract(await getActiveContract());
    setIsSavingId(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: language === 'fr' ? 'Contrats de réveil' : 'Wake Contracts' }} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{language === 'fr' ? 'Wake Contract' : 'Wake Contract'}</Text>
        <Text style={styles.subtitle}>{contractIntro}</Text>

        <View style={styles.statusCard}>
          <Text style={styles.statusText}>{statusLabel}</Text>
          {activeContract?.title ? <Text style={styles.activeTitle}>{activeContract.title}</Text> : null}
        </View>

        {WAKE_CONTRACT_TEMPLATES.map((template) => {
          const localized = getLocalizedContract(template, language);
          const isActive = activeContract?.id === template.id && activeContract.status === 'active';

          return (
            <View key={template.id} style={[styles.contractCard, isActive ? styles.contractCardActive : null]}>
              <Text style={styles.contractTitle}>{localized.title}</Text>
              <Text style={styles.contractDescription}>{localized.description}</Text>
              <Text style={styles.targetText}>{localized.targetLabel}</Text>

              <Pressable
                style={[styles.activateButton, isActive ? styles.activateButtonActive : null]}
                onPress={() => {
                  void handleActivateContract(template);
                }}
                disabled={isSavingId === template.id}>
                <Text style={[styles.activateButtonText, isActive ? styles.activateButtonTextActive : null]}>
                  {isActive
                    ? language === 'fr'
                      ? 'Actif'
                      : 'Active'
                    : isSavingId === template.id
                      ? language === 'fr'
                        ? 'Activation...'
                        : 'Activating...'
                      : language === 'fr'
                        ? 'Activer ce contrat'
                        : 'Activate contract'}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 28,
    gap: 14,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.secondaryText,
    fontSize: 15,
    lineHeight: 21,
    marginBottom: 4,
  },
  statusCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 2,
  },
  statusText: {
    color: colors.secondaryText,
    fontSize: 14,
    fontWeight: '600',
  },
  activeTitle: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
  },
  contractCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 10,
  },
  contractCardActive: {
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  contractTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  contractDescription: {
    color: colors.secondaryText,
    fontSize: 14,
    lineHeight: 20,
  },
  targetText: {
    color: colors.mutedText,
    fontSize: 13,
  },
  activateButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: 10,
    backgroundColor: '#111827',
  },
  activateButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  activateButtonText: {
    color: colors.primary,
    fontWeight: '700',
  },
  activateButtonTextActive: {
    color: '#111827',
  },
});
