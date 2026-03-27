import { Stack } from 'expo-router';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { mockFriends } from '@/lib/mockFriends';
import { buildTodayRanking } from '@/lib/mockRanking';
import { colors } from '@/lib/theme';
import { formatReactionTime } from '@/utils/time';

export default function FriendsScreen() {
  const previewRanking = buildTodayRanking(18).filter((entry) => !entry.isUser);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Friends' }} />

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Friends</Text>
        <Text style={styles.subtitle}>Your local morning crew (mock data).</Text>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Today&apos;s snapshot</Text>
          {previewRanking.map((entry) => (
            <View key={entry.id} style={styles.snapshotRow}>
              <Text style={styles.snapshotName}>
                {entry.avatar} {entry.name}
              </Text>
              <Text style={styles.snapshotValue}>{formatReactionTime(entry.reactionSeconds)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.list}>
          {mockFriends.map((friend) => (
            <View key={friend.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>{friend.avatar}</Text>
                </View>
                <View style={styles.headerBody}>
                  <Text style={styles.name}>{friend.name}</Text>
                  <Text style={styles.roleLabel}>{friend.archetypeLabel}</Text>
                </View>
              </View>

              <Text style={styles.behavior}>{friend.behaviorSummary}</Text>
              <Text style={styles.meta}>Wake behavior: {friend.behavior}</Text>
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
    paddingBottom: 32,
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    color: colors.secondaryText,
    fontSize: 16,
    marginBottom: 18,
  },
  sectionCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 10,
  },
  snapshotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  snapshotName: {
    color: colors.secondaryText,
    fontSize: 14,
  },
  snapshotValue: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  list: {
    marginTop: 4,
    gap: 10,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    height: 42,
    width: 42,
    borderRadius: 21,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
  },
  headerBody: {
    marginLeft: 12,
  },
  name: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  roleLabel: {
    color: colors.primary,
    fontSize: 13,
    marginTop: 2,
    fontWeight: '700',
  },
  behavior: {
    color: colors.secondaryText,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 12,
  },
  meta: {
    color: colors.mutedText,
    fontSize: 12,
    marginTop: 10,
    textTransform: 'capitalize',
  },
});
