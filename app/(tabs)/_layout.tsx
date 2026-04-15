import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { useLanguage } from '@/context/language-context';
import { colors } from '@/lib/theme';

const TAB_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  index: 'home',
  alarms: 'alarm',
  squad: 'people',
  progress: 'stats-chart',
  settings: 'settings',
};

export default function TabsLayout() {
  const { language } = useLanguage();
  const titles =
    language === 'fr'
      ? {
          home: 'Accueil',
          alarms: 'Alarmes',
          squad: 'Squad',
          progress: 'Progrès',
          settings: 'Réglages',
        }
      : {
          home: 'Home',
          alarms: 'Alarms',
          squad: 'Squad',
          progress: 'Progress',
          settings: 'Settings',
        };

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
      <Tabs.Screen name="index" options={{ title: titles.home, headerTitle: 'UpTogether' }} />
      <Tabs.Screen name="alarms" options={{ title: titles.alarms }} />
      <Tabs.Screen name="squad" options={{ title: titles.squad }} />
      <Tabs.Screen name="progress" options={{ title: titles.progress }} />
      <Tabs.Screen name="settings" options={{ title: titles.settings }} />
    </Tabs>
  );
}
