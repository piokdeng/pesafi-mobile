import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, FontWeight, Radius } from '@/constants/theme';
import { TransactionItem } from '@/components/TransactionItem';
import { useAuth } from '@/lib/auth';
import { usePreferences } from '@/lib/preferences';
import { getTransactions, getContacts } from '@/lib/api/client';
import type { Transaction, Contact, TransactionType } from '@/lib/types';

const FILTERS: Array<{ key: TransactionType | 'all'; label: string }> = [
  { key: 'all',        label: 'All' },
  { key: 'send',       label: 'Sent' },
  { key: 'receive',    label: 'Received' },
  { key: 'deposit',    label: 'Deposits' },
  { key: 'withdrawal', label: 'Withdrawals' },
];

export default function ActivityScreen() {
  const { user } = useAuth();
  const { prefs } = usePreferences();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<TransactionType | 'all'>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [t, c] = await Promise.all([
          user ? getTransactions(user.id) : Promise.resolve([]),
          getContacts(),
        ]);
        setTransactions(t);
        setContacts(c);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const filtered = useMemo(() => {
    let list = transactions;
    if (filter !== 'all') list = list.filter((tx) => tx.type === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((tx) => {
        const addr = (tx.to_address ?? tx.from_address ?? '').toLowerCase();
        if (addr.includes(q)) return true;
        if ((tx.metadata?.phoneNumber ?? '').toLowerCase().includes(q)) return true;
        if ((tx.metadata?.accountName ?? '').toLowerCase().includes(q)) return true;
        // Match by contact name for wallet-address transactions
        const matchingContact = contacts.find((c) => c.name.toLowerCase().includes(q));
        if (matchingContact) {
          const addrs = [tx.to_address, tx.from_address].filter(Boolean).map(a => a!.toLowerCase());
          if (matchingContact.wallet_address && addrs.includes(matchingContact.wallet_address.toLowerCase())) return true;
          if (matchingContact.phone_number && tx.metadata?.phoneNumber === matchingContact.phone_number) return true;
        }
        return false;
      });
    }
    return list;
  }, [transactions, filter, search, contacts]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Activity</Text>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={Colors.mutedForeground} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name, address or phone"
          placeholderTextColor={Colors.mutedForeground}
          style={styles.searchInput}
        />
      </View>

      {/* Filter chips */}
      <View style={styles.filterRow}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={FILTERS}
          keyExtractor={(f) => f.key}
          contentContainerStyle={{ paddingHorizontal: Spacing.lg, gap: Spacing.sm }}
          renderItem={({ item }) => {
            const active = filter === item.key;
            return (
              <TouchableOpacity
                onPress={() => setFilter(item.key)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{item.label}</Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.centerLoad}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(tx) => tx.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.divider} />}
          renderItem={({ item }) => <TransactionItem tx={item} contacts={contacts} hideAmount={prefs.hideBalance} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="receipt-outline" size={48} color={Colors.mutedForeground} />
              <Text style={styles.emptyText}>No transactions match your filters</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.foreground },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    margin: Spacing.lg,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    height: 44,
  },
  searchInput: { flex: 1, color: Colors.foreground, fontSize: FontSize.base },
  filterRow: { marginBottom: Spacing.md },
  chip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.muted,
  },
  chipActive: { backgroundColor: Colors.primary },
  chipText: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.foreground },
  chipTextActive: { color: '#08101D' },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl },
  divider: { height: 1, backgroundColor: Colors.border },
  centerLoad: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingVertical: 60, gap: Spacing.md },
  emptyText: { color: Colors.mutedForeground, fontSize: FontSize.base },
});
