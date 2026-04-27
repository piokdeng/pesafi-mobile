import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/lib/theme';
import { useAuth } from '@/lib/auth';
import { Spacing, FontSize, FontWeight, Radius, Shadow } from '@/constants/theme';
import { getTransactions, getContacts } from '@/lib/api/client';
import { Card } from '@/components/ui/Card';
import { TransactionItem } from '@/components/TransactionItem';
import type { Transaction, Contact } from '@/lib/types';
import { useResponsive } from '@/lib/responsive';

export default function TransferTab() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const { isDesktop } = useResponsive();
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);

  const load = useCallback(async () => {
    try {
      const [t, c] = await Promise.all([
        user ? getTransactions(user.id) : Promise.resolve([]),
        getContacts(),
      ]);
      // only transfer-type activity
      setTxs(t.filter((x) => x.type === 'send' || x.type === 'receive').slice(0, 8));
      setContacts(c);
    } catch {}
  }, [user]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={[styles.scroll, isDesktop && styles.scrollDesktop]}
        showsVerticalScrollIndicator={false}
      >
        <View style={isDesktop ? styles.inner : undefined}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>Transfer</Text>
        </View>

        <View style={[styles.grid, isDesktop && styles.gridDesktop]}>
          <TouchableOpacity onPress={() => router.push('/send')} activeOpacity={0.85} style={styles.cell}>
            <LinearGradient colors={[colors.send, colors.sendDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
              <View style={styles.cardIcon}>
                <Ionicons name="paper-plane" size={28} color="white" />
              </View>
              <Text style={styles.cardTitle}>Send</Text>
              <Text style={styles.cardSub}>To wallet or mobile money</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/receive')} activeOpacity={0.85} style={styles.cell}>
            <LinearGradient colors={[colors.receive, colors.receiveDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
              <View style={styles.cardIcon}>
                <Ionicons name="arrow-down" size={28} color="white" />
              </View>
              <Text style={styles.cardTitle}>Receive</Text>
              <Text style={styles.cardSub}>QR code or wallet address</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/scan')} activeOpacity={0.85} style={styles.cell}>
            <View style={[styles.card, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}>
              <View style={[styles.cardIcon, { backgroundColor: colors.muted }]}>
                <Ionicons name="qr-code" size={28} color={colors.primary} />
              </View>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>Scan QR</Text>
              <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>Scan to send</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/(tabs)/contacts')} activeOpacity={0.85} style={styles.cell}>
            <View style={[styles.card, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}>
              <View style={[styles.cardIcon, { backgroundColor: colors.muted }]}>
                <Ionicons name="people" size={28} color={colors.accent} />
              </View>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>Contacts</Text>
              <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>Send to saved</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Recent transfer activity */}
        <View style={[{ paddingHorizontal: Spacing.lg, marginTop: Spacing.lg }, isDesktop && { paddingHorizontal: 0 }]}>
          <Card padding="lg">
            <View style={styles.activityHeader}>
              <Text style={[styles.activityTitle, { color: colors.foreground }]}>Recent transfers</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/activity')}>
                <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
              </TouchableOpacity>
            </View>

            {txs.length === 0 ? (
              <View style={styles.empty}>
                <Ionicons name="paper-plane-outline" size={32} color={colors.mutedForeground} />
                <Text style={[styles.emptyText, { color: colors.foreground }]}>No transfers yet</Text>
                <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
                  Your send & receive history will appear here
                </Text>
              </View>
            ) : (
              txs.map((tx, i) => (
                <View key={tx.id}>
                  <TransactionItem tx={tx} contacts={contacts} />
                  {i < txs.length - 1 && (
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                  )}
                </View>
              ))
            )}
          </Card>
        </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingBottom: Spacing.xxl },
  scrollDesktop: { alignItems: 'center', paddingHorizontal: 40, paddingVertical: 32 },
  inner: { width: '100%', maxWidth: 860 },
  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.md },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, paddingHorizontal: Spacing.lg },
  gridDesktop: { paddingHorizontal: 0 },
  cell: { width: '47%', flexGrow: 1 },
  card: {
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    minHeight: 150,
    justifyContent: 'flex-end',
    ...Shadow.card,
  },
  cardIcon: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  cardTitle: { color: 'white', fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  cardSub: { color: 'rgba(255,255,255,0.7)', fontSize: FontSize.xs, marginTop: 2 },

  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  activityTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold },
  seeAll: { fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  empty: { alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.xs },
  emptyText: { fontSize: FontSize.base, fontWeight: FontWeight.medium },
  emptySub: { fontSize: FontSize.sm, textAlign: 'center' },
  divider: { height: 1 },
});
