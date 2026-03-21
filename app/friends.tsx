import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { FriendCard } from '@/components/friend-card';
import { colors } from '@/lib/theme';

const mockFriends = [
  { name: 'Emma', reactionTime: '06 s' },
  { name: 'Lucas', reactionTime: '14 s' },
  { name: 'Sarah', reactionTime: '1m10' },
];

export default function FriendsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Friends</Text>
        <Text style={styles.subtitle}>Your wake crew will appear here.</Text>

        <View style={styles.list}>
          {mockFriends.map((friend) => (
            <FriendCard key={friend.name} name={friend.name} reactionTime={friend.reactionTime} />
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
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    color: colors.secondaryText,
    fontSize: 16,
    marginBottom: 24,
  },
  list: {
    marginTop: 8,
  },
});
