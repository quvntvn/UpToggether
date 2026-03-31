import { Stack, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useLanguage } from '@/context/language-context';
import { BADGE_CATALOG, getBadgeDescription, getBadgeTitle } from '@/lib/badges';
import { colors } from '@/lib/theme';
import { getUnlockedBadges } from '@/storage/badgesStorage';
import type { UnlockedBadge } from '@/types/badges';

export default function BadgesScreen() {
  const { language } = useLanguage();
  const [unlockedBadges, setUnlockedBadges] = useState<UnlockedBadge[]>([]);

  useFocusEffect(
    useCallback(() => {
    async function loadBadges() {
      const savedBadges = await getUnlockedBadges();
      setUnlockedBadges(savedBadges);
    }

    void loadBadges();
    }, []),
  );

  const unlockedBadgeIds = useMemo(() => new Set(unlockedBadges.map((badge) => badge.badgeId)), [unlockedBadges]);
  const unlockedDefinitions = useMemo(
    () => BADGE_CATALOG.filter((badge) => unlockedBadgeIds.has(badge.id)),
    [unlockedBadgeIds],
  );
  const lockedDefinitions = useMemo(
    () => BADGE_CATALOG.filter((badge) => !unlockedBadgeIds.has(badge.id)),
    [unlockedBadgeIds],
  );

  const subtitle =
    language === 'fr'
      ? `${unlockedDefinitions.length} débloqué(s) sur ${BADGE_CATALOG.length}. Continue !`
      : `${unlockedDefinitions.length} unlocked out of ${BADGE_CATALOG.length}. Keep going!`;

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: language === 'fr' ? 'Badges' : 'Badges' }} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{language === 'fr' ? 'Succès' : 'Achievements'}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{language === 'fr' ? 'Débloqués' : 'Unlocked'}</Text>
          {unlockedDefinitions.length === 0 ? (
            <Text style={styles.emptyText}>{language === 'fr' ? 'Aucun badge pour le moment.' : 'No badges unlocked yet.'}</Text>
          ) : (
            unlockedDefinitions.map((badge) => {
              const unlocked = unlockedBadges.find((item) => item.badgeId === badge.id);

              return (
                <View key={badge.id} style={[styles.badgeCard, styles.unlockedCard]}>
                  <Text style={styles.badgeTitle}>
                    {badge.emoji ?? '🏅'} {getBadgeTitle(badge, language)}
                  </Text>
                  <Text style={styles.badgeDescription}>{getBadgeDescription(badge, language)}</Text>
                  {unlocked ? (
                    <Text style={styles.unlockedAt}>
                      {language === 'fr' ? 'Débloqué le' : 'Unlocked on'} {new Date(unlocked.unlockedAt).toLocaleDateString('en-US')}
                    </Text>
                  ) : null}
                </View>
              );
            })
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{language === 'fr' ? 'À débloquer' : 'Locked'}</Text>
          {lockedDefinitions.map((badge) => (
            <View key={badge.id} style={[styles.badgeCard, styles.lockedCard]}>
              <Text style={styles.badgeTitle}>
                {badge.emoji ?? '🔒'} {getBadgeTitle(badge, language)}
              </Text>
              <Text style={styles.badgeDescription}>{getBadgeDescription(badge, language)}</Text>
              <Text style={styles.lockedLabel}>{language === 'fr' ? 'Verrouillé' : 'Locked'}</Text>
            </View>
          ))}
        </View>
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
    padding: 24,
    paddingBottom: 40,
  },
  title: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.secondaryText,
    fontSize: 15,
    marginTop: 8,
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
    gap: 10,
  },
  sectionTitle: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  badgeCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  unlockedCard: {
    backgroundColor: 'rgba(255, 213, 74, 0.14)',
    borderColor: colors.primary,
  },
  lockedCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    opacity: 0.8,
  },
  badgeTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
  },
  badgeDescription: {
    color: colors.secondaryText,
    fontSize: 14,
    marginTop: 6,
    lineHeight: 20,
  },
  unlockedAt: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 10,
  },
  lockedLabel: {
    color: colors.mutedText,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 10,
  },
  emptyText: {
    color: colors.mutedText,
    fontSize: 14,
    marginBottom: 8,
  },
});
