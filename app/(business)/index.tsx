import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useTheme } from '@/lib/theme';
import { useAuth } from '@/lib/auth';
import { Spacing, FontSize, FontWeight, Radius } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { formatUsd } from '@/lib/currency';
import { getBusinessStats, getInvoices, getPayrollBatches } from '@/lib/api/business';
import type { BusinessStats, Invoice, PayrollBatch } from '@/lib/types';

export default function BusinessDashboard() {
  const { colors } = useTheme();
  const { user, signOut } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState<BusinessStats | null>(null);
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [recentPayroll, setRecentPayroll] = useState<PayrollBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const [s, inv, pay] = await Promise.all([
        getBusinessStats(),
        getInvoices(),
        getPayrollBatches(),
      ]);
      setStats(s);
      setRecentInvoices(inv.slice(0, 3));
      setRecentPayroll(pay.slice(0, 2));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onRefresh = () => { setRefreshing(true); load(); };

  const businessName = (user as any)?.business_name ?? user?.name ?? 'My Business';

  const quickActions = [
    { label: 'Send Payroll', icon: 'people', color: colors.send, route: '/(business)/payments' },
    { label: 'New Invoice', icon: 'document-text', color: colors.primary, route: '/(business)/invoices' },
    { label: 'Payment Link', icon: 'link', color: colors.accent, route: '/(business)/more' },
    { label: 'Add Team', icon: 'person-add', color: colors.withdraw, route: '/(business)/team' },
  ];

  const invoiceStatusColor = (status: Invoice['status']) => {
    switch (status) {
      case 'paid': return colors.success;
      case 'sent': return colors.info;
      case 'overdue': return colors.destructive;
      case 'draft': return colors.mutedForeground;
      default: return colors.mutedForeground;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.mutedForeground }]}>Business Dashboard</Text>
            <Text style={[styles.bizName, { color: colors.foreground }]} numberOfLines={1}>{businessName}</Text>
          </View>
          <TouchableOpacity
            style={[styles.avatarBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/(business)/more')}
          >
            <Ionicons name="settings-outline" size={20} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        {/* Balance Card */}
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          style={styles.balanceCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.balanceTop}>
            <Text style={styles.balanceLabel}>Business Wallet</Text>
            <View style={styles.usdcBadge}>
              <Text style={styles.usdcText}>USDC · Base</Text>
            </View>
          </View>
          <Text style={styles.balanceAmount}>{formatUsd(stats?.balance ?? 0)}</Text>
          <View style={styles.balanceRow}>
            <View>
              <Text style={styles.balanceSubLabel}>This month</Text>
              <Text style={styles.balanceSubValue}>+{formatUsd(stats?.revenue_this_month ?? 0)}</Text>
            </View>
            <View style={styles.dividerVert} />
            <View>
              <Text style={styles.balanceSubLabel}>Last month</Text>
              <Text style={styles.balanceSubValue}>+{formatUsd(stats?.revenue_last_month ?? 0)}</Text>
            </View>
            <View style={styles.dividerVert} />
            <View>
              <Text style={styles.balanceSubLabel}>Transactions</Text>
              <Text style={styles.balanceSubValue}>{stats?.transactions_this_month ?? 0}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Pending Invoices Banner */}
        {(stats?.pending_invoices_count ?? 0) > 0 && (
          <TouchableOpacity onPress={() => router.push('/(business)/invoices')} activeOpacity={0.85}>
            <View style={[styles.pendingBanner, { backgroundColor: colors.warningBg, borderColor: colors.warning }]}>
              <Ionicons name="alert-circle-outline" size={18} color={colors.warning} />
              <Text style={[styles.pendingText, { color: colors.warning }]}>
                {stats!.pending_invoices_count} invoice{stats!.pending_invoices_count > 1 ? 's' : ''} pending — {formatUsd(stats!.pending_invoices_total)} outstanding
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors.warning} />
            </View>
          </TouchableOpacity>
        )}

        {/* Quick Actions */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Quick actions</Text>
        <View style={styles.quickGrid}>
          {quickActions.map((a) => (
            <TouchableOpacity
              key={a.label}
              style={[styles.quickBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              activeOpacity={0.8}
              onPress={() => router.push(a.route as any)}
            >
              <View style={[styles.quickIcon, { backgroundColor: a.color + '20' }]}>
                <Ionicons name={a.icon as any} size={22} color={a.color} />
              </View>
              <Text style={[styles.quickLabel, { color: colors.foreground }]}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Invoices */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent invoices</Text>
          <TouchableOpacity onPress={() => router.push('/(business)/invoices')}>
            <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
          </TouchableOpacity>
        </View>
        <Card>
          {recentInvoices.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No invoices yet. Create your first one.</Text>
          ) : (
            recentInvoices.map((inv, i) => (
              <View key={inv.id}>
                {i > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
                <View style={styles.invoiceRow}>
                  <View style={[styles.invoiceIcon, { backgroundColor: invoiceStatusColor(inv.status) + '20' }]}>
                    <Ionicons name="document-text" size={18} color={invoiceStatusColor(inv.status)} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.invoiceClient, { color: colors.foreground }]}>{inv.client_name}</Text>
                    <Text style={[styles.invoiceNum, { color: colors.mutedForeground }]}>{inv.invoice_number}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.invoiceAmt, { color: colors.foreground }]}>{formatUsd(inv.total)}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: invoiceStatusColor(inv.status) + '20' }]}>
                      <Text style={[styles.statusText, { color: invoiceStatusColor(inv.status) }]}>
                        {inv.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ))
          )}
        </Card>

        {/* Recent Payroll */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent payroll</Text>
          <TouchableOpacity onPress={() => router.push('/(business)/payments')}>
            <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
          </TouchableOpacity>
        </View>
        <Card style={{ marginBottom: Spacing.xxl }}>
          {recentPayroll.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No payroll runs yet.</Text>
          ) : (
            recentPayroll.map((batch, i) => (
              <View key={batch.id}>
                {i > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
                <View style={styles.invoiceRow}>
                  <View style={[styles.invoiceIcon, { backgroundColor: colors.send + '20' }]}>
                    <Ionicons name="people" size={18} color={colors.send} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.invoiceClient, { color: colors.foreground }]}>{batch.label}</Text>
                    <Text style={[styles.invoiceNum, { color: colors.mutedForeground }]}>
                      {batch.recipients.length} recipient{batch.recipients.length !== 1 ? 's' : ''}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.invoiceAmt, { color: colors.foreground }]}>{formatUsd(batch.total_usd)}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: (batch.status === 'completed' ? colors.success : colors.warning) + '20' }]}>
                      <Text style={[styles.statusText, { color: batch.status === 'completed' ? colors.success : colors.warning }]}>
                        {batch.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ))
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: Spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.lg },
  greeting: { fontSize: FontSize.sm },
  bizName: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, marginTop: 2, maxWidth: 260 },
  avatarBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },

  balanceCard: { borderRadius: Radius.xl, padding: Spacing.xl, marginBottom: Spacing.md },
  balanceTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  balanceLabel: { color: 'rgba(255,255,255,0.8)', fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  usdcBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: Radius.full },
  usdcText: { color: 'white', fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  balanceAmount: { color: 'white', fontSize: FontSize.hero, fontWeight: FontWeight.bold, marginBottom: Spacing.lg },
  balanceRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  balanceSubLabel: { color: 'rgba(255,255,255,0.7)', fontSize: FontSize.xs },
  balanceSubValue: { color: 'white', fontSize: FontSize.sm, fontWeight: FontWeight.semibold, marginTop: 2 },
  dividerVert: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.25)' },

  pendingBanner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md, borderRadius: Radius.md, borderWidth: 1, marginBottom: Spacing.lg },
  pendingText: { flex: 1, fontSize: FontSize.sm, fontWeight: FontWeight.medium },

  sectionTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, marginBottom: Spacing.sm },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm, marginTop: Spacing.lg },
  seeAll: { fontSize: FontSize.sm, fontWeight: FontWeight.medium },

  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg },
  quickBtn: { width: '47.5%', padding: Spacing.md, borderRadius: Radius.lg, borderWidth: 1, alignItems: 'center', gap: Spacing.sm },
  quickIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, textAlign: 'center' },

  invoiceRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm },
  invoiceIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  invoiceClient: { fontSize: FontSize.base, fontWeight: FontWeight.semibold },
  invoiceNum: { fontSize: FontSize.xs, marginTop: 2 },
  invoiceAmt: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  statusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.full, marginTop: 4 },
  statusText: { fontSize: 9, fontWeight: FontWeight.bold, letterSpacing: 0.4 },

  divider: { height: 1 },
  emptyText: { fontSize: FontSize.sm, textAlign: 'center', paddingVertical: Spacing.md },
});
