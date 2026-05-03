import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme';
import { FontWeight } from '@/constants/theme';

const VISIBLE = ['index', 'transfer', 'fx', 'money', 'activity'];
const META: Record<string, { label: string; icon: string; iconFocused: string }> = {
  index:    { label: 'Home',     icon: 'home-outline',          iconFocused: 'home' },
  transfer: { label: 'Transfer', icon: 'swap-vertical-outline', iconFocused: 'swap-vertical' },
  fx:       { label: 'FX',       icon: 'globe-outline',         iconFocused: 'globe' },
  money:    { label: 'Money',    icon: 'wallet-outline',        iconFocused: 'wallet' },
  activity: { label: 'Activity', icon: 'time-outline',          iconFocused: 'time' },
};

export function MobileTabBar({ state, navigation }: BottomTabBarProps) {
  const { colors } = useTheme();
  const routes = state.routes.filter((r) => VISIBLE.includes(r.name));

  return (
    <View style={[styles.bar, { backgroundColor: colors.tabBar, borderTopColor: colors.tabBarBorder }]}>
      {routes.map((route) => {
        const focused = state.index === state.routes.indexOf(route);
        const meta = META[route.name];
        if (!meta) return null;
        return (
          <TouchableOpacity
            key={route.key}
            onPress={() => navigation.navigate(route.name)}
            style={styles.item}
            activeOpacity={0.7}
          >
            <Ionicons
              name={(focused ? meta.iconFocused : meta.icon) as any}
              size={22}
              color={focused ? colors.primary : colors.mutedForeground}
            />
            <Text style={[styles.label, { color: focused ? colors.primary : colors.mutedForeground }]}>
              {meta.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderTopWidth: 0.5,
    height: 88,
    paddingTop: 6,
    paddingBottom: 28,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  label: {
    fontSize: 10,
    fontWeight: FontWeight.semibold,
  },
});
