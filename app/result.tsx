import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/lib/theme';

const ranking = [
  { name: 'You', time: '12 s', highlight: true },
  { name: 'Emma', time: '18 s' },
  { name: 'Lucas', time: '25 s' },
];

export default function ResultScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.kicker}>Mock wake result</Text>
        <Text style={styles.title}>12 seconds</Text>
        <Text style={styles.subtitle}>Reaction time</Text>

        <View style={styles.heroCard}>
          <Text style={styles.percentile}>83rd percentile</Text>
          <Text style={styles.helper}>Faster than 83% of users</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Friends ranking preview</Text>
          {ranking.map((entry, index) => (
            <View key={entry.name} style={[styles.rankRow, entry.highlight && styles.rankRowHighlight]}>
              <Text style={styles.rankIndex}>#{index + 1}</Text>
              <Text style={styles.rankName}>{entry.name}</Text>
              <Text style={styles.rankTime}>{entry.time}</Text>
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  kicker: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  title: {
    color: colors.text,
    fontSize: 44,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.secondaryText,
    fontSize: 18,
    marginTop: 8,
    marginBottom: 24,
  },
  heroCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
  },
  percentile: {
    color: colors.primary,
    fontSize: 28,
    fontWeight: '800',
  },
  helper: {
    color: colors.secondaryText,
    fontSize: 15,
    marginTop: 8,
  },
  section: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 24,
    padding: 20,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rankRowHighlight: {
    backgroundColor: 'rgba(255, 213, 74, 0.08)',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  rankIndex: {
    color: colors.mutedText,
    width: 40,
    fontSize: 15,
  },
  rankName: {
    color: colors.text,
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  rankTime: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '700',
  },
});
