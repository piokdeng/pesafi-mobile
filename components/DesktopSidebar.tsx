import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme';
import { FontWeight, FontSize, Spacing } from '@/constants/theme';
import { SIDEBAR_WIDTH } from '@/lib/responsive';

const NAV_ITEMS = [
  { name: 'index',    label: 'Home',     icon: 'home-outline',          iconFocused: 'home' },
  { name: 'transfer', label: 'Transfer', icon: 'swap-vertical-outline', iconFocused: 'swap-vertical' },
  { name: 'fx',       label: 'FX',       icon: 'globe-outline',         iconFocused: 'globe' },
  { name: 'money',    label: 'Money',    icon: 'wallet-outline',        iconFocused: 'wallet' },
  { name: 'activity', label: 'Activity', icon: 'time-outline',          iconFocused: 'time' },
] as const;

export function DesktopSidebar() {
  const { colors } = useTheme();
  const router = useRouter();
  const segments = useSegments();
  const currentTab = segments[segments.length - 1] ?? 'index';

  return (
    <View style={[styles.sidebar, { backgroundColor: colors.tabBar, borderRightColor: colors.tabBarBorder }]}>
      <View style={styles.logo}>
        <View style={[styles.logoCircle, { backgroundColor: colors.primary }]}>
          <Text style={styles.logoText}>P</Text>
        </View>
        <Text style={[styles.logoLabel, { color: colors.foreground }]}>PesaFi</Text>
      </View>

      <View style={styles.nav}>
        {NAV_ITEMS.map(({ name, label, icon, iconFocused }) => {
          const active = currentTab === name || (name === 'index' && currentTab === '(tabs)');
          return (
            <TouchableOpacity
              key={name}
              onPress={() => router.push(name === 'index' ? '/(tabs)' : `/(tabs)/${name}` as any)}
              style={[styles.item, active && { backgroundColor: colors.primary + '18' }]}
              activeOpacity={0.7}
            >
              <Ionicons
                name={(active ? iconFocused : icon) as any}
                size={20}
                color={active ? colors.primary : colors.mutedForeground}
              />
              <Text style={[
                styles.label,
                { color: active ? colors.primary : colors.mutedForeground },
                active && { fontWeight: FontWeight.semibold },
              ]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: SIDEBAR_WIDTH,
    borderRightWidth: 1,
    paddingTop: 24,
    paddingHorizontal: Spacing.md,
  },
  logo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.xxl,
  },
  logoCircle: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  logoText: { color: 'white', fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  logoLabel: { fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  nav: { gap: 4 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    borderRadius: 10,
  },
  label: { fontSize: FontSize.base },
});
