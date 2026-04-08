import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { Stack, usePathname, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { LanguageProvider } from '@/context/language-context';
import { isNativeNotificationsSupported } from '@/lib/isNativeNotificationsSupported';
import { colors } from '@/lib/theme';
import { getWakeRouteParamsFromNotification } from '@/services/alarm';
import { getUserProfile } from '@/storage/profileStorage';

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
    if (!isNativeNotificationsSupported) {
      return;
    }

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

function OnboardingGate() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function verifyOnboarding() {
      const profile = await getUserProfile();
      const isOnboardingComplete = Boolean(profile?.onboardingCompleted);
      const isOnOnboardingScreen = pathname === '/onboarding';

      if (!isMounted) {
        return;
      }

      if (!isOnboardingComplete && !isOnOnboardingScreen) {
        router.replace('/onboarding');
      } else if (isOnboardingComplete && isOnOnboardingScreen) {
        router.replace('/(tabs)');
      }

      setIsLoading(false);
    }

    void verifyOnboarding();

    return () => {
      isMounted = false;
    };
  }, [pathname, router]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return null;
}

export default function RootLayout() {
  return (
    <LanguageProvider>
      <ThemeProvider value={appTheme}>
        <OnboardingGate />
        <AlarmNotificationBridge />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: '#0F172A' },
            headerShadowVisible: false,
            headerTintColor: '#FFFFFF',
            headerTitleStyle: { fontWeight: '700' },
            contentStyle: { backgroundColor: '#0F172A' },
          }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
          <Stack.Screen name="set-alarm" />
          <Stack.Screen name="alarm/[id]" options={{ title: 'Alarm editor' }} />
          <Stack.Screen name="friends" />
          <Stack.Screen name="group" />
          <Stack.Screen name="buddy" />
          <Stack.Screen name="wake" options={{ headerShown: false, gestureEnabled: false, presentation: 'fullScreenModal' }} />
          <Stack.Screen name="result" />
          <Stack.Screen name="history" />
          <Stack.Screen name="badges" />
          <Stack.Screen name="contracts" />
          <Stack.Screen name="settings" />
        </Stack>
        <StatusBar style="light" />
      </ThemeProvider>
    </LanguageProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
});
