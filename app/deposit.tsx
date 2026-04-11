import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
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
import type { MobileMoneyProvider } from '@/lib/types';

type MethodKey = 'card' | 'applepay' | 'ach' | 'mobile_money' | 'yellow_card' | 'transfer';

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
    key: 'card',
    title: 'Debit / Credit card',
    subtitle: 'Visa, Mastercard, Amex — instant',
    icon: 'card',
    color: '#3B82F6',
    badge: 'Instant',
  },
  {
    key: 'applepay',
    title: 'Apple Pay',
    subtitle: 'Face ID / Touch ID — fastest',
    icon: 'logo-apple',
    color: '#F8FAFC',
    badge: 'Fastest',
  },
  {
    key: 'ach',
    title: 'Bank transfer (ACH)',
    subtitle: 'US bank account — 1–3 business days',
    icon: 'business',
    color: '#8B5CF6',
  },
  {
    key: 'mobile_money',
    title: 'Mobile money',
    subtitle: 'M-Pesa, MTN MoMo, Airtel Money',
    icon: 'phone-portrait',
    color: Colors.primary,
  },
  {
    key: 'yellow_card',
    title: 'Yellow Card',
    subtitle: 'Local currency → USDC across Africa',
    icon: 'sunny',
    color: '#F59E0B',
    badge: 'New',
  },
  {
    key: 'transfer',
    title: 'External wallet',
    subtitle: 'Transfer USDC from another wallet',
    icon: 'arrow-down-circle',
    color: '#22C55E',
  },
];

export default function DepositScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<MethodKey | null>(null);
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState('');
  const [provider, setProvider] = useState<MobileMoneyProvider>('MPESA');
  const [localCurrency, setLocalCurrency] = useState('KES');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handlePhone = (val: string) => {
    setPhone(val);
    const d = detectCountryFromPhone(val);
    if (d) { setProvider(d.provider); setLocalCurrency(d.currency); }
  };

  const handleSubmit = async () => {
    const usd = parseFloat(amount);
    if (!usd || usd <= 0) {
      Alert.alert('Invalid amount', 'Enter a valid USD amount.');
      return;
    }
    if (selected === 'mobile_money' && !phone) {
      Alert.alert('Phone required', 'Enter the phone number to pay from.');
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setDone(true);
    }, 1200);
  };

  const reset = () => {
    setSelected(null);
    setAmount('');
    setPhone('');
    setDone(false);
  };

  const method = selected ? METHODS.find((m) => m.key === selected)! : null;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => (selected && !done ? reset() : router.back())} hitSlop={10}>
            <Ionicons name={selected && !done ? 'arrow-back' : 'close'} size={24} color={Colors.foreground} />
          </TouchableOpacity>
          <Text style={styles.title}>
            {done ? 'Deposit initiated' : selected ? method!.title : 'Add money'}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* STEP 1: pick method */}
          {!selected && (
            <>
              <Text style={styles.subtitle}>Choose how you want to add money to your wallet.</Text>
              {METHODS.map((m) => (
                <TouchableOpacity
                  key={m.key}
                  activeOpacity={0.85}
                  onPress={() => (m.key === 'transfer' ? router.replace('/receive') : setSelected(m.key))}
                >
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

          {/* STEP 2: enter details */}
          {selected && !done && (
            <Card>
              <Input
                label="Amount (USD)"
                value={amount}
                onChangeText={setAmount}
                placeholder="100.00"
                keyboardType="decimal-pad"
              />

              {selected === 'mobile_money' && (
                <>
                  <View style={{ height: Spacing.md }} />
                  <Input
                    label="Phone number"
                    value={phone}
                    onChangeText={handlePhone}
                    placeholder="+254712345678"
                    keyboardType="phone-pad"
                    helperText={`${provider} • ${localCurrency} • ≈ ${formatLocal(parseFloat(amount) || 0, localCurrency)}`}
                  />
                </>
              )}

              {selected === 'card' && (
                <>
                  <View style={{ height: Spacing.md }} />
                  <Input label="Card number" value="" onChangeText={() => {}} placeholder="4242 4242 4242 4242" keyboardType="number-pad" />
                  <View style={{ height: Spacing.md }} />
                  <View style={{ flexDirection: 'row', gap: Spacing.md }}>
                    <View style={{ flex: 1 }}>
                      <Input label="Expiry" value="" onChangeText={() => {}} placeholder="MM/YY" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Input label="CVC" value="" onChangeText={() => {}} placeholder="123" secureTextEntry />
                    </View>
                  </View>
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
                <>
                  <View style={{ height: Spacing.md }} />
                  <Text style={styles.hint}>
                    You'll be redirected to Yellow Card to complete payment in your local currency.
                    Supported: NGN, KES, GHS, ZAR, UGX, TZS, XAF, XOF.
                  </Text>
                </>
              )}

              {selected === 'applepay' && (
                <>
                  <View style={{ height: Spacing.md }} />
                  <Text style={styles.hint}>Confirm with Face ID on the next screen.</Text>
                </>
              )}

              <View style={{ height: Spacing.lg }} />
              <Button
                title={`Deposit ${formatUsd(parseFloat(amount) || 0)}`}
                onPress={handleSubmit}
                loading={submitting}
                disabled={!amount || parseFloat(amount) <= 0}
                fullWidth
              />
            </Card>
          )}

          {/* DONE */}
          {done && (
            <Card>
              <View style={styles.successWrap}>
                <View style={styles.successIcon}>
                  <Ionicons name="checkmark" size={40} color="white" />
                </View>
                <Text style={styles.successTitle}>Deposit initiated</Text>
                <Text style={styles.successText}>
                  {formatUsd(parseFloat(amount) || 0)} via {method?.title}. It will appear in your balance shortly.
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
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
  successWrap: { alignItems: 'center', paddingVertical: Spacing.lg, gap: Spacing.md },
  successIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  successTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.foreground },
  successText: { fontSize: FontSize.base, color: Colors.mutedForeground, textAlign: 'center' },
});
