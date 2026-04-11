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
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, FontSize, FontWeight, Radius } from '@/constants/theme';
import { BalanceCard } from '@/components/BalanceCard';
import { QuickActions } from '@/components/QuickActions';
import { TransactionItem } from '@/components/TransactionItem';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/lib/auth';
import { usePreferences } from '@/lib/preferences';
import { getWallet, getTransactions, getContacts, refreshWalletBalance } from '@/lib/api/client';
import type { Wallet, Transaction, Contact } from '@/lib/types';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { prefs } = usePreferences();
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

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      if (wallet) {
        const { balance } = await refreshWalletBalance(wallet.user_id);
        setWallet({ ...wallet, balance });
      }
      if (user) {
        const t = await getTransactions(user.id);
        setTransactions(t);
      }
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

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerLoad}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Top bar */}
        <View style={styles.topBar}>
          <View>
            <Text style={styles.greeting}>Good day,</Text>
            <Text style={styles.greetingName}>{displayName}</Text>
          </View>
          <TouchableOpacity
            style={styles.avatar}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <Text style={styles.avatarText}>
              {displayName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Hero balance card */}
        <BalanceCard
          name={displayName}
          balance={wallet?.balance ?? 0}
          preferredCurrency={prefs.preferredCurrency}
          hideBalance={prefs.hideBalance}
          hideLocal={prefs.hideLocalAmount}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />

        {/* Quick actions */}
        <QuickActions
          onFx={() => router.push('/fx')}
          onSend={() => router.push('/send')}
          onReceive={() => router.push('/receive')}
          onDeposit={() => router.push('/deposit')}
          onWithdraw={() => router.push('/withdraw')}
        />

        {/* Recent activity */}
        <Card padding="lg">
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent activity</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/activity')}>
              <Text style={styles.sectionLink}>See all</Text>
            </TouchableOpacity>
          </View>

          {transactions.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No transactions yet</Text>
              <Text style={styles.emptySubtext}>Your activity will show up here</Text>
            </View>
          ) : (
            transactions.slice(0, 4).map((tx, idx) => (
              <View key={tx.id}>
                <TransactionItem tx={tx} contacts={contacts} hideAmount={prefs.hideBalance} />
                {idx < Math.min(transactions.length, 4) - 1 && <View style={styles.divider} />}
              </View>
            ))
          )}
        </Card>

        {/* FX promo card - new headline feature */}
        <Card padding="lg" style={styles.promoCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.promoTitle}>South Sudan FX is here 🇸🇸</Text>
            <Text style={styles.promoText}>
              Convert SSP to USDC at the published PesaFi rate. Pay in via mobile money.
            </Text>
            <TouchableOpacity style={styles.promoBtn} onPress={() => router.push('/fx')}>
              <Text style={styles.promoBtnText}>Get a quote →</Text>
            </TouchableOpacity>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: {
    padding: Spacing.lg,
    gap: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  centerLoad: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greeting: { color: Colors.mutedForeground, fontSize: FontSize.sm },
  greetingName: { color: Colors.foreground, fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: 'white', fontWeight: FontWeight.bold },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: Colors.foreground },
  sectionLink: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.medium },
  divider: { height: 1, backgroundColor: Colors.border },
  empty: { paddingVertical: Spacing.xl, alignItems: 'center' },
  emptyText: { color: Colors.foreground, fontWeight: FontWeight.medium },
  emptySubtext: { color: Colors.mutedForeground, fontSize: FontSize.sm, marginTop: 4 },
  promoCard: {
    backgroundColor: 'rgba(245,158,11,0.08)',
    borderColor: 'rgba(245,158,11,0.3)',
  },
  promoTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.warning },
  promoText: { fontSize: FontSize.sm, color: Colors.foregroundSubtle, marginTop: 4, lineHeight: 20 },
  promoBtn: {
    marginTop: Spacing.md,
    alignSelf: 'flex-start',
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    borderRadius: Radius.md,
  },
  promoBtnText: { color: 'white', fontWeight: FontWeight.semibold, fontSize: FontSize.sm },
});
