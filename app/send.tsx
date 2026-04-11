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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors, Spacing, FontSize, FontWeight, Radius } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  formatUsd,
  formatLocal,
  detectCountryFromPhone,
  isValidEthAddress,
  convertLocalToUsd,
  convertUsdToLocal,
} from '@/lib/currency';
import { getWallet, sendUsdc, sendToMobileMoney } from '@/lib/api/client';
import type { MobileMoneyProvider } from '@/lib/types';
import { useAuth } from '@/lib/auth';

type Mode = 'choose' | 'wallet' | 'mobile' | 'success';

export default function SendScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ scannedAddress?: string }>();
  const { user } = useAuth();

  const [mode, setMode] = useState<Mode>('choose');
  const [balance, setBalance] = useState(0);
  const [sending, setSending] = useState(false);

  // Wallet send
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<'USD' | 'LOCAL'>('USD');

  // Mobile money send
  const [phone, setPhone] = useState('');
  const [accountName, setAccountName] = useState('');
  const [provider, setProvider] = useState<MobileMoneyProvider>('MPESA');
  const [localCurrency, setLocalCurrency] = useState('KES');

  const preferredCurrency = user?.preferred_currency ?? 'KES';

  useEffect(() => {
    getWallet().then((w) => setBalance(w.balance)).catch(() => {});
  }, []);

  // Pick up scanned address from /scan
  useEffect(() => {
    if (params.scannedAddress) {
      setRecipient(params.scannedAddress);
      setMode('wallet');
    }
  }, [params.scannedAddress]);

  const handlePhoneChange = (val: string) => {
    setPhone(val);
    const detected = detectCountryFromPhone(val);
    if (detected) {
      setLocalCurrency(detected.currency);
      setProvider(detected.provider);
    }
  };

  const usdAmount = (() => {
    const n = parseFloat(amount);
    if (isNaN(n)) return 0;
    if (currency === 'USD') return n;
    const cur = mode === 'mobile' ? localCurrency : preferredCurrency;
    return convertLocalToUsd(n, cur);
  })();

  const sendDisabled =
    sending ||
    !amount ||
    usdAmount <= 0 ||
    usdAmount > balance ||
    (mode === 'wallet' && !isValidEthAddress(recipient)) ||
    (mode === 'mobile' && (!phone || !accountName));

  const handleSendWallet = async () => {
    setSending(true);
    try {
      await sendUsdc({ recipientAddress: recipient.trim(), amount: usdAmount });
      setMode('success');
    } catch (e: any) {
      Alert.alert('Send failed', e.message ?? 'Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleSendMobile = async () => {
    setSending(true);
    try {
      await sendToMobileMoney({
        amountUsd: usdAmount,
        phoneNumber: phone.trim(),
        provider,
        accountName: accountName.trim(),
        localCurrency,
      });
      setMode('success');
    } catch (e: any) {
      Alert.alert('Send failed', e.message ?? 'Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => (mode === 'choose' || mode === 'success' ? router.back() : setMode('choose'))}
            hitSlop={10}
          >
            <Ionicons
              name={mode === 'choose' || mode === 'success' ? 'close' : 'arrow-back'}
              size={24}
              color={Colors.foreground}
            />
          </TouchableOpacity>
          <Text style={styles.title}>
            {mode === 'choose'  ? 'Send money' :
             mode === 'wallet'  ? 'Send to wallet' :
             mode === 'mobile'  ? 'Send to mobile money' :
                                  'Sent!'}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* CHOOSER */}
          {mode === 'choose' && (
            <>
              <Text style={styles.helperText}>How would you like to send?</Text>
              <ChoiceCard
                icon="wallet-outline"
                color={Colors.send}
                title="To wallet address"
                subtitle="Send USDC to any wallet on Base"
                onPress={() => setMode('wallet')}
              />
              <ChoiceCard
                icon="phone-portrait-outline"
                color={Colors.primary}
                title="To mobile money"
                subtitle="M-Pesa, MTN, Airtel"
                onPress={() => setMode('mobile')}
              />
              <ChoiceCard
                icon="qr-code-outline"
                color={Colors.accent}
                title="Scan QR code"
                subtitle="Scan a wallet address"
                onPress={() => router.push('/scan')}
              />
            </>
          )}

          {/* WALLET FORM */}
          {mode === 'wallet' && (
            <Card>
              <Input
                label="Recipient address"
                value={recipient}
                onChangeText={setRecipient}
                placeholder="0x..."
                autoCapitalize="none"
                rightAdornment={
                  <TouchableOpacity onPress={() => router.push('/scan')} hitSlop={8}>
                    <Ionicons name="qr-code-outline" size={20} color={Colors.primary} />
                  </TouchableOpacity>
                }
              />
              <View style={{ height: Spacing.lg }} />
              <CurrencyToggle
                value={currency}
                onChange={setCurrency}
                localLabel={preferredCurrency}
              />
              <View style={{ height: Spacing.md }} />
              <Input
                label={`Amount (${currency === 'USD' ? 'USD' : preferredCurrency})`}
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                keyboardType="decimal-pad"
                helperText={`Available: ${formatUsd(balance)}${
                  currency === 'LOCAL' ? `  •  ≈ ${formatLocal(balance, preferredCurrency)}` : ''
                }`}
              />
              {amount && parseFloat(amount) > 0 && (
                <Text style={styles.conversion}>
                  ≈ {currency === 'USD'
                    ? formatLocal(usdAmount, preferredCurrency)
                    : formatUsd(usdAmount)}
                </Text>
              )}
              <View style={{ height: Spacing.lg }} />
              <Button
                title={`Send ${formatUsd(usdAmount)}`}
                onPress={handleSendWallet}
                loading={sending}
                disabled={sendDisabled}
                fullWidth
              />
            </Card>
          )}

          {/* MOBILE MONEY FORM */}
          {mode === 'mobile' && (
            <Card>
              <Input
                label="Phone number"
                value={phone}
                onChangeText={handlePhoneChange}
                placeholder="+254712345678"
                keyboardType="phone-pad"
                helperText="Include country code. Provider auto-detects."
              />
              <View style={{ height: Spacing.md }} />
              <Input
                label="Recipient name"
                value={accountName}
                onChangeText={setAccountName}
                placeholder="Mary Wanjiku"
                autoCapitalize="words"
              />
              <View style={{ height: Spacing.md }} />
              <View style={styles.providerRow}>
                {(['MPESA', 'MTN', 'AIRTEL'] as const).map((p) => (
                  <TouchableOpacity
                    key={p}
                    onPress={() => setProvider(p)}
                    style={[styles.providerChip, provider === p && styles.providerChipActive]}
                  >
                    <Text style={[styles.providerText, provider === p && styles.providerTextActive]}>
                      {p === 'MPESA' ? 'M-Pesa' : p === 'MTN' ? 'MTN' : 'Airtel'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={{ height: Spacing.md }} />
              <CurrencyToggle value={currency} onChange={setCurrency} localLabel={localCurrency} />
              <View style={{ height: Spacing.md }} />
              <Input
                label={`Amount (${currency === 'USD' ? 'USD' : localCurrency})`}
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                keyboardType="decimal-pad"
                helperText={`Available: ${formatUsd(balance)}`}
              />
              {amount && parseFloat(amount) > 0 && (
                <Text style={styles.conversion}>
                  ≈ {currency === 'USD'
                    ? formatLocal(usdAmount, localCurrency)
                    : formatUsd(usdAmount)}
                </Text>
              )}
              <View style={{ height: Spacing.lg }} />
              <Button
                title={`Send ${formatUsd(usdAmount)}`}
                onPress={handleSendMobile}
                loading={sending}
                disabled={sendDisabled}
                fullWidth
              />
            </Card>
          )}

          {/* SUCCESS */}
          {mode === 'success' && (
            <Card>
              <View style={styles.successWrap}>
                <View style={styles.successIcon}>
                  <Ionicons name="checkmark" size={40} color="white" />
                </View>
                <Text style={styles.successTitle}>Sent successfully</Text>
                <Text style={styles.successText}>
                  {formatUsd(usdAmount)} is on its way. The recipient will be notified.
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

function ChoiceCard({
  icon,
  color,
  title,
  subtitle,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <Card style={{ marginBottom: Spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
          <View style={[styles.choiceIcon, { backgroundColor: color + '20' }]}>
            <Ionicons name={icon} size={24} color={color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.choiceTitle}>{title}</Text>
            <Text style={styles.choiceSubtitle}>{subtitle}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.mutedForeground} />
        </View>
      </Card>
    </TouchableOpacity>
  );
}

function CurrencyToggle({
  value,
  onChange,
  localLabel,
}: {
  value: 'USD' | 'LOCAL';
  onChange: (v: 'USD' | 'LOCAL') => void;
  localLabel: string;
}) {
  return (
    <View>
      <Text style={styles.toggleLabel}>Currency</Text>
      <View style={styles.toggleRow}>
        {(['USD', 'LOCAL'] as const).map((c) => {
          const active = value === c;
          return (
            <TouchableOpacity
              key={c}
              onPress={() => onChange(c)}
              style={[styles.toggleBtn, active && styles.toggleBtnActive]}
            >
              <Text style={[styles.toggleText, active && styles.toggleTextActive]}>
                {c === 'USD' ? 'USD' : localLabel}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
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
  helperText: { color: Colors.mutedForeground, marginBottom: Spacing.lg },

  choiceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceTitle: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.foreground },
  choiceSubtitle: { fontSize: FontSize.sm, color: Colors.mutedForeground, marginTop: 2 },

  toggleLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.foreground, marginBottom: Spacing.xs },
  toggleRow: { flexDirection: 'row', gap: Spacing.sm },
  toggleBtn: {
    flex: 1,
    height: 44,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
  },
  toggleBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  toggleText: { fontWeight: FontWeight.semibold, color: Colors.foreground },
  toggleTextActive: { color: '#08101D' },

  providerRow: { flexDirection: 'row', gap: Spacing.sm },
  providerChip: {
    flex: 1,
    height: 40,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
  },
  providerChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  providerText: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.foreground },
  providerTextActive: { color: '#08101D' },

  conversion: {
    fontSize: FontSize.sm,
    color: Colors.success,
    fontWeight: FontWeight.medium,
    marginTop: Spacing.xs,
  },

  successWrap: { alignItems: 'center', paddingVertical: Spacing.lg, gap: Spacing.md },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.foreground },
  successText: { fontSize: FontSize.base, color: Colors.mutedForeground, textAlign: 'center', marginBottom: Spacing.md },
});
