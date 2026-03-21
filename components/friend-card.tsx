import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/lib/theme';

type FriendCardProps = {
  name: string;
  reactionTime: string;
};

export function FriendCard({ name, reactionTime }: FriendCardProps) {
  return (
    <View style={styles.card}>
      <View>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.caption}>Wake crew member</Text>
      </View>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{reactionTime}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    marginBottom: 12,
  },
  name: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  caption: {
    color: colors.mutedText,
    fontSize: 13,
    marginTop: 4,
  },
  badge: {
    backgroundColor: 'rgba(255, 213, 74, 0.14)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  badgeText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
});
