import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme';
import { Spacing, FontSize, FontWeight, Radius } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatUsd } from '@/lib/currency';
import { getInvoices, createInvoice } from '@/lib/api/business';
import type { Invoice, InvoiceLineItem, InvoiceStatus } from '@/lib/types';

const STATUS_FILTERS: Array<{ key: InvoiceStatus | 'all'; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'sent', label: 'Sent' },
  { key: 'paid', label: 'Paid' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'draft', label: 'Draft' },
];

export default function InvoicesScreen() {
  const { colors } = useTheme();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<InvoiceStatus | 'all'>('all');
  const [showCreate, setShowCreate] = useState(false);

  // Create form state
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([
    { description: '', quantity: 1, unit_price: 0 },
  ]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    getInvoices().then(setInvoices).finally(() => setLoading(false));
  }, []);

  const statusColor = (status: InvoiceStatus) => {
    switch (status) {
      case 'paid': return colors.success;
      case 'sent': return colors.info;
      case 'overdue': return colors.destructive;
      case 'draft': return colors.mutedForeground;
      case 'cancelled': return colors.mutedForeground;
    }
  };

  const filtered = filter === 'all' ? invoices : invoices.filter(i => i.status === filter);

  const subtotal = lineItems.reduce((s, li) => s + li.quantity * li.unit_price, 0);
  const fee = subtotal * 0.005;
  const total = subtotal + fee;

  const addLineItem = () => setLineItems(prev => [...prev, { description: '', quantity: 1, unit_price: 0 }]);
  const removeLineItem = (i: number) => setLineItems(prev => prev.filter((_, idx) => idx !== i));
  const updateLineItem = (i: number, field: keyof InvoiceLineItem, value: string | number) => {
    setLineItems(prev => prev.map((li, idx) => idx === i ? { ...li, [field]: value } : li));
  };

  const handleCreate = async () => {
    if (!clientName) { Alert.alert('Required', 'Client name is required.'); return; }
    if (lineItems.some(li => !li.description || li.unit_price <= 0)) {
      Alert.alert('Invalid items', 'All line items need a description and price.'); return;
    }
    setCreating(true);
    try {
      const inv = await createInvoice({
        client_name: clientName,
        client_email: clientEmail || undefined,
        client_phone: clientPhone || undefined,
        line_items: lineItems,
        due_date: dueDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        notes: notes || undefined,
        status: 'sent',
      });
      setInvoices(prev => [inv, ...prev]);
      setShowCreate(false);
      resetForm();
      Alert.alert('Invoice created!', `Invoice ${inv.invoice_number} sent to ${clientName}.`);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to create invoice.');
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setClientName(''); setClientEmail(''); setClientPhone('');
    setDueDate(''); setNotes('');
    setLineItems([{ description: '', quantity: 1, unit_price: 0 }]);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>Invoices</Text>
        <TouchableOpacity
          style={[styles.createBtn, { backgroundColor: colors.primary }]}
          onPress={() => setShowCreate(true)}
        >
          <Ionicons name="add" size={18} color="#08101D" />
          <Text style={styles.createBtnText}>New</Text>
        </TouchableOpacity>
      </View>

      {/* Filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {STATUS_FILTERS.map(f => {
          const active = filter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              onPress={() => setFilter(f.key as any)}
              style={[styles.chip, { backgroundColor: active ? colors.primary : colors.muted }]}
            >
              <Text style={[styles.chipText, { color: active ? '#08101D' : colors.foreground }]}>{f.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Invoice list */}
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 60 }} />
        ) : filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={56} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No invoices</Text>
            <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>Create your first invoice to get paid in USDC.</Text>
            <Button title="Create invoice" onPress={() => setShowCreate(true)} />
          </View>
        ) : (
          filtered.map(inv => (
            <Card key={inv.id} style={{ marginBottom: Spacing.md }}>
              <View style={styles.invRow}>
                <View style={[styles.invIcon, { backgroundColor: statusColor(inv.status) + '20' }]}>
                  <Ionicons name="document-text" size={20} color={statusColor(inv.status)} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.invClient, { color: colors.foreground }]}>{inv.client_name}</Text>
                  <Text style={[styles.invNum, { color: colors.mutedForeground }]}>{inv.invoice_number}</Text>
                  <Text style={[styles.invDue, { color: colors.mutedForeground }]}>
                    Due {new Date(inv.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <Text style={[styles.invAmt, { color: colors.foreground }]}>{formatUsd(inv.total)}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: statusColor(inv.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: statusColor(inv.status) }]}>
                      {inv.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>
              {/* Line items preview */}
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.itemsPreview}>
                {inv.line_items.slice(0, 2).map((li, i) => (
                  <View key={i} style={styles.lineRow}>
                    <Text style={[styles.lineDesc, { color: colors.mutedForeground }]} numberOfLines={1}>{li.description}</Text>
                    <Text style={[styles.lineAmt, { color: colors.foreground }]}>{formatUsd(li.quantity * li.unit_price)}</Text>
                  </View>
                ))}
                {inv.line_items.length > 2 && (
                  <Text style={[styles.moreItems, { color: colors.mutedForeground }]}>+{inv.line_items.length - 2} more items</Text>
                )}
              </View>
              {/* Actions */}
              {inv.status !== 'paid' && inv.status !== 'cancelled' && (
                <View style={[styles.invActions]}>
                  <TouchableOpacity
                    style={[styles.invAction, { backgroundColor: colors.successBg }]}
                    onPress={() => Alert.alert('Payment link', `Share this link:\nhttps://pay.pesafi.ai/i/${inv.id}`)}
                  >
                    <Ionicons name="link-outline" size={14} color={colors.success} />
                    <Text style={[styles.invActionText, { color: colors.success }]}>Share link</Text>
                  </TouchableOpacity>
                  {inv.status !== 'draft' && (
                    <TouchableOpacity
                      style={[styles.invAction, { backgroundColor: colors.infoBg }]}
                      onPress={() => Alert.alert('Mark paid', 'Mark this invoice as paid?', [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Mark paid', onPress: () => setInvoices(prev => prev.map(i => i.id === inv.id ? { ...i, status: 'paid' } : i)) },
                      ])}
                    >
                      <Ionicons name="checkmark-outline" size={14} color={colors.info} />
                      <Text style={[styles.invActionText, { color: colors.info }]}>Mark paid</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </Card>
          ))
        )}
      </ScrollView>

      {/* Create Invoice Modal */}
      <Modal visible={showCreate} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => { setShowCreate(false); resetForm(); }} hitSlop={10}>
              <Ionicons name="close" size={24} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>New invoice</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>CLIENT DETAILS</Text>
            <Card style={{ marginBottom: Spacing.lg }}>
              <View style={{ gap: Spacing.md }}>
                <Input label="Client name *" value={clientName} onChangeText={setClientName} placeholder="Nairobi Coffee Co." autoCapitalize="words" />
                <Input label="Email (optional)" value={clientEmail} onChangeText={setClientEmail} placeholder="client@example.com" keyboardType="email-address" autoCapitalize="none" />
                <Input label="Phone (optional)" value={clientPhone} onChangeText={setClientPhone} placeholder="+254712345678" keyboardType="phone-pad" />
              </View>
            </Card>

            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>LINE ITEMS</Text>
            {lineItems.map((li, i) => (
              <Card key={i} style={{ marginBottom: Spacing.sm }}>
                <View style={styles.lineItemForm}>
                  <View style={{ flex: 1 }}>
                    <Input
                      label={`Item ${i + 1}`}
                      value={li.description}
                      onChangeText={v => updateLineItem(i, 'description', v)}
                      placeholder="Service description"
                    />
                  </View>
                  {lineItems.length > 1 && (
                    <TouchableOpacity onPress={() => removeLineItem(i)} hitSlop={8} style={{ marginTop: 28 }}>
                      <Ionicons name="trash-outline" size={18} color={colors.destructive} />
                    </TouchableOpacity>
                  )}
                </View>
                <View style={styles.lineItemAmounts}>
                  <View style={{ flex: 1 }}>
                    <Input
                      label="Qty"
                      value={String(li.quantity)}
                      onChangeText={v => updateLineItem(i, 'quantity', parseInt(v) || 1)}
                      keyboardType="number-pad"
                    />
                  </View>
                  <View style={{ flex: 2 }}>
                    <Input
                      label="Unit price (USD)"
                      value={li.unit_price > 0 ? String(li.unit_price) : ''}
                      onChangeText={v => updateLineItem(i, 'unit_price', parseFloat(v) || 0)}
                      keyboardType="decimal-pad"
                      placeholder="0.00"
                    />
                  </View>
                  <View style={{ flex: 1.5, paddingTop: 28 }}>
                    <Text style={[styles.lineTotal, { color: colors.foreground }]}>{formatUsd(li.quantity * li.unit_price)}</Text>
                  </View>
                </View>
              </Card>
            ))}
            <TouchableOpacity onPress={addLineItem} style={[styles.addItemBtn, { borderColor: colors.border }]}>
              <Ionicons name="add" size={18} color={colors.primary} />
              <Text style={[styles.addItemText, { color: colors.primary }]}>Add line item</Text>
            </TouchableOpacity>

            <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: Spacing.lg }]}>DETAILS</Text>
            <Card style={{ marginBottom: Spacing.lg }}>
              <View style={{ gap: Spacing.md }}>
                <Input label="Due date" value={dueDate} onChangeText={setDueDate} placeholder="2024-05-31" helperText="YYYY-MM-DD format" />
                <Input label="Notes (optional)" value={notes} onChangeText={setNotes} placeholder="Payment terms, bank info..." />
              </View>
            </Card>

            {/* Summary */}
            <Card style={{ marginBottom: Spacing.xxl }}>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Subtotal</Text>
                <Text style={[styles.summaryValue, { color: colors.foreground }]}>{formatUsd(subtotal)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>PesaFi fee (0.5%)</Text>
                <Text style={[styles.summaryValue, { color: colors.mutedForeground }]}>{formatUsd(fee)}</Text>
              </View>
              <View style={[styles.divider, { backgroundColor: colors.border, marginVertical: Spacing.sm }]} />
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.foreground, fontWeight: FontWeight.bold }]}>Total</Text>
                <Text style={[styles.totalValue, { color: colors.foreground }]}>{formatUsd(total)}</Text>
              </View>
              <View style={{ height: Spacing.lg }} />
              <Button title="Send invoice" onPress={handleCreate} loading={creating} disabled={!clientName || subtotal === 0} fullWidth />
            </Card>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.md },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold },
  createBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.md, paddingVertical: 8, borderRadius: Radius.full },
  createBtnText: { color: '#08101D', fontWeight: FontWeight.bold, fontSize: FontSize.sm },
  filterRow: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md, gap: Spacing.sm },
  chip: { paddingHorizontal: Spacing.lg, paddingVertical: 8, borderRadius: Radius.full },
  chipText: { fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  scroll: { padding: Spacing.lg, paddingTop: 0 },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: Spacing.md },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  emptySubtitle: { fontSize: FontSize.base, textAlign: 'center', maxWidth: 280 },
  invRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, marginBottom: Spacing.sm },
  invIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  invClient: { fontSize: FontSize.base, fontWeight: FontWeight.semibold },
  invNum: { fontSize: FontSize.xs, marginTop: 2 },
  invDue: { fontSize: FontSize.xs, marginTop: 2 },
  invAmt: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  statusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.full },
  statusText: { fontSize: 9, fontWeight: FontWeight.bold, letterSpacing: 0.4 },
  divider: { height: 1, marginVertical: Spacing.sm },
  itemsPreview: { gap: 4 },
  lineRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lineDesc: { flex: 1, fontSize: FontSize.sm },
  lineAmt: { fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  moreItems: { fontSize: FontSize.xs, marginTop: 2 },
  invActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  invAction: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 8, borderRadius: Radius.md },
  invActionText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.lg },
  modalTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  sectionLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, letterSpacing: 0.8, marginBottom: Spacing.sm },
  lineItemForm: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, marginBottom: Spacing.sm },
  lineItemAmounts: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-end' },
  lineTotal: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, textAlign: 'right', paddingBottom: 12 },
  addItemBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: Spacing.md, borderRadius: Radius.md, borderWidth: 1, borderStyle: 'dashed', marginBottom: Spacing.sm },
  addItemText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  summaryLabel: { fontSize: FontSize.base },
  summaryValue: { fontSize: FontSize.base, fontWeight: FontWeight.medium },
  totalValue: { fontSize: FontSize.xl, fontWeight: FontWeight.bold },
});
