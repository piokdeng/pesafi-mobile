import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme';
import { FontWeight, FontSize, Spacing } from '@/constants/theme';
import { DESKTOP_BREAKPOINT, SIDEBAR_WIDTH } from '@/lib/responsive';

const VISIBLE_TABS = ['index', 'transfer', 'fx', 'money', 'activity'];

const TAB_META: Record<string, { label: string; icon: string; iconFocused: string }> = {
  index:    { label: 'Home',     icon: 'home-outline',          iconFocused: 'home' },
  transfer: { label: 'Transfer', icon: 'swap-vertical-outline', iconFocused: 'swap-vertical' },
  fx:       { label: 'FX',       icon: 'globe-outline',         iconFocused: 'globe' },
  money:    { label: 'Money',    icon: 'wallet-outline',        iconFocused: 'wallet' },
  activity: { label: 'Activity', icon: 'time-outline',          iconFocused: 'time' },
};

export function AdaptiveTabBar({ state, navigation }: BottomTabBarProps) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= DESKTOP_BREAKPOINT;

  const visibleRoutes = state.routes.filter((r) => VISIBLE_TABS.includes(r.name));

  if (isDesktop) {
    return (
      <View style={[styles.sidebar, { backgroundColor: colors.tabBar, borderRightColor: colors.tabBarBorder }]}>
        {/* Logo */}
        <View style={styles.sidebarLogo}>
          <View style={[styles.logoCircle, { backgroundColor: colors.primary }]}>
            <Text style={styles.logoText}>P</Text>
          </View>
          <Text style={[styles.logoLabel, { color: colors.foreground }]}>PesaFi</Text>
        </View>

        {/* Nav items */}
        <View style={styles.sidebarNav}>
          {visibleRoutes.map((route) => {
            const isFocused = state.index === state.routes.indexOf(route);
            const meta = TAB_META[route.name];
            if (!meta) return null;

            return (
              <TouchableOpacity
                key={route.key}
                onPress={() => navigation.navigate(route.name)}
                style={[
                  styles.sidebarItem,
                  isFocused && { backgroundColor: colors.primary + '18' },
                ]}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={(isFocused ? meta.iconFocused : meta.icon) as any}
                  size={20}
                  color={isFocused ? colors.primary : colors.mutedForeground}
                />
                <Text
                  style={[
                    styles.sidebarLabel,
                    { color: isFocused ? colors.primary : colors.mutedForeground },
                    isFocused && { fontWeight: FontWeight.semibold },
                  ]}
                >
                  {meta.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  }

  // Mobile — bottom tab bar
  return (
    <View style={[styles.bottomBar, { backgroundColor: colors.tabBar, borderTopColor: colors.tabBarBorder }]}>
      {visibleRoutes.map((route) => {
        const isFocused = state.index === state.routes.indexOf(route);
        const meta = TAB_META[route.name];
        if (!meta) return null;

        return (
          <TouchableOpacity
            key={route.key}
            onPress={() => navigation.navigate(route.name)}
            style={styles.bottomItem}
            activeOpacity={0.7}
          >
            <Ionicons
              name={(isFocused ? meta.iconFocused : meta.icon) as any}
              size={22}
              color={isFocused ? colors.primary : colors.mutedForeground}
            />
            <Text
              style={[
                styles.bottomLabel,
                { color: isFocused ? colors.primary : colors.mutedForeground },
              ]}
            >
              {meta.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  // Sidebar (desktop)
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    borderRightWidth: 1,
    paddingTop: 24,
    paddingHorizontal: Spacing.md,
  },
  sidebarLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.xxl,
  },
  logoCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { color: 'white', fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  logoLabel: { fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  sidebarNav: { gap: Spacing.xs },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    borderRadius: 10,
  },
  sidebarLabel: { fontSize: FontSize.base },

  // Bottom bar (mobile)
  bottomBar: {
    flexDirection: 'row',
    borderTopWidth: 0.5,
    height: 88,
    paddingTop: 6,
    paddingBottom: 28,
  },
  bottomItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  bottomLabel: {
    fontSize: 10,
    fontWeight: FontWeight.semibold,
  },
});
