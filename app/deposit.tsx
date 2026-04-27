import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Linking, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { supabase } from '@/lib/auth';
import { getWallet } from '@/lib/api/client';
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
    subtitle: 'Visa, Mastercard — instant via Coinbase',
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

  // In-app Coinbase WebView state
  const [coinbaseUrl, setCoinbaseUrl] = useState<string | null>(null);
  const [webviewLoading, setWebviewLoading] = useState(true);
  const webviewRef = useRef<WebView>(null);

  const handlePhone = (val: string) => {
    setPhone(val);
    const d = detectCountryFromPhone(val);
    if (d) { setProvider(d.provider); setLocalCurrency(d.currency); }
  };

  const closeCoinbase = async () => {
    setCoinbaseUrl(null);
    setWebviewLoading(true);
    // Refresh balance after closing Coinbase
    try {
      const updated = await getWallet('personal');
      console.log('[DEPOSIT] Balance after Coinbase:', updated.balance);
    } catch (e) {
      console.warn('[DEPOSIT] Balance refresh failed', e);
    }
    setDone(true);
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
    try {
      // Card, Apple Pay, ACH — all go through Coinbase Onramp
      if (selected === 'card' || selected === 'ach' || selected === 'applepay') {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Not signed in');

        const w = await getWallet('personal');
        if (!w.address) throw new Error('No wallet address found');

        const apiBase = process.env.EXPO_PUBLIC_API_BASE_URL || '';
        const res = await fetch(apiBase + '/api/coinbase/session-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + session.access_token,
          },
          body: JSON.stringify({ walletAddress: w.address }),
        });

        if (!res.ok) {
          const errBody = await res.text();
          throw new Error('Coinbase error: ' + (errBody || res.status));
        }

        const data = await res.json();
        const sessionToken = data.sessionToken || data.session_token || data.token;

        if (sessionToken) {
          const url = `https://pay.coinbase.com/buy/select-asset?sessionToken=${sessionToken}`;
          console.log('[DEPOSIT] Opening Coinbase:', url);
          if (Platform.OS === 'web') {
            // On web, open in a new tab (WebView is native-only)
            window.open(url, '_blank', 'noopener,noreferrer');
            setDone(true);
          } else {
            setCoinbaseUrl(url);
          }
        } else {
          throw new Error('No session token received. Response: ' + JSON.stringify(data));
        }
      }
      else if (selected === 'mobile_money') {
        Alert.alert('Mobile Money', 'Mobile money deposits coming soon. Use card or Apple Pay for now.');
      }
      else if (selected === 'yellow_card') {
        Alert.alert('Yellow Card', 'Yellow Card integration coming soon.');
      }
      else {
        setDone(true);
      }
    } catch (err: any) {
      Alert.alert('Deposit failed', err.message || 'Something went wrong. Try again.');
    } finally {
      setSubmitting(false);
    }
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

              {(selected === 'card' || selected === 'ach' || selected === 'applepay') && (
                <>
                  <View style={{ height: Spacing.md }} />
                  <Text style={styles.hint}>
                    You'll complete payment securely{selected === 'card' ? ' with your card' : selected === 'ach' ? ' via bank transfer' : ' with Apple Pay'}. Funds credit your PesaFi wallet once confirmed.
                  </Text>
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

      {/* ── COINBASE IN-APP WEBVIEW MODAL ── */}
      <Modal
        visible={!!coinbaseUrl}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeCoinbase}
      >
        <SafeAreaView style={styles.webviewSafe}>
          {/* Custom header bar */}
          <View style={styles.webviewHeader}>
            <TouchableOpacity onPress={closeCoinbase} hitSlop={12}>
              <Ionicons name="close" size={24} color={Colors.foreground} />
            </TouchableOpacity>
            <View style={styles.webviewTitleWrap}>
              <Ionicons name="lock-closed" size={12} color={Colors.success} style={{ marginRight: 6 }} />
              <Text style={styles.webviewTitle}>Secure Payment</Text>
            </View>
            <View style={{ width: 24 }} />
          </View>

          {/* Loading indicator */}
          {webviewLoading && (
            <View style={styles.webviewLoading}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.webviewLoadingText}>Loading payment page...</Text>
            </View>
          )}

          {/* The WebView */}
          {coinbaseUrl && (
            <WebView
              ref={webviewRef}
              source={{ uri: coinbaseUrl }}
              style={{ flex: 1, opacity: webviewLoading ? 0 : 1 }}
              onLoadEnd={() => setWebviewLoading(false)}
              onError={(e) => {
                console.error('[WEBVIEW] Error:', e.nativeEvent);
                Alert.alert('Error', 'Failed to load payment page. Please try again.');
                closeCoinbase();
              }}
              // Security & UX settings
              javaScriptEnabled={true}
              domStorageEnabled={true}
              startInLoadingState={true}
              scalesPageToFit={true}
              allowsBackForwardNavigationGestures={true}
              // Handle external links (e.g. "open in Coinbase app")
              onShouldStartLoadWithRequest={(request) => {
                const url = request.url;
                // Allow Coinbase domains
                if (
                  url.includes('coinbase.com') ||
                  url.includes('pay.coinbase.com') ||
                  url.includes('login.coinbase.com') ||
                  url.includes('accounts.google.com') ||
                  url.includes('appleid.apple.com') ||
                  url.startsWith('about:')
                ) {
                  return true;
                }
                // Block anything else (phishing protection)
                console.log('[WEBVIEW] Blocked external URL:', url);
                return false;
              }}
            />
          )}

          {/* Powered-by footer */}
          <View style={styles.webviewFooter}>
            <Text style={styles.webviewFooterText}>
              Powered by Coinbase  •  Secured by PesaFi
            </Text>
          </View>
        </SafeAreaView>
      </Modal>
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

  // WebView modal styles
  webviewSafe: { flex: 1, backgroundColor: Colors.background },
  webviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  webviewTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  webviewTitle: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.foreground,
  },
  webviewLoading: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  webviewLoadingText: {
    marginTop: Spacing.md,
    color: Colors.mutedForeground,
    fontSize: FontSize.sm,
  },
  webviewFooter: {
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  webviewFooterText: {
    fontSize: 11,
    color: Colors.mutedForeground,
    letterSpacing: 0.3,
  },
});
