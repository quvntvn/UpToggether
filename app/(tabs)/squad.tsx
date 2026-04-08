import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { buildMockFriendReactions } from '@/lib/mockReactions';
import { colors } from '@/lib/theme';

export default function SquadTabScreen() {
  const router = useRouter();
  const reactions = buildMockFriendReactions(new Date()).slice(0, 3);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Morning Squad</Text>
        <Text style={styles.subtitle}>Social accountability in one place.</Text>

        <Pressable style={styles.card} onPress={() => router.push('/group')}>
          <Text style={styles.cardTitle}>Squad ranking</Text>
          <Text style={styles.cardBody}>Check today&apos;s ranking, streak, and group feed updates.</Text>
        </Pressable>

        <Pressable style={styles.card} onPress={() => router.push('/buddy')}>
          <Text style={styles.cardTitle}>Wake Buddy</Text>
          <Text style={styles.cardBody}>See your buddy status, head-to-head battle, and accountability prompts.</Text>
        </Pressable>

        <Pressable style={styles.card} onPress={() => router.push('/friends')}>
          <Text style={styles.cardTitle}>Friends</Text>
          <Text style={styles.cardBody}>Browse your mock crew and their wake-up behavior.</Text>
        </Pressable>

        <View style={styles.feedCard}>
          <Text style={styles.feedTitle}>Quick reactions</Text>
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
