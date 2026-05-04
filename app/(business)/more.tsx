import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme';
import { useAuth } from '@/lib/auth';
import { Spacing, FontSize, FontWeight, Radius } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatUsd } from '@/lib/currency';
import { getPaymentLinks, createPaymentLink, getApiKeys, createApiKey } from '@/lib/api/business';
import type { PaymentLink, ApiKey } from '@/lib/types';

type Section = 'menu' | 'payment-links' | 'api-keys';

export default function MoreScreen() {
  const { colors } = useTheme();
  const { user, signOut } = useAuth();
  const [section, setSection] = useState<Section>('menu');

  // Payment links
  const [paymentLinks, setPaymentLinks] = useState<PaymentLink[]>([]);
  const [linksLoading, setLinksLoading] = useState(false);
  const [showCreateLink, setShowCreateLink] = useState(false);
  const [linkLabel, setLinkLabel] = useState('');
  const [linkAmount, setLinkAmount] = useState('');
  const [linkDesc, setLinkDesc] = useState('');
  const [creatingLink, setCreatingLink] = useState(false);

  // API Keys
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [keysLoading, setKeysLoading] = useState(false);
  const [showCreateKey, setShowCreateKey] = useState(false);
  const [keyLabel, setKeyLabel] = useState('');
  const [keyEnv, setKeyEnv] = useState<'live' | 'test'>('live');
  const [creatingKey, setCreatingKey] = useState(false);

  const businessName = (user as any)?.business_name ?? user?.name ?? 'My Business';

  useEffect(() => {
    if (section === 'payment-links' && paymentLinks.length === 0) {
      setLinksLoading(true);
      getPaymentLinks().then(setPaymentLinks).finally(() => setLinksLoading(false));
    }
    if (section === 'api-keys' && apiKeys.length === 0) {
      setKeysLoading(true);
      getApiKeys().then(setApiKeys).finally(() => setKeysLoading(false));
    }
  }, [section]);

  const handleCreateLink = async () => {
    if (!linkLabel) { Alert.alert('Required', 'Give this link a label.'); return; }
    setCreatingLink(true);
    try {
      const link = await createPaymentLink({
        label: linkLabel,
        amount_usd: linkAmount ? parseFloat(linkAmount) : undefined,
        description: linkDesc || undefined,
      });
      setPaymentLinks(prev => [link, ...prev]);
      setLinkLabel(''); setLinkAmount(''); setLinkDesc('');
      setShowCreateLink(false);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to create link.');
    } finally {
      setCreatingLink(false);
    }
  };

  const handleShareLink = async (link: PaymentLink) => {
    try {
      await Share.share({
        message: `Pay ${businessName} via PesaFi: ${link.url}`,
        url: link.url,
      });
    } catch {}
  };

  const handleCreateKey = async () => {
    if (!keyLabel) { Alert.alert('Required', 'Give this key a label.'); return; }
    setCreatingKey(true);
    try {
      const key = await createApiKey(keyLabel, keyEnv);
      setApiKeys(prev => [key, ...prev]);
      setKeyLabel('');
      setShowCreateKey(false);
      Alert.alert('API key created', 'Copy it now — it will only be shown once in production.');
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to create API key.');
    } finally {
      setCreatingKey(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: signOut },
    ]);
  };

  // ── MENU ────────────────────────────────────────────────────────────────────
  if (section === 'menu') {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={[styles.title, { color: colors.foreground }]}>More</Text>

          {/* Business info */}
          <Card style={{ marginBottom: Spacing.xl }}>
            <View style={styles.bizRow}>
              <View style={[styles.bizAvatar, { backgroundColor: colors.primary + '20' }]}>
                <Text style={[styles.bizInitial, { color: colors.primary }]}>
                  {businessName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.bizName, { color: colors.foreground }]}>{businessName}</Text>
                <Text style={[styles.bizEmail, { color: colors.mutedForeground }]}>{user?.email}</Text>
              </View>
              <View style={[styles.bizBadge, { backgroundColor: colors.successBg }]}>
                <Text style={[styles.bizBadgeText, { color: colors.success }]}>Business</Text>
              </View>
            </View>
          </Card>

          {/* Tools */}
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>TOOLS</Text>
          <Card style={{ marginBottom: Spacing.xl }}>
            {[
              { label: 'Payment links', icon: 'link', color: colors.accent, key: 'payment-links' as Section, desc: 'Get paid with a shareable link' },
              { label: 'API & developer', icon: 'code-slash', color: colors.info, key: 'api-keys' as Section, desc: 'Integrate PesaFi into your app' },
            ].map((item, i) => (
              <View key={item.key}>
                {i > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
                <TouchableOpacity style={styles.menuRow} onPress={() => setSection(item.key)} activeOpacity={0.7}>
                  <View style={[styles.menuIcon, { backgroundColor: item.color + '20' }]}>
                    <Ionicons name={item.icon as any} size={18} color={item.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.menuLabel, { color: colors.foreground }]}>{item.label}</Text>
                    <Text style={[styles.menuDesc, { color: colors.mutedForeground }]}>{item.desc}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>
            ))}
          </Card>

          {/* Fees */}
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>PRICING</Text>
          <Card style={{ marginBottom: Spacing.xl }}>
            {[
              { label: 'USDC transfers', value: '0.3%' },
              { label: 'Mobile money payouts', value: '0.5%' },
              { label: 'Invoice payments', value: '0.5%' },
              { label: 'Payment links', value: '0.5%' },
            ].map((row, i) => (
              <View key={row.label}>
                {i > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
                <View style={styles.feeRow}>
                  <Text style={[styles.feeLabel, { color: colors.foreground }]}>{row.label}</Text>
                  <Text style={[styles.feeValue, { color: colors.primary }]}>{row.value}</Text>
                </View>
              </View>
            ))}
          </Card>

          {/* Account */}
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>ACCOUNT</Text>
          <Card style={{ marginBottom: Spacing.xxl }}>
            <TouchableOpacity style={styles.menuRow} onPress={handleSignOut} activeOpacity={0.7}>
              <View style={[styles.menuIcon, { backgroundColor: colors.destructiveBg }]}>
                <Ionicons name="log-out-outline" size={18} color={colors.destructive} />
              </View>
              <Text style={[styles.menuLabel, { color: colors.destructive }]}>Sign out</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          </Card>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── PAYMENT LINKS ────────────────────────────────────────────────────────────
  if (section === 'payment-links') {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.subHeader}>
          <TouchableOpacity onPress={() => setSection('menu')} hitSlop={10}>
            <Ionicons name="arrow-back" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.subTitle, { color: colors.foreground }]}>Payment links</Text>
          <TouchableOpacity onPress={() => setShowCreateLink(true)}>
            <Ionicons name="add-circle" size={28} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={[styles.helpText, { color: colors.mutedForeground }]}>
            Create a link your customers can use to pay you in USDC. Works anywhere — WhatsApp, SMS, email, Instagram.
          </Text>

          {paymentLinks.map(link => (
            <Card key={link.id} style={{ marginBottom: Spacing.md }}>
              <View style={styles.linkHeader}>
                <View style={[styles.linkIcon, { backgroundColor: colors.accent + '20' }]}>
                  <Ionicons name="link" size={18} color={colors.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.linkLabel, { color: colors.foreground }]}>{link.label}</Text>
                  {link.amount_usd ? (
                    <Text style={[styles.linkMeta, { color: colors.mutedForeground }]}>Fixed: {formatUsd(link.amount_usd)}</Text>
                  ) : (
                    <Text style={[styles.linkMeta, { color: colors.mutedForeground }]}>Customer sets amount</Text>
                  )}
                </View>
                <View style={[styles.activeBadge, { backgroundColor: link.is_active ? colors.successBg : colors.muted }]}>
                  <Text style={[styles.activeBadgeText, { color: link.is_active ? colors.success : colors.mutedForeground }]}>
                    {link.is_active ? 'ACTIVE' : 'PAUSED'}
                  </Text>
                </View>
              </View>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.linkStats}>
                <View style={styles.linkStat}>
                  <Text style={[styles.statValue, { color: colors.foreground }]}>{link.payments_count}</Text>
                  <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Payments</Text>
                </View>
                <View style={styles.linkStat}>
                  <Text style={[styles.statValue, { color: colors.foreground }]}>{formatUsd(link.total_collected)}</Text>
                  <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Collected</Text>
                </View>
              </View>
              <View style={styles.linkActions}>
                <TouchableOpacity style={[styles.linkAction, { backgroundColor: colors.successBg }]} onPress={() => handleShareLink(link)}>
                  <Ionicons name="share-social-outline" size={14} color={colors.success} />
                  <Text style={[styles.linkActionText, { color: colors.success }]}>Share</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.linkAction, { backgroundColor: colors.muted }]}
                  onPress={() => Alert.alert('Link URL', link.url)}
                >
                  <Ionicons name="copy-outline" size={14} color={colors.foreground} />
                  <Text style={[styles.linkActionText, { color: colors.foreground }]}>Copy</Text>
                </TouchableOpacity>
              </View>
            </Card>
          ))}

          {!linksLoading && paymentLinks.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="link-outline" size={56} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No payment links yet</Text>
              <Button title="Create payment link" onPress={() => setShowCreateLink(true)} />
            </View>
          )}
        </ScrollView>

        <Modal visible={showCreateLink} animationType="slide" presentationStyle="pageSheet">
          <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
            <View style={styles.subHeader}>
              <TouchableOpacity onPress={() => setShowCreateLink(false)} hitSlop={10}>
                <Ionicons name="close" size={24} color={colors.foreground} />
              </TouchableOpacity>
              <Text style={[styles.subTitle, { color: colors.foreground }]}>New payment link</Text>
              <View style={{ width: 28 }} />
            </View>
            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
              <Card style={{ marginBottom: Spacing.xxl }}>
                <View style={{ gap: Spacing.md }}>
                  <Input label="Label" value={linkLabel} onChangeText={setLinkLabel} placeholder="e.g. Website design deposit" />
                  <Input label="Fixed amount USD (optional)" value={linkAmount} onChangeText={setLinkAmount} placeholder="Leave blank — customer sets amount" keyboardType="decimal-pad" />
                  <Input label="Description (optional)" value={linkDesc} onChangeText={setLinkDesc} placeholder="What is this payment for?" />
                  <View style={{ height: Spacing.sm }} />
                  <Button title="Create link" onPress={handleCreateLink} loading={creatingLink} disabled={!linkLabel} fullWidth />
                </View>
              </Card>
            </ScrollView>
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    );
  }

  // ── API KEYS ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.subHeader}>
        <TouchableOpacity onPress={() => setSection('menu')} hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.subTitle, { color: colors.foreground }]}>API & Developer</Text>
        <TouchableOpacity onPress={() => setShowCreateKey(true)}>
          <Ionicons name="add-circle" size={28} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.docsBanner, { backgroundColor: colors.infoBg, borderColor: colors.info }]}>
          <Ionicons name="book-outline" size={18} color={colors.info} />
          <Text style={[styles.docsText, { color: colors.info }]}>
            Integrate PesaFi payments into your app or website. API docs at docs.pesafi.ai
          </Text>
        </View>

        {apiKeys.map(key => (
          <Card key={key.id} style={{ marginBottom: Spacing.md }}>
            <View style={styles.keyRow}>
              <View style={[styles.keyIcon, { backgroundColor: key.environment === 'live' ? colors.successBg : colors.warningBg }]}>
                <Ionicons name="key" size={18} color={key.environment === 'live' ? colors.success : colors.warning} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.keyLabel, { color: colors.foreground }]}>{key.label}</Text>
                <Text style={[styles.keyPreview, { color: colors.mutedForeground }]}>{key.key_preview}</Text>
                {key.last_used_at && (
                  <Text style={[styles.keyMeta, { color: colors.mutedForeground }]}>
                    Last used {new Date(key.last_used_at).toLocaleDateString()}
                  </Text>
                )}
              </View>
              <View style={[styles.envBadge, { backgroundColor: key.environment === 'live' ? colors.successBg : colors.warningBg }]}>
                <Text style={[styles.envText, { color: key.environment === 'live' ? colors.success : colors.warning }]}>
                  {key.environment.toUpperCase()}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.revokeBtn, { borderColor: colors.destructive + '40' }]}
              onPress={() => Alert.alert('Revoke key?', 'This cannot be undone. Any app using this key will stop working.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Revoke', style: 'destructive', onPress: () => setApiKeys(prev => prev.filter(k => k.id !== key.id)) },
              ])}
            >
              <Text style={[styles.revokeText, { color: colors.destructive }]}>Revoke</Text>
            </TouchableOpacity>
          </Card>
        ))}

        {!keysLoading && apiKeys.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="code-slash-outline" size={56} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No API keys</Text>
            <Button title="Create API key" onPress={() => setShowCreateKey(true)} />
          </View>
        )}
      </ScrollView>

      <Modal visible={showCreateKey} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
          <View style={styles.subHeader}>
            <TouchableOpacity onPress={() => setShowCreateKey(false)} hitSlop={10}>
              <Ionicons name="close" size={24} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={[styles.subTitle, { color: colors.foreground }]}>New API key</Text>
            <View style={{ width: 28 }} />
          </View>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <Card style={{ marginBottom: Spacing.lg }}>
              <Input label="Label" value={keyLabel} onChangeText={setKeyLabel} placeholder="e.g. Production server" />
            </Card>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>ENVIRONMENT</Text>
            {(['live', 'test'] as const).map(env => {
              const active = keyEnv === env;
              return (
                <TouchableOpacity key={env} onPress={() => setKeyEnv(env)} activeOpacity={0.8}>
                  <Card style={[{ marginBottom: Spacing.sm }, active && { borderWidth: 1.5, borderColor: colors.primary }]}>
                    <View style={styles.envRow}>
                      <View style={[styles.keyIcon, { backgroundColor: env === 'live' ? colors.successBg : colors.warningBg }]}>
                        <Ionicons name={env === 'live' ? 'flash' : 'flask'} size={18} color={env === 'live' ? colors.success : colors.warning} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.keyLabel, { color: colors.foreground }]}>{env === 'live' ? 'Live' : 'Test'}</Text>
                        <Text style={[styles.keyMeta, { color: colors.mutedForeground }]}>
                          {env === 'live' ? 'Real transactions on Base mainnet' : 'Safe testing — no real money'}
                        </Text>
                      </View>
                      <View style={[styles.radioOuter, { borderColor: active ? colors.primary : colors.border }]}>
                        {active && <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />}
                      </View>
                    </View>
                  </Card>
                </TouchableOpacity>
              );
            })}
            <View style={{ height: Spacing.lg }} />
            <Button title="Generate key" onPress={handleCreateKey} loading={creatingKey} disabled={!keyLabel} fullWidth />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: Spacing.lg },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, paddingTop: Spacing.lg, marginBottom: Spacing.xl },
  sectionLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, letterSpacing: 0.8, marginBottom: Spacing.sm },
  subHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.lg },
  subTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  helpText: { fontSize: FontSize.sm, lineHeight: 20, marginBottom: Spacing.lg },
  divider: { height: 1, marginVertical: Spacing.sm },
  bizRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  bizAvatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  bizInitial: { fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  bizName: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  bizEmail: { fontSize: FontSize.xs, marginTop: 2 },
  bizBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.full },
  bizBadgeText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm },
  menuIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, flex: 1 },
  menuDesc: { fontSize: FontSize.xs, marginTop: 2 },
  feeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.sm },
  feeLabel: { fontSize: FontSize.base },
  feeValue: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  linkHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.sm },
  linkIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  linkLabel: { fontSize: FontSize.base, fontWeight: FontWeight.semibold },
  linkMeta: { fontSize: FontSize.xs, marginTop: 2 },
  activeBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: Radius.full },
  activeBadgeText: { fontSize: 9, fontWeight: FontWeight.bold, letterSpacing: 0.4 },
  linkStats: { flexDirection: 'row', gap: Spacing.xl, marginBottom: Spacing.sm },
  linkStat: { alignItems: 'center' },
  statValue: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  statLabel: { fontSize: FontSize.xs },
  linkActions: { flexDirection: 'row', gap: Spacing.sm },
  linkAction: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 8, borderRadius: Radius.md },
  linkActionText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  docsBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, padding: Spacing.md, borderRadius: Radius.md, borderWidth: 1, marginBottom: Spacing.lg },
  docsText: { flex: 1, fontSize: FontSize.sm, lineHeight: 18 },
  keyRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.sm },
  keyIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  keyLabel: { fontSize: FontSize.base, fontWeight: FontWeight.semibold },
  keyPreview: { fontSize: FontSize.sm, fontFamily: 'monospace', marginTop: 2 },
  keyMeta: { fontSize: FontSize.xs, marginTop: 2 },
  envBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: Radius.full },
  envText: { fontSize: 9, fontWeight: FontWeight.bold, letterSpacing: 0.4 },
  revokeBtn: { borderWidth: 1, borderRadius: Radius.md, paddingVertical: 8, alignItems: 'center' },
  revokeText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  envRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioInner: { width: 10, height: 10, borderRadius: 5 },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: Spacing.md },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold },
});
