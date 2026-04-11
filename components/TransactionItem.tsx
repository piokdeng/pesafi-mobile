import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing, FontSize, FontWeight } from '@/constants/theme';
import { formatUsd, truncateAddress } from '@/lib/currency';
import type { Transaction, Contact } from '@/lib/types';

type Props = {
  tx: Transaction;
  contacts?: Contact[];
  onPress?: () => void;
  hideAmount?: boolean;
};

function getLabel(tx: Transaction, contacts: Contact[] = []): string {
  const meta = tx.metadata ?? {};
  const findName = (addr?: string | null, phone?: string | null) => {
    if (addr) {
      const m = contacts.find((c) => c.wallet_address?.toLowerCase() === addr.toLowerCase());
      if (m) return m.name;
    }
    if (phone) {
      const m = contacts.find((c) => c.phone_number === phone);
      if (m) return m.name;
    }
    return null;
  };

  switch (tx.type) {
    case 'send': {
      const addr = tx.to_address ?? meta.recipientAddress;
      const name = findName(addr, null);
      return `Sent to ${name ?? truncateAddress(addr)}`;
    }
    case 'receive': {
      const addr = tx.from_address ?? meta.senderAddress;
      const name = findName(addr, null);
      return `Received from ${name ?? truncateAddress(addr)}`;
    }
    case 'deposit': {
      const labels: Record<string, string> = {
        kotani_pay: 'Kotani Pay',
        coinbase: 'Coinbase',
        transak: 'Transak',
        yellow_card: 'Yellow Card',
        base: 'Base Network',
        internal: 'PesaFi',
      };
      return tx.category ? `Deposit via ${labels[tx.category] ?? tx.category}` : 'Deposit';
    }
    case 'withdrawal': {
      const phone = meta.destination ?? meta.phoneNumber;
      const name = meta.accountName ?? findName(tx.to_address, phone);
      if (name) return `Sent to ${name}`;
      if (phone) return `Sent to ${phone}`;
      return `Withdrawal to ${truncateAddress(tx.to_address)}`;
    }
    default:
      return tx.type;
  }
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'Just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function TransactionItem({ tx, contacts = [], onPress, hideAmount }: Props) {
  const isIncoming = tx.type === 'receive' || tx.type === 'deposit';
  const isPending = tx.status === 'pending';
  const isFailed = tx.status === 'failed' || tx.status === 'refunded';

  const iconName: keyof typeof Ionicons.glyphMap =
    tx.type === 'send'       ? 'arrow-up-outline' :
    tx.type === 'receive'    ? 'arrow-down-outline' :
    tx.type === 'deposit'    ? 'add-circle-outline' :
                               'arrow-up-circle-outline';

  const iconBg =
    isFailed  ? Colors.destructiveBg :
    isPending ? Colors.warningBg :
    isIncoming ? Colors.successBg :
    'rgba(249,115,22,0.15)'; // orange tint for outbound

  const iconColor =
    isFailed  ? Colors.destructive :
    isPending ? Colors.warning :
    isIncoming ? Colors.success :
    Colors.accent;

  const amountColor =
    isFailed ? Colors.destructive :
    isIncoming ? Colors.success :
    Colors.foreground;

  const sign = isIncoming ? '+' : '-';

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.row}>
      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={iconName} size={20} color={iconColor} />
      </View>
      <View style={styles.middle}>
        <Text style={styles.label} numberOfLines={1}>{getLabel(tx, contacts)}</Text>
        <Text style={styles.subtitle}>
          {relativeTime(tx.created_at)}
          {isPending && '  •  Pending'}
          {isFailed && `  •  ${tx.status}`}
        </Text>
      </View>
      <Text style={[styles.amount, { color: amountColor }]}>
        {sign}{formatUsd(parseFloat(tx.amount), hideAmount)}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  middle: {
    flex: 1,
  },
  label: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.foreground,
  },
  subtitle: {
    fontSize: FontSize.xs,
    color: Colors.mutedForeground,
    marginTop: 2,
  },
  amount: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
  },
});
