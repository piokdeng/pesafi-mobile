import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, FontSize, FontWeight, Spacing, Shadow } from '@/constants/theme';
import { formatUsd, formatLocal } from '@/lib/currency';

type Props = {
  name: string;
  balance: number;
  preferredCurrency: string;
  hideBalance?: boolean;
  hideLocal?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
};

/**
 * Hero balance card. Mirrors the gradient design from
 * src/app/dashboard/AutoWalletDashboard.tsx (lines 582-647 of the web app):
 * emerald → green → teal gradient with subtle orange + white glows,
 * card chip + WiFi icon decoration, name top-left, big balance bottom-right.
 */
export function BalanceCard({
  name,
  balance,
  preferredCurrency,
  hideBalance,
  hideLocal,
  refreshing,
  onRefresh,
}: Props) {
  return (
    <LinearGradient
      colors={[Colors.gradientStart, Colors.gradientMid, Colors.gradientEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      {/* Subtle decorative glows */}
      <View style={[styles.glow, styles.glowTopRight]} />
      <View style={[styles.glow, styles.glowBottomLeft]} />

      {/* Header row */}
      <View style={styles.headerRow}>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
        <View style={styles.headerRight}>
          <View style={styles.brandPill}>
            <Ionicons name="card-outline" size={14} color="rgba(255,255,255,0.85)" />
            <Text style={styles.brandText}>PesaFi</Text>
          </View>
          <TouchableOpacity
            onPress={onRefresh}
            disabled={refreshing}
            style={styles.refreshBtn}
            hitSlop={8}
          >
            {refreshing ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons name="refresh" size={18} color="white" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom row: card chip + balance */}
      <View style={styles.bottomRow}>
        <View style={styles.chipRow}>
          <View style={styles.chip}>
            <View style={styles.chipLine} />
            <View style={styles.chipLine} />
            <View style={styles.chipLine} />
          </View>
          <Ionicons name="wifi" size={20} color="rgba(255,255,255,0.4)" style={styles.wifiIcon} />
        </View>

        <View style={styles.amountWrap}>
          <Text style={styles.amount}>{formatUsd(balance, hideBalance)}</Text>
          <Text style={styles.amountLocal}>≈ {formatLocal(balance, preferredCurrency, hideLocal)}</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xxl,
    padding: Spacing.xl,
    overflow: 'hidden',
    minHeight: 180,
    ...Shadow.hero,
  },
  glow: {
    position: 'absolute',
    borderRadius: 999,
  },
  glowTopRight: {
    width: 220,
    height: 220,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: -80,
    right: -80,
  },
  glowBottomLeft: {
    width: 220,
    height: 220,
    backgroundColor: 'rgba(245, 138, 31, 0.18)',
    bottom: -100,
    left: -100,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: 'rgba(255,255,255,0.95)',
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  brandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  brandText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  refreshBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomRow: {
    marginTop: Spacing.xxl,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  chipRow: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  chip: {
    width: 44,
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(255,255,255,0.15)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 6,
  },
  chipLine: {
    width: 1,
    height: 18,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  wifiIcon: {
    transform: [{ rotate: '-90deg' }],
  },
  amountWrap: {
    alignItems: 'flex-end',
    flex: 1,
    marginLeft: Spacing.lg,
  },
  amount: {
    fontSize: FontSize.display,
    fontWeight: FontWeight.bold,
    color: 'white',
    letterSpacing: -1,
  },
  amountLocal: {
    fontSize: FontSize.base,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },
});
