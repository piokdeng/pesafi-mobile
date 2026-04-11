import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing, FontSize, FontWeight, Radius } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { detectCountryFromPhone, formatLocal, formatUsd } from '@/lib/currency';
import { getWallet, sendToMobileMoney } from '@/lib/api/client';
import type { MobileMoneyProvider } from '@/lib/types';

type MethodKey = 'card' | 'applepay' | 'ach' | 'mobile_money' | 'yellow_card';

type Method = {
  key: MethodKey;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  badge?: string;
};

const METHODS: Method[] = [
  {
    key: 'mobile_money',
    title: 'Mobile money',
    subtitle: 'M-Pesa, MTN MoMo (Uganda, Rwanda, SSD, Ghana), Airtel',
    icon: 'phone-portrait',
    color: Colors.primary,
    badge: 'Instant',
  },
  {
    key: 'yellow_card',
    title: 'Yellow Card',
    subtitle: 'USDC → local currency across Africa',
    icon: 'sunny',
    color: '#F59E0B',
    badge: 'New',
  },
  {
    key: 'card',
    title: 'To debit card',
    subtitle: 'Visa / Mastercard — within minutes',
    icon: 'card',
    color: '#3B82F6',
  },
  {
    key: 'ach',
    title: 'Bank transfer (ACH)',
    subtitle: 'US bank account — 1–3 business days',
    icon: 'business',
    color: '#8B5CF6',
  },
  {
    key: 'applepay',
    title: 'Apple Cash',
    subtitle: 'Send to Apple Cash via Apple Pay',
    icon: 'logo-apple',
    color: '#F8FAFC',
  },
];

export default function WithdrawScreen() {
  const router = useRouter();
  const [balance, setBalance] = useState(0);
  const [selected, setSelected] = useState<MethodKey | null>(null);
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState('');
  const [accountName, setAccountName] = useState('');
  const [provider, setProvider] = useState<MobileMoneyProvider>('MPESA');
  const [localCurrency, setLocalCurrency] = useState('KES');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    getWallet().then((w) => setBalance(w.balance)).catch(() => {});
  }, []);

  const handlePhone = (val: string) => {
    setPhone(val);
    const d = detectCountryFromPhone(val);
    if (d) { setProvider(d.provider); setLocalCurrency(d.currency); }
  };

  const usdAmount = parseFloat(amount) || 0;
  const disabled = !amount || usdAmount <= 0 || usdAmount > balance ||
    (selected === 'mobile_money' && (!phone || !accountName));

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      if (selected === 'mobile_money') {
        await sendToMobileMoney({
          amountUsd: usdAmount,
          phoneNumber: phone.trim(),
          provider,
          accountName: accountName.trim(),
          localCurrency,
        });
      } else {
        await new Promise((r) => setTimeout(r, 1200));
      }
      setDone(true);
    } catch (e: any) {
      Alert.alert('Withdrawal failed', e.message ?? 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => { setSelected(null); setAmount(''); setPhone(''); setAccountName(''); setDone(false); };
  const method = selected ? METHODS.find((m) => m.key === selected)! : null;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => (selected && !done ? reset() : router.back())} hitSlop={10}>
            <Ionicons name={selected && !done ? 'arrow-back' : 'close'} size={24} color={Colors.foreground} />
          </TouchableOpacity>
          <Text style={styles.title}>{done ? 'Withdrawal sent' : selected ? method!.title : 'Withdraw'}</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {!selected && (
            <>
              <Text style={styles.subtitle}>
                Available: {formatUsd(balance)}. Choose how you want to withdraw.
              </Text>
              {METHODS.map((m) => (
                <TouchableOpacity key={m.key} activeOpacity={0.85} onPress={() => setSelected(m.key)}>
                  <Card style={{ marginBottom: Spacing.md }}>
                    <View style={styles.row}>
                      <View style={[styles.iconWrap, { backgroundColor: m.color + '25' }]}>
                        <Ionicons name={m.icon} size={22} color={m.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={styles.titleRow}>
                          <Text style={styles.methodTitle}>{m.title}</Text>
                          {m.badge && (
                            <View style={styles.badge}>
                              <Text style={styles.badgeText}>{m.badge}</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.methodSubtitle}>{m.subtitle}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color={Colors.mutedForeground} />
                    </View>
                  </Card>
                </TouchableOpacity>
              ))}
            </>
          )}

          {selected && !done && (
            <Card>
              <Input
                label="Amount (USD)"
                value={amount}
                onChangeText={setAmount}
                placeholder="50.00"
                keyboardType="decimal-pad"
                helperText={`Available: ${formatUsd(balance)}`}
              />

              {selected === 'mobile_money' && (
                <>
                  <View style={{ height: Spacing.md }} />
                  <Input label="Phone number" value={phone} onChangeText={handlePhone} placeholder="+254712345678" keyboardType="phone-pad" helperText={`${provider} • ${localCurrency}`} />
                  <View style={{ height: Spacing.md }} />
                  <Input label="Account name" value={accountName} onChangeText={setAccountName} placeholder="Mary Wanjiku" autoCapitalize="words" />
                  {usdAmount > 0 && (
                    <Text style={styles.conv}>≈ {formatLocal(usdAmount, localCurrency)}</Text>
                  )}
                </>
              )}

              {selected === 'card' && (
                <>
                  <View style={{ height: Spacing.md }} />
                  <Input label="Card number" value="" onChangeText={() => {}} placeholder="4242 4242 4242 4242" keyboardType="number-pad" />
                </>
              )}

              {selected === 'ach' && (
                <>
                  <View style={{ height: Spacing.md }} />
                  <Input label="Routing number" value="" onChangeText={() => {}} placeholder="9 digits" keyboardType="number-pad" />
                  <View style={{ height: Spacing.md }} />
                  <Input label="Account number" value="" onChangeText={() => {}} placeholder="Account number" keyboardType="number-pad" />
                </>
              )}

              {selected === 'yellow_card' && (
                <Text style={[styles.hint, { marginTop: Spacing.md }]}>
                  You'll be redirected to Yellow Card to receive funds in your local currency.
                  Supported: NGN, KES, GHS, ZAR, UGX, TZS, XAF, XOF.
                </Text>
              )}

              {selected === 'applepay' && (
                <Text style={[styles.hint, { marginTop: Spacing.md }]}>
                  Funds go straight to your Apple Cash balance. Confirm with Face ID next.
                </Text>
              )}

              <View style={{ height: Spacing.lg }} />
              <Button
                title={`Withdraw ${formatUsd(usdAmount)}`}
                onPress={handleSubmit}
                loading={submitting}
                disabled={disabled}
                fullWidth
              />
            </Card>
          )}

          {done && (
            <Card>
              <View style={styles.successWrap}>
                <View style={styles.successIcon}>
                  <Ionicons name="checkmark" size={40} color="white" />
                </View>
                <Text style={styles.successTitle}>Withdrawal sent</Text>
                <Text style={styles.successText}>
                  {formatUsd(usdAmount)} via {method?.title} is on its way.
                </Text>
                <Button title="Done" onPress={() => router.back()} fullWidth />
              </View>
            </Card>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.md },
  title: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.foreground },
  scroll: { padding: Spacing.lg },
  subtitle: { color: Colors.mutedForeground, marginBottom: Spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  iconWrap: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  methodTitle: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.foreground },
  methodSubtitle: { fontSize: FontSize.sm, color: Colors.mutedForeground, marginTop: 2 },
  badge: { backgroundColor: Colors.successBg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.full },
  badgeText: { fontSize: 10, fontWeight: FontWeight.bold, color: Colors.success, letterSpacing: 0.3 },
  hint: { fontSize: FontSize.sm, color: Colors.mutedForeground, lineHeight: 20 },
  conv: { fontSize: FontSize.sm, color: Colors.success, fontWeight: FontWeight.medium, marginTop: Spacing.xs },
  successWrap: { alignItems: 'center', paddingVertical: Spacing.lg, gap: Spacing.md },
  successIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  successTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.foreground },
  successText: { fontSize: FontSize.base, color: Colors.mutedForeground, textAlign: 'center' },
});
