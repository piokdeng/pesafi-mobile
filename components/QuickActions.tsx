import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing, FontSize, FontWeight, Shadow } from '@/constants/theme';

type Action = {
  key: 'fx' | 'send' | 'receive' | 'deposit' | 'withdraw';
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  gradient: [string, string];
};

type Props = {
  onFx: () => void;
  onSend: () => void;
  onReceive: () => void;
  onDeposit: () => void;
  onWithdraw: () => void;
};

/**
 * 5-action quick row matching the updated web dashboard
 * (src/app/dashboard/AutoWalletDashboard.tsx lines 650-661):
 * FX (amber gradient, new) → Send → Receive → Deposit → Withdraw.
 */
export function QuickActions({ onFx, onSend, onReceive, onDeposit, onWithdraw }: Props) {
  const actions: Action[] = [
    { key: 'fx',       label: 'FX (SSP)', icon: 'swap-horizontal', onPress: onFx,       gradient: ['#F59E0B', '#B45309'] },
    { key: 'send',     label: 'Send',     icon: 'paper-plane',     onPress: onSend,     gradient: ['#3B82F6', '#1D4ED8'] },
    { key: 'receive',  label: 'Receive',  icon: 'arrow-down',      onPress: onReceive,  gradient: ['#22C55E', '#15803D'] },
    { key: 'deposit',  label: 'Deposit',  icon: 'add-circle',      onPress: onDeposit,  gradient: ['#F97316', '#C2410C'] },
    { key: 'withdraw', label: 'Withdraw', icon: 'arrow-up-circle', onPress: onWithdraw, gradient: ['#8B5CF6', '#6D28D9'] },
  ];

  return (
    <View style={styles.grid}>
      {actions.map((a) => (
        <TouchableOpacity
          key={a.key}
          activeOpacity={0.85}
          onPress={a.onPress}
          style={styles.cell}
        >
          <LinearGradient
            colors={a.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.action}
          >
            <Ionicons name={a.icon} size={22} color="white" />
            <Text style={styles.label}>{a.label}</Text>
          </LinearGradient>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  cell: {
    width: '47.5%',
    flexGrow: 1,
  },
  action: {
    height: 84,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    ...Shadow.card,
  },
  label: {
    color: 'white',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
});
