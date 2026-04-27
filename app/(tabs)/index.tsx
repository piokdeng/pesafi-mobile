import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme';
import { Spacing, FontSize, FontWeight, Radius } from '@/constants/theme';
import { BalanceCard } from '@/components/BalanceCard';
import { TransactionItem } from '@/components/TransactionItem';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/lib/auth';
import { usePreferences } from '@/lib/preferences';
import { useNotifications } from '@/lib/notifications';
import { getWallet, getTransactions, getContacts, refreshWalletBalance } from '@/lib/api/client';
import type { Wallet, Transaction, Contact } from '@/lib/types';
import { useResponsive, MAX_CONTENT_WIDTH } from '@/lib/responsive';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { prefs } = usePreferences();
  const { colors, toggle: toggleTheme, isDark } = useTheme();
  const { isDesktop } = useResponsive();
  const { unreadCount } = useNotifications();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [w, t, c] = await Promise.all([
        getWallet('personal'),
        user ? getTransactions(user.id) : Promise.resolve([]),
        getContacts(),
      ]);
      setWallet(w);
      setTransactions(t);
      setContacts(c);
    } catch (e) {
      console.warn('Failed to load dashboard', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);
  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      if (wallet) {
        const { balance } = await refreshWalletBalance(wallet.user_id);
        setWallet({ ...wallet, balance });
      }
      if (user) setTransactions(await getTransactions(user.id));
    } finally {
      setRefreshing(false);
    }
  };

  const displayName = (() => {
    const full = user?.name ?? '';
    if (full) {
      const parts = full.trim().split(/\s+/);
      return parts.length === 1 ? parts[0] : `${parts[0]} ${parts[1][0].toUpperCase()}.`;
    }
    if (user?.email) {
      const base = user.email.split('@')[0];
      return base.charAt(0).toUpperCase() + base.slice(1);
    }
    return 'PesaFi User';
  })();

  const initials = displayName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.centerLoad}><ActivityIndicator size="large" color={colors.primary} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={[styles.scroll, isDesktop && styles.scrollDesktop]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={[isDesktop ? styles.contentWrapper : styles.contentFull]}>
        {/* Top bar: avatar + theme toggle (left) — greeting (right) */}
        <View style={styles.topBar}>
          <View style={styles.topLeft}>
            <TouchableOpacity
              style={[styles.menuBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push('/(tabs)/profile')}
            >
              <Text style={[styles.menuInitials, { color: colors.primary }]}>{initials}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={toggleTheme}
              style={[styles.themeBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              hitSlop={8}
            >
              <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={18} color={colors.foreground} />
            </TouchableOpacity>
          </View>
          <View style={styles.topRight}>
            <Text style={[styles.greeting, { color: colors.mutedForeground }]}>Good day,</Text>
            <Text style={[styles.greetingName, { color: colors.foreground }]}>{displayName}</Text>
          </View>
        </View>

        {/* Search bar + notification bell */}
        <View style={styles.searchRow}>
          <TouchableOpacity
            style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/search')}
            activeOpacity={0.7}
          >
            <Ionicons name="search" size={18} color={colors.mutedForeground} />
            <Text style={[styles.searchPlaceholder, { color: colors.mutedForeground }]}>
              Search transactions, contacts…
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.bellBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/notifications')}
            hitSlop={8}
          >
            <Ionicons name="notifications-outline" size={20} color={colors.foreground} />
            {unreadCount > 0 && (
              <View style={[styles.bellBadge, { backgroundColor: colors.destructive }]}>
                <Text style={styles.bellBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <BalanceCard
          name={displayName}
          balance={wallet?.balance ?? 0}
          preferredCurrency={prefs.preferredCurrency}
          hideBalance={prefs.hideBalance}
          hideLocal={prefs.hideLocalAmount}
          refreshing={refreshing}
          onRefresh={onRefresh}
          transactions={transactions}
        />

        <View style={styles.quickRow}>
          {([
            { icon: 'paper-plane' as const, label: 'Send', route: '/send', color: colors.send },
            { icon: 'arrow-down' as const, label: 'Receive', route: '/receive', color: colors.receive },
            { icon: 'add-circle' as const, label: 'Deposit', route: '/deposit', color: colors.deposit },
            { icon: 'arrow-up-circle' as const, label: 'Withdraw', route: '/withdraw', color: colors.withdraw },
          ]).map((a) => (
            <TouchableOpacity
              key={a.label}
              style={styles.quickItem}
              onPress={() => router.push(a.route as any)}
              activeOpacity={0.7}
            >
              <View style={[styles.quickIcon, { backgroundColor: a.color + '18' }]}>
                <Ionicons name={a.icon} size={20} color={a.color} />
              </View>
              <Text style={[styles.quickLabel, { color: colors.foreground }]}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Card padding="lg">
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent activity</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/activity')}>
              <Text style={[styles.sectionLink, { color: colors.primary }]}>See all</Text>
            </TouchableOpacity>
          </View>

          {transactions.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="receipt-outline" size={36} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.foreground }]}>No transactions yet</Text>
              <Text style={[styles.emptySubtext, { color: colors.mutedForeground }]}>Your activity will show up here</Text>
            </View>
          ) : (
            transactions.slice(0, 5).map((tx, idx) => (
              <View key={tx.id}>
                <TransactionItem tx={tx} contacts={contacts} hideAmount={prefs.hideBalance} />
                {idx < Math.min(transactions.length, 5) - 1 && (
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />
                )}
              </View>
            ))
          )}
        </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: Spacing.xxl },
  scrollDesktop: { alignItems: 'center', paddingHorizontal: 40, paddingVertical: 32 },
  contentFull: { gap: Spacing.lg },
  contentWrapper: { width: '100%', maxWidth: 780, gap: Spacing.lg },
  centerLoad: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  topLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  menuBtn: {
    width: 40, height: 40, borderRadius: 20, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  menuInitials: { fontWeight: FontWeight.bold, fontSize: FontSize.sm },
  themeBtn: {
    width: 36, height: 36, borderRadius: 18, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  topRight: { alignItems: 'flex-end' },
  greeting: { fontSize: FontSize.sm },
  greetingName: { fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    height: 44,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  searchPlaceholder: { fontSize: FontSize.sm, flex: 1 },
  bellBtn: {
    width: 44, height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  bellBadge: {
    position: 'absolute',
    top: 6, right: 6,
    minWidth: 16, height: 16, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 4,
  },
  bellBadgeText: { color: 'white', fontSize: 10, fontWeight: FontWeight.bold },
  quickRow: { flexDirection: 'row', justifyContent: 'space-between' },
  quickItem: { alignItems: 'center', gap: 6, flex: 1 },
  quickIcon: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
  },
  quickLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold },
  sectionLink: { fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  divider: { height: 1 },
  empty: { paddingVertical: Spacing.xl, alignItems: 'center', gap: Spacing.xs },
  emptyText: { fontWeight: FontWeight.medium },
  emptySubtext: { fontSize: FontSize.sm },
});
