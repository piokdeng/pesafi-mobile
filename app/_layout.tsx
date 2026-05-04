import 'react-native-url-polyfill/auto';
import React, { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '@/lib/auth';
import { PreferencesProvider } from '@/lib/preferences';
import { ThemeProvider, useTheme } from '@/lib/theme';
import { NotificationProvider } from '@/lib/notifications';
import { AnimatedSplash } from '@/components/AnimatedSplash';

function RootNavigator() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const { colors, isDark } = useTheme();

  useEffect(() => {
    if (loading) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      if (user.account_type === 'business') {
        router.replace('/(business)');
      } else {
        router.replace('/(tabs)');
      }
    }
  }, [user, loading, segments]);

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(business)" />
        <Stack.Screen name="send" options={{ presentation: 'modal' }} />
        <Stack.Screen name="receive" options={{ presentation: 'modal' }} />
        <Stack.Screen name="deposit" options={{ presentation: 'modal' }} />
        <Stack.Screen name="withdraw" options={{ presentation: 'modal' }} />
        <Stack.Screen name="fx" options={{ presentation: 'modal' }} />
        <Stack.Screen name="scan" options={{ presentation: 'modal' }} />
        <Stack.Screen name="tx/[id]" options={{ presentation: 'modal' }} />
        <Stack.Screen name="notifications" options={{ presentation: 'modal' }} />
        <Stack.Screen name="search" options={{ presentation: 'modal' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [splashDone, setSplashDone] = useState(false);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <PreferencesProvider>
              <NotificationProvider>
                <RootNavigator />
                {!splashDone && <AnimatedSplash onFinish={() => setSplashDone(true)} />}
              </NotificationProvider>
            </PreferencesProvider>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
