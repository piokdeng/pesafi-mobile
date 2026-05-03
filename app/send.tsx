import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Spacing, FontSize, FontWeight, Radius } from '@/constants/theme';
import { useTheme } from '@/lib/theme';
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
  const { colors } = useTheme();

  const [mode, setMode] = useState<Mode>('choose');
  const [balance, setBalance] = useState(0);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    setError(null);
    setSending(true);
    try {
      await sendUsdc({ recipientAddress: recipient.trim(), amount: usdAmount });
      setMode('success');
    } catch (e: any) {
      setError(e.message ?? 'Send failed. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleSendMobile = async () => {
    setError(null);
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
      setError(e.message ?? 'Send failed. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => { setError(null); mode === 'choose' || mode === 'success' ? router.back() : setMode('choose'); }}
            hitSlop={10}
          >
            <Ionicons
              name={mode === 'choose' || mode === 'success' ? 'close' : 'arrow-back'}
              size={24}
              color={colors.foreground}
            />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.foreground }]}>
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
              <Text style={[styles.helperText, { color: colors.mutedForeground }]}>How would you like to send?</Text>
              <ChoiceCard
                icon="wallet-outline"
                color={colors.send}
                title="To wallet address"
                subtitle="Send USDC to any wallet on Base"
                onPress={() => setMode('wallet')}
              />
              <ChoiceCard
                icon="phone-portrait-outline"
                color={colors.primary}
                title="To mobile money"
                subtitle="M-Pesa, MTN, Airtel"
                onPress={() => setMode('mobile')}
              />
              <ChoiceCard
                icon="qr-code-outline"
                color={colors.accent}
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
                    <Ionicons name="qr-code-outline" size={20} color={colors.primary} />
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
                <Text style={[styles.conversion, { color: colors.success }]}>
                  ≈ {currency === 'USD'
                    ? formatLocal(usdAmount, preferredCurrency)
                    : formatUsd(usdAmount)}
                </Text>
              )}
              <View style={{ height: Spacing.lg }} />
              {error && (
                <Text style={[styles.errorText, { color: colors.destructive, backgroundColor: colors.destructiveBg }]}>
                  {error}
                </Text>
              )}
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
              <ProviderRow provider={provider} onSelect={setProvider} />
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
                <Text style={[styles.conversion, { color: colors.success }]}>
                  ≈ {currency === 'USD'
                    ? formatLocal(usdAmount, localCurrency)
                    : formatUsd(usdAmount)}
                </Text>
              )}
              <View style={{ height: Spacing.lg }} />
              {error && (
                <Text style={[styles.errorText, { color: colors.destructive, backgroundColor: colors.destructiveBg }]}>
                  {error}
                </Text>
              )}
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
                <View style={[styles.successIcon, { backgroundColor: colors.primary }]}>
                  <Ionicons name="checkmark" size={40} color="white" />
                </View>
                <Text style={[styles.successTitle, { color: colors.foreground }]}>Sent successfully</Text>
                <Text style={[styles.successText, { color: colors.mutedForeground }]}>
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
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <Card style={{ marginBottom: Spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
          <View style={[styles.choiceIcon, { backgroundColor: color + '20' }]}>
            <Ionicons name={icon} size={24} color={color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.choiceTitle, { color: colors.foreground }]}>{title}</Text>
            <Text style={[styles.choiceSubtitle, { color: colors.mutedForeground }]}>{subtitle}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
        </View>
      </Card>
    </TouchableOpacity>
  );
}

function ProviderRow({
  provider,
  onSelect,
}: {
  provider: MobileMoneyProvider;
  onSelect: (p: MobileMoneyProvider) => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.providerRow}>
      {(['MPESA', 'MTN', 'AIRTEL'] as const).map((p) => {
        const active = provider === p;
        return (
          <TouchableOpacity
            key={p}
            onPress={() => onSelect(p)}
            style={[
              styles.providerChip,
              { borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.primary : colors.card },
            ]}
          >
            <Text style={[styles.providerText, { color: active ? '#08101D' : colors.foreground }]}>
              {p === 'MPESA' ? 'M-Pesa' : p === 'MTN' ? 'MTN' : 'Airtel'}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
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
  const { colors } = useTheme();
  return (
    <View>
      <Text style={[styles.toggleLabel, { color: colors.foreground }]}>Currency</Text>
      <View style={styles.toggleRow}>
        {(['USD', 'LOCAL'] as const).map((c) => {
          const active = value === c;
          return (
            <TouchableOpacity
              key={c}
              onPress={() => onChange(c)}
              style={[
                styles.toggleBtn,
                { borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.primary : colors.card },
              ]}
            >
              <Text style={[styles.toggleText, { color: active ? '#08101D' : colors.foreground }]}>
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
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  title: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  scroll: { padding: Spacing.lg },
  helperText: { marginBottom: Spacing.lg },

  choiceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceTitle: { fontSize: FontSize.base, fontWeight: FontWeight.semibold },
  choiceSubtitle: { fontSize: FontSize.sm, marginTop: 2 },

  toggleLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, marginBottom: Spacing.xs },
  toggleRow: { flexDirection: 'row', gap: Spacing.sm },
  toggleBtn: {
    flex: 1,
    height: 44,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleText: { fontWeight: FontWeight.semibold },

  providerRow: { flexDirection: 'row', gap: Spacing.sm },
  providerChip: {
    flex: 1,
    height: 40,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerText: { fontSize: FontSize.sm, fontWeight: FontWeight.medium },

  conversion: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    marginTop: Spacing.xs,
  },

  successWrap: { alignItems: 'center', paddingVertical: Spacing.lg, gap: Spacing.md },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  successText: { fontSize: FontSize.base, textAlign: 'center', marginBottom: Spacing.md },
  errorText: {
    fontSize: FontSize.sm,
    padding: Spacing.sm,
    borderRadius: Radius.sm,
    marginBottom: Spacing.sm,
  },
});
