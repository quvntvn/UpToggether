import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useLanguage } from '@/context/language-context';
import { buildMockFriendReactions } from '@/lib/mockReactions';
import { colors } from '@/lib/theme';

export default function SquadTabScreen() {
  const router = useRouter();
  const { language } = useLanguage();
  const reactions = buildMockFriendReactions(new Date(), language).slice(0, 3);

  const copy =
    language === 'fr'
      ? {
          title: 'Morning Squad',
          subtitle: 'Toute ta responsabilité sociale au même endroit.',
          rankingTitle: 'Classement du squad',
          rankingBody: 'Consulte le classement du jour, la série et les nouvelles du groupe.',
          buddyTitle: 'Wake Buddy',
          buddyBody: 'Vois le statut de ton buddy, votre duel et ses rappels de responsabilité.',
          friendsTitle: 'Amis',
          friendsBody: 'Parcours ton crew local et ses habitudes de réveil.',
          feedTitle: 'Réactions rapides',
        }
      : {
          title: 'Morning Squad',
          subtitle: 'Social accountability in one place.',
          rankingTitle: 'Squad ranking',
          rankingBody: 'Check today’s ranking, streak, and group feed updates.',
          buddyTitle: 'Wake Buddy',
          buddyBody: 'See your buddy status, head-to-head battle, and accountability prompts.',
          friendsTitle: 'Friends',
          friendsBody: 'Browse your mock crew and their wake-up behavior.',
          feedTitle: 'Quick reactions',
        };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{copy.title}</Text>
        <Text style={styles.subtitle}>{copy.subtitle}</Text>

        <Pressable style={styles.card} onPress={() => router.push('/group')}>
          <Text style={styles.cardTitle}>{copy.rankingTitle}</Text>
          <Text style={styles.cardBody}>{copy.rankingBody}</Text>
        </Pressable>

        <Pressable style={styles.card} onPress={() => router.push('/buddy')}>
          <Text style={styles.cardTitle}>{copy.buddyTitle}</Text>
          <Text style={styles.cardBody}>{copy.buddyBody}</Text>
        </Pressable>

        <Pressable style={styles.card} onPress={() => router.push('/friends')}>
          <Text style={styles.cardTitle}>{copy.friendsTitle}</Text>
          <Text style={styles.cardBody}>{copy.friendsBody}</Text>
        </Pressable>

        <View style={styles.feedCard}>
          <Text style={styles.feedTitle}>{copy.feedTitle}</Text>
          {reactions.map((reaction) => (
            <View key={reaction.id} style={styles.feedRow}>
              <Text style={styles.feedDot}>•</Text>
              <Text style={styles.feedText}>
                {reaction.name}: {reaction.message}
                {reaction.emoji ? ` ${reaction.emoji}` : ''}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 40 },
  title: { color: colors.text, fontSize: 30, fontWeight: '800' },
  subtitle: { color: colors.secondaryText, fontSize: 15, marginTop: 6, marginBottom: 14 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 10,
  },
  cardTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
  cardBody: { color: colors.secondaryText, fontSize: 14, lineHeight: 20, marginTop: 7 },
  feedCard: {
    marginTop: 6,
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  feedTitle: { color: colors.primary, fontSize: 14, fontWeight: '800', textTransform: 'uppercase' },
  feedRow: { flexDirection: 'row', marginTop: 8 },
  feedDot: { color: colors.primary, marginRight: 8 },
  feedText: { color: colors.secondaryText, flex: 1, lineHeight: 20 },
});
