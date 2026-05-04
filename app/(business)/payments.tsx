import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme';
import { Spacing, FontSize, FontWeight, Radius } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatUsd, detectCountryFromPhone, formatLocal } from '@/lib/currency';
import { getPayrollBatches, createPayrollBatch } from '@/lib/api/business';
import { getWallet } from '@/lib/api/client';
import type { PayrollBatch, PayrollRecipient, MobileMoneyProvider } from '@/lib/types';

type Tab = 'history' | 'new';

export default function PaymentsScreen() {
  const { colors } = useTheme();
  const [tab, setTab] = useState<Tab>('history');
  const [batches, setBatches] = useState<PayrollBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);

  // New payroll form
  const [label, setLabel] = useState('');
  const [recipients, setRecipients] = useState<PayrollRecipient[]>([]);
  const [sending, setSending] = useState(false);

  // Add recipient form
  const [addName, setAddName] = useState('');
  const [addPhone, setAddPhone] = useState('');
  const [addAmount, setAddAmount] = useState('');
  const [addProvider, setAddProvider] = useState<MobileMoneyProvider>('MPESA');
  const [addCurrency, setAddCurrency] = useState('KES');
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    Promise.all([getPayrollBatches(), getWallet('business')])
      .then(([b, w]) => { setBatches(b); setBalance(w.balance); })
      .finally(() => setLoading(false));
  }, []);

  const handlePhoneChange = (val: string) => {
    setAddPhone(val);
    const d = detectCountryFromPhone(val);
    if (d) { setAddProvider(d.provider); setAddCurrency(d.currency); }
  };

  const addRecipient = () => {
    if (!addName || !addPhone || !addAmount) {
      Alert.alert('Missing fields', 'Please fill in name, phone, and amount.');
      return;
    }
    const amt = parseFloat(addAmount);
    if (isNaN(amt) || amt <= 0) { Alert.alert('Invalid amount', 'Enter a valid USD amount.'); return; }

    setRecipients(prev => [...prev, {
      id: Date.now().toString(),
      name: addName.trim(),
      phone_number: addPhone.trim(),
      provider: addProvider,
      amount_usd: amt,
      local_currency: addCurrency,
      status: 'pending',
    }]);
    setAddName(''); setAddPhone(''); setAddAmount('');
    setShowAddForm(false);
  };

  const removeRecipient = (id: string) => {
    setRecipients(prev => prev.filter(r => r.id !== id));
  };

  const totalUsd = recipients.reduce((s, r) => s + r.amount_usd, 0);

  const handleSendPayroll = async () => {
    if (!label) { Alert.alert('Missing label', 'Give this payroll run a name (e.g. "April Payroll").'); return; }
    if (recipients.length === 0) { Alert.alert('No recipients', 'Add at least one recipient.'); return; }
    if (totalUsd > balance) { Alert.alert('Insufficient balance', `You need ${formatUsd(totalUsd)} but only have ${formatUsd(balance)}.`); return; }

    setSending(true);
    try {
      const batch = await createPayrollBatch({ label, recipients });
      setBatches(prev => [batch, ...prev]);
      setLabel(''); setRecipients([]); setTab('history');
      Alert.alert('Payroll sent!', `${formatUsd(batch.total_usd)} sent to ${batch.recipients.length} recipients.`);
    } catch (e: any) {
      Alert.alert('Failed', e.message ?? 'Something went wrong.');
    } finally {
      setSending(false);
    }
  };

  const statusColor = (status: PayrollBatch['status']) => {
    switch (status) {
      case 'completed': return colors.success;
      case 'processing': return colors.info;
      case 'failed': return colors.destructive;
      case 'draft': return colors.mutedForeground;
      default: return colors.warning;
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>Payments</Text>
        <View style={[styles.balancePill, { backgroundColor: colors.successBg }]}>
          <Text style={[styles.balanceText, { color: colors.success }]}>{formatUsd(balance)} available</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={[styles.tabRow, { backgroundColor: colors.muted }]}>
        {(['history', 'new'] as const).map(t => {
          const active = tab === t;
          return (
            <TouchableOpacity
              key={t}
              onPress={() => setTab(t)}
              style={[styles.tabBtn, { backgroundColor: active ? colors.card : 'transparent', borderRadius: Radius.md }]}
            >
              <Text style={[styles.tabText, { color: active ? colors.foreground : colors.mutedForeground }]}>
                {t === 'history' ? 'History' : '+ New payroll'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* History Tab */}
      {tab === 'history' && (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 60 }} />
          ) : batches.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={56} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No payroll runs yet</Text>
              <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>Create your first payroll to pay your team in one click.</Text>
              <Button title="Create payroll" onPress={() => setTab('new')} />
            </View>
          ) : (
            batches.map(batch => (
              <Card key={batch.id} style={{ marginBottom: Spacing.md }}>
                <View style={styles.batchHeader}>
                  <View style={[styles.batchIcon, { backgroundColor: colors.send + '20' }]}>
                    <Ionicons name="people" size={20} color={colors.send} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.batchLabel, { color: colors.foreground }]}>{batch.label}</Text>
                    <Text style={[styles.batchMeta, { color: colors.mutedForeground }]}>
                      {batch.recipients.length} recipients · {new Date(batch.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.batchAmt, { color: colors.foreground }]}>{formatUsd(batch.total_usd)}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor(batch.status) + '20' }]}>
                      <Text style={[styles.statusText, { color: statusColor(batch.status) }]}>
                        {batch.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                {batch.recipients.slice(0, 3).map((r, i) => (
                  <View key={r.id} style={styles.recipientRow}>
                    <View style={[styles.avatar, { backgroundColor: colors.muted }]}>
                      <Text style={[styles.avatarText, { color: colors.foreground }]}>
                        {r.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                      </Text>
                    </View>
                    <Text style={[styles.recipientName, { color: colors.foreground }]}>{r.name}</Text>
                    <Text style={[styles.recipientAmt, { color: colors.success }]}>{formatUsd(r.amount_usd)}</Text>
                  </View>
                ))}
                {batch.recipients.length > 3 && (
                  <Text style={[styles.moreRecipients, { color: colors.mutedForeground }]}>
                    +{batch.recipients.length - 3} more
                  </Text>
                )}
              </Card>
            ))
          )}
        </ScrollView>
      )}

      {/* New Payroll Tab */}
      {tab === 'new' && (
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Card style={{ marginBottom: Spacing.md }}>
            <Input
              label="Payroll label"
              value={label}
              onChangeText={setLabel}
              placeholder="e.g. April 2024 Payroll"
              autoCapitalize="words"
            />
          </Card>

          {/* Recipients list */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Recipients ({recipients.length})
            </Text>
            {!showAddForm && (
              <TouchableOpacity onPress={() => setShowAddForm(true)}>
                <Text style={[styles.addBtn, { color: colors.primary }]}>+ Add</Text>
              </TouchableOpacity>
            )}
          </View>

          {recipients.map((r) => (
            <Card key={r.id} style={{ marginBottom: Spacing.sm }}>
              <View style={styles.recipientCard}>
                <View style={[styles.avatar, { backgroundColor: colors.muted }]}>
                  <Text style={[styles.avatarText, { color: colors.foreground }]}>
                    {r.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.recipientName, { color: colors.foreground }]}>{r.name}</Text>
                  <Text style={[styles.batchMeta, { color: colors.mutedForeground }]}>{r.phone_number} · {r.provider}</Text>
                </View>
                <Text style={[styles.batchAmt, { color: colors.success }]}>{formatUsd(r.amount_usd)}</Text>
                <TouchableOpacity onPress={() => removeRecipient(r.id)} hitSlop={8}>
                  <Ionicons name="close-circle" size={20} color={colors.destructive} />
                </TouchableOpacity>
              </View>
            </Card>
          ))}

          {/* Add recipient form */}
          {showAddForm && (
            <Card style={{ marginBottom: Spacing.md }}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Add recipient</Text>
              <View style={{ gap: Spacing.md }}>
                <Input label="Full name" value={addName} onChangeText={setAddName} placeholder="Jane Achieng" autoCapitalize="words" />
                <Input
                  label="Phone number"
                  value={addPhone}
                  onChangeText={handlePhoneChange}
                  placeholder="+254712345678"
                  keyboardType="phone-pad"
                  helperText={`${addProvider} · ${addCurrency}`}
                />
                <Input
                  label="Amount (USD)"
                  value={addAmount}
                  onChangeText={setAddAmount}
                  placeholder="150.00"
                  keyboardType="decimal-pad"
                  helperText={addAmount && parseFloat(addAmount) > 0 ? `≈ ${formatLocal(parseFloat(addAmount), addCurrency)}` : undefined}
                />
                <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                  <View style={{ flex: 1 }}>
                    <Button title="Add" onPress={addRecipient} fullWidth />
                  </View>
                  <TouchableOpacity
                    onPress={() => setShowAddForm(false)}
                    style={[styles.cancelBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
                  >
                    <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          )}

          {/* Total & send */}
          {recipients.length > 0 && (
            <Card style={{ marginBottom: Spacing.xxl }}>
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: colors.mutedForeground }]}>Total payout</Text>
                <Text style={[styles.totalAmt, { color: colors.foreground }]}>{formatUsd(totalUsd)}</Text>
              </View>
              <View style={[styles.divider, { backgroundColor: colors.border, marginVertical: Spacing.md }]} />
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: colors.mutedForeground }]}>Available balance</Text>
                <Text style={[styles.totalLabel, { color: totalUsd > balance ? colors.destructive : colors.success }]}>
                  {formatUsd(balance)}
                </Text>
              </View>
              <View style={{ height: Spacing.lg }} />
              <Button
                title={`Send ${formatUsd(totalUsd)} to ${recipients.length} recipient${recipients.length !== 1 ? 's' : ''}`}
                onPress={handleSendPayroll}
                loading={sending}
                disabled={totalUsd > balance || sending}
                fullWidth
              />
            </Card>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.md },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold },
  balancePill: { paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: Radius.full },
  balanceText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  tabRow: { flexDirection: 'row', marginHorizontal: Spacing.lg, borderRadius: Radius.md, padding: 4, marginBottom: Spacing.md },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  tabText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  scroll: { padding: Spacing.lg, paddingTop: 0 },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: Spacing.md },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  emptySubtitle: { fontSize: FontSize.base, textAlign: 'center', maxWidth: 280 },
  batchHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md },
  batchIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  batchLabel: { fontSize: FontSize.base, fontWeight: FontWeight.semibold },
  batchMeta: { fontSize: FontSize.xs, marginTop: 2 },
  batchAmt: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  statusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.full, marginTop: 4 },
  statusText: { fontSize: 9, fontWeight: FontWeight.bold, letterSpacing: 0.4 },
  divider: { height: 1, marginVertical: Spacing.sm },
  recipientRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: 4 },
  recipientCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  recipientName: { flex: 1, fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  recipientAmt: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  moreRecipients: { fontSize: FontSize.xs, marginTop: Spacing.xs, textAlign: 'center' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  sectionTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  addBtn: { fontSize: FontSize.base, fontWeight: FontWeight.semibold },
  cancelBtn: { height: 48, paddingHorizontal: Spacing.lg, borderRadius: Radius.md, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontSize: FontSize.base, fontWeight: FontWeight.medium },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: FontSize.base },
  totalAmt: { fontSize: FontSize.xl, fontWeight: FontWeight.bold },
});
