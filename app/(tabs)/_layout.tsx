import React from 'react';
import { View } from 'react-native';
import { Tabs } from 'expo-router';
import { useTheme } from '@/lib/theme';
import { useResponsive } from '@/lib/responsive';
import { DesktopSidebar } from '@/components/DesktopSidebar';
import { MobileTabBar } from '@/components/MobileTabBar';

export default function TabsLayout() {
  const { colors } = useTheme();
  const { isDesktop } = useResponsive();

  const tabs = (
    <Tabs
      tabBar={isDesktop ? () => null : (props) => <MobileTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
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

  if (isDesktop) {
    return (
      <View style={{ flex: 1, flexDirection: 'row', backgroundColor: colors.background }}>
        <DesktopSidebar />
        <View style={{ flex: 1, overflow: 'hidden' }}>
          {tabs}
        </View>
      </View>
    );
  }

  return tabs;
}
