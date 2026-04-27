import React from 'react';
import { Tabs } from 'expo-router';
import { useTheme } from '@/lib/theme';
import { useResponsive, SIDEBAR_WIDTH } from '@/lib/responsive';
import { AdaptiveTabBar } from '@/components/AdaptiveTabBar';

export default function TabsLayout() {
  const { colors } = useTheme();
  const { isDesktop } = useResponsive();

  return (
    <Tabs
      tabBar={(props) => <AdaptiveTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: colors.background,
          marginLeft: isDesktop ? SIDEBAR_WIDTH : 0,
        },
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="transfer" />
      <Tabs.Screen name="fx" />
      <Tabs.Screen name="money" />
      <Tabs.Screen name="activity" />
      <Tabs.Screen name="contacts" options={{ href: null }} />
      <Tabs.Screen name="profile" options={{ href: null }} />
    </Tabs>
  );
}
