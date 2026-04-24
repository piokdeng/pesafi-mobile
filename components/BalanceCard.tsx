import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme';
import { Radius, FontSize, FontWeight, Spacing, Shadow } from '@/constants/theme';
import { formatUsd, formatLocal } from '@/lib/currency';
import { BalanceChart } from './BalanceChart';
import type { Transaction } from '@/lib/types';

type Props = {
  name: string;
  balance: number;
  preferredCurrency: string;
  hideBalance?: boolean;
  hideLocal?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  transactions?: Transaction[];
};

const WIDTH = Dimensions.get('window').width - 32 - 48; // container padding

/**
 * Rebuild a balance history series from transactions.
 * Newest balance is `balance`. Walking backwards through completed tx,
 * we subtract inbound and add outbound. Pending tx are ignored.
 */
function buildHistory(balance: number, txs: Transaction[] = []) {
  if (!txs.length) return undefined;
  const completed = txs.filter(t => t.status === 'completed' || t.status === 'pending');
  if (!completed.length) return undefined;

  // Sort newest first
  const sorted = [...completed].sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const series: { value: number; date: Date }[] = [];
  let running = balance;
  // Add current point
  series.push({ value: running, date: new Date() });

  for (const tx of sorted) {
    const amt = parseFloat(tx.amount) || 0;
    const isIncoming = tx.type === 'receive' || tx.type === 'deposit';
    // Before this tx, balance was opposite direction
    running = isIncoming ? running - amt : running + amt;
    if (running < 0) running = 0;
    series.push({ value: running, date: new Date(tx.created_at) });
  }

  // Reverse so it's oldest → newest
  return series.reverse();
}

export function BalanceCard({
  name,
  balance,
  preferredCurrency,
  hideBalance,
  hideLocal,
  refreshing,
  onRefresh,
  transactions,
}: Props) {
  const { colors } = useTheme();
  const [scrubValue, setScrubValue] = useState<number | null>(null);

  const displayBalance = scrubValue != null ? scrubValue : balance;
  const history = buildHistory(balance, transactions);

  return (
    <LinearGradient
      colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={[styles.glow, styles.glowTopRight]} />
      <View style={[styles.glow, styles.glowBottomLeft]} />

      <View style={styles.headerRow}>
        <View style={styles.brandPill}>
          <Ionicons name="card-outline" size={14} color="rgba(255,255,255,0.85)" />
          <Text style={styles.brandText}>PesaFi</Text>
        </View>
        <TouchableOpacity onPress={onRefresh} disabled={refreshing} style={styles.refreshBtn} hitSlop={8}>
          {refreshing ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Ionicons name="refresh" size={16} color="white" />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.balanceWrap}>
        <Text style={styles.balanceLabel}>
          {scrubValue != null ? 'Balance at selected point' : 'Total balance'}
        </Text>
        <Text style={styles.amount}>{formatUsd(displayBalance, hideBalance && scrubValue == null)}</Text>
        <Text style={styles.amountLocal}>≈ {formatLocal(displayBalance, preferredCurrency, hideLocal && scrubValue == null)}</Text>
      </View>

      <View style={styles.chartWrap}>
        <BalanceChart
          history={history}
          width={WIDTH}
          height={90}
          strokeColor="#FFFFFF"
          onScrub={setScrubValue}
        />
      </View>

      <Text style={styles.hint}>
        {transactions && transactions.length > 0
          ? 'Press & drag on the chart to see balance history'
          : 'Chart will populate as you transact'}
      </Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xxl,
    padding: Spacing.xl,
    paddingBottom: Spacing.md,
    overflow: 'hidden',
    minHeight: 240,
    ...Shadow.hero,
  },
  glow: { position: 'absolute', borderRadius: 999 },
  glowTopRight: {
    width: 200, height: 200,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: -70, right: -70,
  },
  glowBottomLeft: {
    width: 200, height: 200,
    backgroundColor: 'rgba(245,138,31,0.12)',
    bottom: -90, left: -90,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandPill: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  brandText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  refreshBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  balanceWrap: { marginTop: Spacing.lg },
  balanceLabel: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: FontWeight.medium,
  },
  amount: {
    fontSize: FontSize.display,
    fontWeight: FontWeight.bold,
    color: 'white',
    letterSpacing: -1,
    marginTop: 2,
  },
  amountLocal: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  chartWrap: {
    marginTop: Spacing.md,
  },
  hint: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 11,
    marginTop: 8,
    textAlign: 'center',
  },
});
