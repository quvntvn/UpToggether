import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { colors } from '@/lib/theme';

const TAB_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  index: 'home',
  alarms: 'alarm',
  squad: 'people',
  progress: 'stats-chart',
  settings: 'settings',
};

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '700' },
        sceneStyle: { backgroundColor: colors.background },
        tabBarStyle: {
          backgroundColor: '#111C33',
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 72,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedText,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
        tabBarIcon: ({ color, size, focused }) => (
          <Ionicons
            name={TAB_ICON[route.name] ?? 'ellipse'}
            size={focused ? size + 2 : size}
            color={color}
          />
        ),
      })}>
      <Tabs.Screen name="index" options={{ title: 'Home', headerTitle: 'UpTogether' }} />
      <Tabs.Screen name="alarms" options={{ title: 'Alarms' }} />
      <Tabs.Screen name="squad" options={{ title: 'Squad' }} />
      <Tabs.Screen name="progress" options={{ title: 'Progress' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}
