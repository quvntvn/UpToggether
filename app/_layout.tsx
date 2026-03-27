import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { LanguageProvider } from '@/context/language-context';
import { getWakeRouteParamsFromNotification } from '@/services/alarm';

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

function AlarmNotificationBridge() {
  const router = useRouter();
  const hasHandledInitialResponse = useRef(false);

  useEffect(() => {
    const navigateFromResponse = (response: Notifications.NotificationResponse | null) => {
      if (!response) {
        return;
      }

      const params = getWakeRouteParamsFromNotification(response.notification);

      router.replace({
        pathname: '/wake',
        params,
      });
    };

    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      navigateFromResponse(response);
    });

    const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
      const params = getWakeRouteParamsFromNotification(notification);

      router.replace({
        pathname: '/wake',
        params,
      });
    });

    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (hasHandledInitialResponse.current) {
        return;
      }

      hasHandledInitialResponse.current = true;
      navigateFromResponse(response);
    });

    return () => {
      responseSubscription.remove();
      receivedSubscription.remove();
    };
  }, [router]);

  return null;
}

export default function RootLayout() {
  return (
    <LanguageProvider>
      <ThemeProvider value={appTheme}>
        <AlarmNotificationBridge />
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
          <Stack.Screen name="group" />
          <Stack.Screen name="wake" options={{ headerShown: false, gestureEnabled: false, presentation: 'fullScreenModal' }} />
          <Stack.Screen name="result" />
          <Stack.Screen name="history" />
          <Stack.Screen name="settings" />
        </Stack>
        <StatusBar style="light" />
      </ThemeProvider>
    </LanguageProvider>
  );
}
