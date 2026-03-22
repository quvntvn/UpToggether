import { Stack } from 'expo-router';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { FriendCard } from '@/components/friend-card';
import { useLanguage } from '@/context/language-context';
import { colors } from '@/lib/theme';

const mockFriends = [
  { name: 'Emma', reactionTime: '06 s' },
  { name: 'Lucas', reactionTime: '14 s' },
  { name: 'Sarah', reactionTime: '1m10' },
];

export default function FriendsScreen() {
  const { t } = useLanguage();

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: t('friends.title') }} />

      <View style={styles.content}>
        <Text style={styles.title}>{t('friends.title')}</Text>
        <Text style={styles.subtitle}>{t('friends.subtitle')}</Text>

        <View style={styles.list}>
          {mockFriends.map((friend) => (
            <FriendCard
              key={friend.name}
              name={friend.name}
              reactionTime={friend.reactionTime}
              caption={t('friends.memberLabel')}
            />
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
