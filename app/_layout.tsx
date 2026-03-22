import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { LanguageProvider } from '@/context/language-context';

const appTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#0F172A',
    card: '#1E293B',
    border: '#334155',
    primary: '#FFD54A',
    text: '#FFFFFF',
    notification: '#FFD54A',
  },
};

export default function RootLayout() {
  return (
    <LanguageProvider>
      <ThemeProvider value={appTheme}>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: '#0F172A' },
            headerShadowVisible: false,
            headerTintColor: '#FFFFFF',
            headerTitleStyle: { fontWeight: '700' },
            contentStyle: { backgroundColor: '#0F172A' },
          }}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="set-alarm" />
          <Stack.Screen name="friends" />
          <Stack.Screen name="wake" options={{ presentation: 'fullScreenModal' }} />
          <Stack.Screen name="result" />
          <Stack.Screen name="settings" />
        </Stack>
        <StatusBar style="light" />
      </ThemeProvider>
    </LanguageProvider>
  );
}
