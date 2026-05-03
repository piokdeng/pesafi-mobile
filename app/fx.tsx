import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/lib/theme';
import { Spacing, FontSize, FontWeight, Radius, Shadow } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { sspToUsd, pesafiSspPerUsd, SSP_FX_CONFIG, formatSsp } from '@/lib/fx';
import { formatUsd } from '@/lib/currency';

/**
 * South Sudan FX screen.
 */
export default function FxScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [sspAmount, setSspAmount] = useState('1000000');

  const parsedSsp = useMemo(() => {
    const n = parseFloat(sspAmount.replace(/,/g, ''));
    return Number.isFinite(n) && n > 0 ? n : 0;
  }, [sspAmount]);

  const usdOut = useMemo(() => sspToUsd(parsedSsp), [parsedSsp]);
  const rate = pesafiSspPerUsd();

  const handleRequest = () => {
    if (parsedSsp <= 0) {
      Alert.alert('Invalid amount', 'Enter a valid SSP amount.');
      return;
    }
    Alert.alert(
      'FX request submitted',
      'Settlement via mobile money and treasury rails is coming online. Your quote is for planning only until onboarding is complete.',
    );
  };

  const handleBusinessFx = () => {
    Linking.openURL('mailto:hello@pesafi.ai?subject=Business%20FX%20account');
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="arrow-back" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.foreground }]}>South Sudan FX</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Convert SSP to USDC at the published PesaFi rate. Pay in through mobile money;
            dollars credit to this wallet after treasury confirmation.
          </Text>

          {/* Live rate display — intentionally dark card regardless of theme */}
          <LinearGradient
            colors={['#1F2937', '#111827']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.rateCard, { borderColor: colors.border }]}
          >
            <View style={styles.rateRow}>
              <View>
                <Text style={styles.rateLabel}>PesaFi rate</Text>
                <Text style={styles.rateValue}>
                  {Math.round(rate).toLocaleString()}{' '}
                  <Text style={styles.rateValueSmall}>SSP / USD</Text>
                </Text>
              </View>
              <View style={styles.spreadBadge}>
                <Text style={styles.spreadText}>
                  +{(SSP_FX_CONFIG.spreadOverMid * 100).toFixed(1)}% spread
                </Text>
              </View>
            </View>
            <View style={styles.rateDivider} />
            <View style={styles.rateRow}>
              <Text style={styles.rateMuted}>
                Mid-market: {SSP_FX_CONFIG.midMarketSspPerUsd.toLocaleString()} SSP/USD
              </Text>
              <View style={styles.liveDot}>
                <View style={styles.dot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            </View>
          </LinearGradient>

          {/* Conversion estimator */}
          <Card>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIcon, { backgroundColor: 'rgba(34,197,94,0.15)' }]}>
                <Ionicons name="phone-portrait-outline" size={20} color={colors.primary} />
              </View>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>Estimate conversion</Text>
            </View>

            <View style={{ height: Spacing.md }} />

            <Input
              label="You pay (SSP)"
              value={sspAmount}
              onChangeText={setSspAmount}
              placeholder="e.g. 1000000"
              keyboardType="decimal-pad"
            />

            <View style={[styles.receiveBox, { backgroundColor: colors.muted, borderColor: colors.border }]}>
              <Text style={[styles.receiveLabel, { color: colors.mutedForeground }]}>You receive (approx.)</Text>
              <Text style={[styles.receiveAmount, { color: colors.foreground }]}>
                {parsedSsp > 0 ? formatUsd(usdOut) : '—'}
              </Text>
              <Text style={[styles.receiveHint, { color: colors.mutedForeground }]}>
                At ~{Math.round(rate).toLocaleString()} SSP per 1 USD
              </Text>
            </View>

            <View style={{ height: Spacing.lg }} />

            <Button
              title="Request conversion"
              onPress={handleRequest}
              fullWidth
              disabled={parsedSsp <= 0}
            />

            <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>
              This action reserves your intent; operations will confirm KYC, limits, and
              mobile-money receipt as we enable South Sudan production flows.
            </Text>
          </Card>

          {/* Business FX */}
          <Card style={{ marginTop: Spacing.lg }}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIcon, { backgroundColor: 'rgba(249,115,22,0.15)' }]}>
                <Ionicons name="business-outline" size={20} color={colors.accent} />
              </View>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>Business FX</Text>
            </View>

            <Text style={[styles.businessText, { color: colors.mutedForeground }]}>
              Companies and NGOs can open a Business FX line: deposit operating SSP, convert
              at a locked screen rate, and pay suppliers from the same ledger — keeping
              audits clean.
            </Text>

            <View style={{ height: Spacing.md }} />
            <Button
              title="Talk to us about Business FX"
              variant="outline"
              onPress={handleBusinessFx}
              fullWidth
            />
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  subtitle: {
    fontSize: FontSize.sm,
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },

  rateCard: {
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    ...Shadow.card,
  },
  rateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  // Rate card text uses white because the gradient is always dark
  rateLabel: {
    fontSize: FontSize.xs,
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  rateValue: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: '#F8FAFC',
  },
  rateValueSmall: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: '#94A3B8',
  },
  spreadBadge: {
    backgroundColor: 'rgba(245,158,11,0.15)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  spreadText: {
    color: '#F59E0B',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  rateDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: Spacing.md,
  },
  rateMuted: {
    fontSize: FontSize.xs,
    color: '#94A3B8',
  },
  liveDot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
  },
  liveText: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    color: '#22C55E',
    letterSpacing: 0.5,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
  },

  receiveBox: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  receiveLabel: {
    fontSize: FontSize.sm,
  },
  receiveAmount: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    marginTop: 4,
  },
  receiveHint: {
    fontSize: FontSize.xs,
    marginTop: 4,
  },
  disclaimer: {
    fontSize: FontSize.xs,
    lineHeight: 16,
    marginTop: Spacing.md,
  },
  businessText: {
    fontSize: FontSize.sm,
    lineHeight: 20,
    marginTop: Spacing.md,
  },
});
