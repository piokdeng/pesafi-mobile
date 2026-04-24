import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Share,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '@/lib/theme';
import { Spacing, FontSize, FontWeight, Radius } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/auth';
import { formatUsd, truncateAddress } from '@/lib/currency';
import type { Transaction } from '@/lib/types';

type Row = {
  label: string;
  value: string;
  mono?: boolean;
  copyable?: boolean;
  link?: string;
};

function prettyStatus(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function prettyMethod(cat?: string | null, type?: string): string {
  if (type === 'deposit') {
    const labels: Record<string, string> = {
      kotani_pay: 'Mobile money (Kotani Pay)',
      coinbase: 'Coinbase Onramp',
      transak: 'Transak',
      yellow_card: 'Yellow Card',
      base: 'Base network',
      internal: 'PesaFi internal',
    };
    return cat ? labels[cat] ?? cat : 'Unknown';
  }
  if (type === 'withdrawal') {
    if (cat === 'kotani_pay') return 'Mobile money (Kotani Pay)';
    if (cat === 'yellow_card') return 'Yellow Card';
    return 'Bank / card';
  }
  if (type === 'send') return 'On-chain transfer (Base)';
  if (type === 'receive') return 'On-chain transfer (Base)';
  return 'Unknown';
}

function prettyType(tx: Transaction): string {
  switch (tx.type) {
    case 'send': return 'Sent money';
    case 'receive': return 'Received money';
    case 'deposit': return 'Deposit';
    case 'withdrawal': return 'Withdrawal';
    default: return tx.type;
  }
}

function prettyCounterparty(tx: Transaction): string {
  const meta = tx.metadata ?? {};
  if (tx.type === 'send' || tx.type === 'withdrawal') {
    return meta.accountName || meta.destination || meta.phoneNumber || truncateAddress(tx.to_address ?? '') || '—';
  }
  if (tx.type === 'receive') {
    return truncateAddress(tx.from_address ?? '') || '—';
  }
  if (tx.type === 'deposit') {
    return 'PesaFi wallet';
  }
  return '—';
}

export default function TxDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const [tx, setTx] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data, error } = await supabase.from('transaction').select('*').eq('id', id).maybeSingle();
      if (error || !data) { setLoading(false); return; }
      const meta = data.metadata
        ? (typeof data.metadata === 'string' ? JSON.parse(data.metadata) : data.metadata)
        : {};
      setTx({
        id: data.id,
        user_id: data.wallet_id,
        type: data.type,
        status: data.status,
        amount: String(data.usd_amount ?? data.amount ?? '0'),
        currency: data.currency === 'USD' ? 'USD' : 'USDC',
        from_address: data.from_address,
        to_address: data.to_address,
        tx_hash: data.tx_hash,
        category: data.category,
        created_at: data.created_at,
        metadata: meta,
      });
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.centerLoad}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!tx) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="close" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.foreground }]}>Not found</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.centerLoad}>
          <Text style={{ color: colors.mutedForeground }}>This transaction no longer exists.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isIncoming = tx.type === 'receive' || tx.type === 'deposit';
  const isPending = tx.status === 'pending';
  const isFailed = tx.status === 'failed' || tx.status === 'refunded';
  const statusColor = isFailed ? colors.destructive : isPending ? colors.warning : colors.success;
  const statusBg = isFailed ? colors.destructiveBg : isPending ? colors.warningBg : colors.successBg;
  const amount = parseFloat(tx.amount) || 0;
  const sign = isIncoming ? '+' : '-';

  const createdDate = new Date(tx.created_at);
  const dateStr = createdDate.toLocaleString([], {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });

  const meta = tx.metadata ?? {};
  const counterparty = prettyCounterparty(tx);
  const method = prettyMethod(tx.category, tx.type);

  const rows: Row[] = [
    { label: 'Type', value: prettyType(tx) },
    { label: 'Method', value: method },
  ];
  if (counterparty && counterparty !== '—') rows.push({ label: tx.type === 'receive' || tx.type === 'deposit' ? 'From' : 'To', value: counterparty });
  if (meta.phoneNumber) rows.push({ label: 'Phone', value: meta.phoneNumber });
  if (meta.provider) rows.push({ label: 'Provider', value: meta.provider });
  if (meta.localCurrency && meta.localAmount) {
    rows.push({ label: 'Local amount', value: `${meta.localCurrency} ${Number(meta.localAmount).toLocaleString()}` });
  }
  rows.push({ label: 'Reference', value: tx.id, mono: true, copyable: true });
  if (tx.tx_hash) {
    rows.push({
      label: 'Transaction hash',
      value: truncateAddress(tx.tx_hash),
      mono: true,
      copyable: true,
      link: `https://basescan.org/tx/${tx.tx_hash}`,
    });
  }
  if (tx.to_address && tx.type !== 'deposit') {
    rows.push({ label: 'To address', value: truncateAddress(tx.to_address), mono: true, copyable: true });
  }
  if (tx.from_address && tx.type !== 'withdrawal') {
    rows.push({ label: 'From address', value: truncateAddress(tx.from_address), mono: true, copyable: true });
  }
  rows.push({ label: 'Date & time', value: dateStr });

  const handleCopy = async (value: string) => {
    await Clipboard.setStringAsync(value);
    Alert.alert('Copied', 'Value copied to clipboard.');
  };

  const handleShare = async () => {
    await Share.share({
      message: `PesaFi ${prettyType(tx)}\n${sign}${formatUsd(amount)}\n${dateStr}\nRef: ${tx.id}`,
    });
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="close" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Transaction</Text>
        <TouchableOpacity onPress={handleShare} hitSlop={10}>
          <Ionicons name="share-outline" size={22} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Hero */}
        <View style={styles.hero}>
          <View
            style={[
              styles.heroIcon,
              { backgroundColor: statusBg, borderColor: statusColor + '40' },
            ]}
          >
            <Ionicons
              name={
                isFailed ? 'close' :
                isPending ? 'time-outline' :
                isIncoming ? 'arrow-down' : 'arrow-up'
              }
              size={32}
              color={statusColor}
            />
          </View>
          <Text style={[styles.heroAmount, { color: isFailed ? colors.destructive : isIncoming ? colors.success : colors.foreground }]}>
            {isFailed ? '' : sign}{formatUsd(amount)}
          </Text>
          <View style={[styles.statusPill, { backgroundColor: statusBg, borderColor: statusColor + '50' }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>{prettyStatus(tx.status)}</Text>
          </View>
          <Text style={[styles.heroCounterparty, { color: colors.foreground }]}>
            {prettyType(tx)}
            {counterparty && counterparty !== '—' ? ` • ${counterparty}` : ''}
          </Text>
          <Text style={[styles.heroDate, { color: colors.mutedForeground }]}>{dateStr}</Text>
        </View>

        {/* Details */}
        <Card padding="lg" style={{ marginTop: Spacing.lg }}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Details</Text>
          {rows.map((row, idx) => (
            <View key={idx}>
              <View style={styles.row}>
                <Text style={[styles.rowLabel, { color: colors.mutedForeground }]}>{row.label}</Text>
                <View style={styles.rowRight}>
                  <Text
                    style={[
                      styles.rowValue,
                      { color: colors.foreground },
                      row.mono && { fontFamily: 'monospace', fontSize: FontSize.sm },
                    ]}
                    numberOfLines={1}
                  >
                    {row.value}
                  </Text>
                  {row.copyable && (
                    <TouchableOpacity onPress={() => handleCopy(row.value === truncateAddress(tx.tx_hash ?? '') ? (tx.tx_hash ?? '') : row.value)} hitSlop={8}>
                      <Ionicons name="copy-outline" size={15} color={colors.primary} />
                    </TouchableOpacity>
                  )}
                  {row.link && (
                    <TouchableOpacity onPress={() => Linking.openURL(row.link!)} hitSlop={8}>
                      <Ionicons name="open-outline" size={15} color={colors.primary} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
              {idx < rows.length - 1 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
            </View>
          ))}
        </Card>

        {/* Info note for failed / pending */}
        {isFailed && (
          <Card style={{ marginTop: Spacing.md, backgroundColor: colors.destructiveBg, borderColor: colors.destructive + '40' }}>
            <View style={{ flexDirection: 'row', gap: Spacing.md }}>
              <Ionicons name="alert-circle-outline" size={20} color={colors.destructive} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.destructive, fontWeight: FontWeight.semibold, marginBottom: 4 }}>
                  Transaction failed
                </Text>
                <Text style={{ color: colors.foregroundSubtle, fontSize: FontSize.sm, lineHeight: 18 }}>
                  Your funds were not moved. You can try the transfer again from the Transfer tab.
                </Text>
              </View>
            </View>
          </Card>
        )}

        {isPending && (
          <Card style={{ marginTop: Spacing.md, backgroundColor: colors.warningBg, borderColor: colors.warning + '40' }}>
            <View style={{ flexDirection: 'row', gap: Spacing.md }}>
              <Ionicons name="time-outline" size={20} color={colors.warning} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.warning, fontWeight: FontWeight.semibold, marginBottom: 4 }}>
                  Processing
                </Text>
                <Text style={{ color: colors.foregroundSubtle, fontSize: FontSize.sm, lineHeight: 18 }}>
                  This transaction is being settled. It usually takes less than a minute. If it fails, your balance is not affected.
                </Text>
              </View>
            </View>
          </Card>
        )}

        {/* Bottom actions */}
        <View style={{ height: Spacing.lg }} />
        <Button
          title="Share receipt"
          variant="outline"
          onPress={handleShare}
          icon={<Ionicons name="share-outline" size={18} color={colors.foreground} />}
          fullWidth
        />
        {tx.tx_hash && (
          <>
            <View style={{ height: Spacing.sm }} />
            <Button
              title="View on Basescan"
              variant="ghost"
              onPress={() => Linking.openURL(`https://basescan.org/tx/${tx.tx_hash}`)}
              icon={<Ionicons name="open-outline" size={18} color={colors.primary} />}
              fullWidth
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  title: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  centerLoad: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  hero: { alignItems: 'center', paddingVertical: Spacing.lg },
  heroIcon: {
    width: 64, height: 64, borderRadius: 32,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2,
    marginBottom: Spacing.md,
  },
  heroAmount: {
    fontSize: FontSize.display,
    fontWeight: FontWeight.bold,
    letterSpacing: -1,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    marginTop: Spacing.sm,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, letterSpacing: 0.3 },
  heroCounterparty: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, marginTop: Spacing.md },
  heroDate: { fontSize: FontSize.sm, marginTop: 4 },

  sectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  rowLabel: { fontSize: FontSize.sm, flexShrink: 0 },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1, justifyContent: 'flex-end' },
  rowValue: { fontSize: FontSize.base, fontWeight: FontWeight.medium, textAlign: 'right' },
  divider: { height: 1 },
});
