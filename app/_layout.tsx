import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

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
        <Stack.Screen name="set-alarm" options={{ title: 'Set Alarm' }} />
        <Stack.Screen name="friends" options={{ title: 'Friends' }} />
        <Stack.Screen name="result" options={{ title: 'Wake Result' }} />
      </Stack>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}
