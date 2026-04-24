import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/lib/theme';
import { Spacing, FontSize, FontWeight, Radius } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { getTransactions, getContacts } from '@/lib/api/client';
import { TransactionItem } from '@/components/TransactionItem';
import { truncateAddress, formatUsd, SUPPORTED_CURRENCIES } from '@/lib/currency';
import type { Transaction, Contact } from '@/lib/types';

type SearchResult =
  | { kind: 'transaction'; tx: Transaction }
  | { kind: 'contact'; contact: Contact }
  | { kind: 'action'; label: string; icon: keyof typeof Ionicons.glyphMap; route: string; color: string }
  | { kind: 'currency'; code: string };

const ACTIONS = (colors: any) => [
  { label: 'Send money', icon: 'paper-plane' as const, route: '/send', color: colors.send, keywords: 'send pay transfer' },
  { label: 'Receive money', icon: 'arrow-down' as const, route: '/receive', color: colors.receive, keywords: 'receive request qr address' },
  { label: 'Deposit', icon: 'add-circle' as const, route: '/deposit', color: colors.deposit, keywords: 'deposit fund add money card applepay ach' },
  { label: 'Withdraw', icon: 'arrow-up-circle' as const, route: '/withdraw', color: colors.withdraw, keywords: 'withdraw cashout mobile money' },
  { label: 'FX / Currency conversion', icon: 'swap-horizontal' as const, route: '/(tabs)/fx', color: colors.fx, keywords: 'fx exchange convert rate ssp kes ngn' },
  { label: 'Scan QR code', icon: 'qr-code' as const, route: '/scan', color: colors.accent, keywords: 'scan qr code' },
  { label: 'Contacts', icon: 'people' as const, route: '/(tabs)/contacts', color: colors.primary, keywords: 'contacts friends' },
  { label: 'Profile & settings', icon: 'person-circle' as const, route: '/(tabs)/profile', color: colors.primary, keywords: 'profile settings account theme' },
  { label: 'Activity', icon: 'time' as const, route: '/(tabs)/activity', color: colors.primary, keywords: 'activity history transactions' },
];

export default function SearchScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const [query, setQuery] = useState('');
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [t, c] = await Promise.all([
          user ? getTransactions(user.id) : Promise.resolve([]),
          getContacts(),
        ]);
        setTxs(t);
        setContacts(c);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const actions = useMemo(() => ACTIONS(colors), [colors]);

  const results = useMemo<SearchResult[]>(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    const out: SearchResult[] = [];

    // Actions
    for (const a of actions) {
      if (a.label.toLowerCase().includes(q) || a.keywords.toLowerCase().includes(q)) {
        out.push({ kind: 'action', label: a.label, icon: a.icon, route: a.route, color: a.color });
      }
    }

    // Contacts
    for (const c of contacts) {
      if (
        c.name.toLowerCase().includes(q) ||
        (c.phone_number ?? '').toLowerCase().includes(q) ||
        (c.wallet_address ?? '').toLowerCase().includes(q)
      ) {
        out.push({ kind: 'contact', contact: c });
      }
    }

    // Transactions
    for (const t of txs) {
      const meta = t.metadata ?? {};
      const haystack = [
        t.type, t.status, t.category, t.tx_hash, t.from_address, t.to_address,
        meta.accountName, meta.phoneNumber, meta.destination, meta.provider,
        t.amount,
      ].filter(Boolean).join(' ').toLowerCase();
      if (haystack.includes(q)) out.push({ kind: 'transaction', tx: t });
    }

    // Currencies
    for (const code of SUPPORTED_CURRENCIES) {
      if (code.toLowerCase().includes(q)) out.push({ kind: 'currency', code });
    }

    return out.slice(0, 50);
  }, [query, actions, contacts, txs]);

  const grouped = useMemo(() => {
    const g: Record<string, SearchResult[]> = {
      actions: [], contacts: [], transactions: [], currencies: [],
    };
    for (const r of results) {
      if (r.kind === 'action') g.actions.push(r);
      else if (r.kind === 'contact') g.contacts.push(r);
      else if (r.kind === 'transaction') g.transactions.push(r);
      else if (r.kind === 'currency') g.currencies.push(r);
    }
    return g;
  }, [results]);

  const handleResultPress = (r: SearchResult) => {
    Keyboard.dismiss();
    if (r.kind === 'action') router.replace(r.route as any);
    else if (r.kind === 'contact') router.push('/send');
    else if (r.kind === 'transaction') router.push(`/tx/${r.tx.id}` as any);
    else if (r.kind === 'currency') router.push('/(tabs)/fx');
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="close" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <View style={[styles.searchWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="search" size={18} color={colors.mutedForeground} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search transactions, contacts, actions..."
            placeholderTextColor={colors.mutedForeground}
            style={[styles.searchInput, { color: colors.foreground }]}
            autoFocus
            autoCapitalize="none"
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {!query.trim() ? (
          <View style={{ gap: Spacing.md }}>
            <Text style={[styles.suggestLabel, { color: colors.mutedForeground }]}>
              QUICK ACTIONS
            </Text>
            {actions.slice(0, 6).map((a) => (
              <TouchableOpacity
                key={a.label}
                onPress={() => router.replace(a.route as any)}
                style={[styles.resultRow, { backgroundColor: colors.card, borderColor: colors.border }]}
                activeOpacity={0.7}
              >
                <View style={[styles.resultIcon, { backgroundColor: a.color + '20' }]}>
                  <Ionicons name={a.icon} size={18} color={a.color} />
                </View>
                <Text style={[styles.resultLabel, { color: colors.foreground }]}>{a.label}</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
            ))}
          </View>
        ) : loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : results.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="search-outline" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.foreground }]}>No results for "{query}"</Text>
            <Text style={[styles.emptySubtext, { color: colors.mutedForeground }]}>
              Try a contact name, phone number, currency, or action.
            </Text>
          </View>
        ) : (
          <View style={{ gap: Spacing.lg }}>
            {grouped.actions.length > 0 && (
              <View>
                <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>ACTIONS</Text>
                {grouped.actions.map((r: any, i) => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => handleResultPress(r)}
                    style={[styles.resultRow, { backgroundColor: colors.card, borderColor: colors.border, marginBottom: 6 }]}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.resultIcon, { backgroundColor: r.color + '20' }]}>
                      <Ionicons name={r.icon} size={18} color={r.color} />
                    </View>
                    <Text style={[styles.resultLabel, { color: colors.foreground }]}>{r.label}</Text>
                    <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {grouped.contacts.length > 0 && (
              <View>
                <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>CONTACTS</Text>
                {grouped.contacts.map((r: any, i) => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => handleResultPress(r)}
                    style={[styles.resultRow, { backgroundColor: colors.card, borderColor: colors.border, marginBottom: 6 }]}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.resultIcon, { backgroundColor: colors.primary + '20' }]}>
                      <Ionicons name="person" size={18} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.resultLabel, { color: colors.foreground }]}>{r.contact.name}</Text>
                      <Text style={[styles.resultSub, { color: colors.mutedForeground }]} numberOfLines={1}>
                        {r.contact.phone_number ?? truncateAddress(r.contact.wallet_address)}
                      </Text>
                    </View>
                    <Ionicons name="paper-plane-outline" size={16} color={colors.primary} />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {grouped.transactions.length > 0 && (
              <View>
                <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>TRANSACTIONS</Text>
                <View style={[styles.txWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  {grouped.transactions.map((r: any, i: number) => (
                    <View key={i}>
                      <TransactionItem tx={r.tx} contacts={contacts} />
                      {i < grouped.transactions.length - 1 && (
                        <View style={[styles.divider, { backgroundColor: colors.border }]} />
                      )}
                    </View>
                  ))}
                </View>
              </View>
            )}

            {grouped.currencies.length > 0 && (
              <View>
                <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>CURRENCIES</Text>
                {grouped.currencies.map((r: any, i: number) => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => handleResultPress(r)}
                    style={[styles.resultRow, { backgroundColor: colors.card, borderColor: colors.border, marginBottom: 6 }]}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.resultIcon, { backgroundColor: colors.fx + '20' }]}>
                      <Ionicons name="cash" size={18} color={colors.fx} />
                    </View>
                    <Text style={[styles.resultLabel, { color: colors.foreground }]}>{r.code}</Text>
                    <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
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
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  searchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    height: 44,
  },
  searchInput: { flex: 1, fontSize: FontSize.base },
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xxl },

  suggestLabel: {
    fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1, marginBottom: Spacing.xs,
  },
  sectionLabel: {
    fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1, marginBottom: Spacing.xs,
  },

  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  resultIcon: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  resultLabel: { flex: 1, fontSize: FontSize.base, fontWeight: FontWeight.medium },
  resultSub: { fontSize: FontSize.xs, marginTop: 2 },

  txWrap: {
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
  },
  divider: { height: 1 },

  empty: { alignItems: 'center', paddingVertical: 60, gap: Spacing.sm },
  emptyText: { fontSize: FontSize.base, fontWeight: FontWeight.medium },
  emptySubtext: { fontSize: FontSize.sm, textAlign: 'center', paddingHorizontal: Spacing.xl },
});
