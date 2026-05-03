import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/lib/theme';
import { Spacing, FontSize, FontWeight, Radius, Shadow } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { convertLocalToUsd, convertUsdToLocal, formatUsd } from '@/lib/currency';
import { useNotifications } from '@/lib/notifications';
import { useResponsive } from '@/lib/responsive';

type CurrencyInfo = {
  code: string;
  name: string;
  flag: string;
  rate: number;        // SSP per USD (illustrative mid-market)
  spread: number;      // PesaFi spread over mid
  featured?: boolean;
};

const CORRIDORS: CurrencyInfo[] = [
  { code: 'SSP', name: 'South Sudanese Pound', flag: '🇸🇸', rate: 6200, spread: 0.175, featured: true },
  { code: 'KES', name: 'Kenyan Shilling', flag: '🇰🇪', rate: 129.5, spread: 0.008 },
  { code: 'UGX', name: 'Ugandan Shilling', flag: '🇺🇬', rate: 3780, spread: 0.012 },
  { code: 'NGN', name: 'Nigerian Naira', flag: '🇳🇬', rate: 1580, spread: 0.015 },
  { code: 'GHS', name: 'Ghanaian Cedi', flag: '🇬🇭', rate: 15.2, spread: 0.01 },
  { code: 'TZS', name: 'Tanzanian Shilling', flag: '🇹🇿', rate: 2510, spread: 0.012 },
  { code: 'RWF', name: 'Rwandan Franc', flag: '🇷🇼', rate: 1340, spread: 0.012 },
  { code: 'ZAR', name: 'South African Rand', flag: '🇿🇦', rate: 18.4, spread: 0.008 },
];

export default function FxTab() {
  const router = useRouter();
  const { colors } = useTheme();
  const { add: addNotification } = useNotifications();
  const { isDesktop } = useResponsive();

  const [selected, setSelected] = useState<CurrencyInfo>(CORRIDORS[0]);
  const [direction, setDirection] = useState<'localToUsd' | 'usdToLocal'>('localToUsd');
  const [amount, setAmount] = useState('');

  const effectiveRate = useMemo(
    () => selected.rate * (1 + selected.spread),
    [selected]
  );

  const converted = useMemo(() => {
    const n = parseFloat((amount || '0').replace(/,/g, ''));
    if (!isFinite(n) || n <= 0) return 0;
    if (direction === 'localToUsd') return n / effectiveRate;
    return n * effectiveRate;
  }, [amount, direction, effectiveRate]);

  const handleConfirm = () => {
    const n = parseFloat((amount || '0').replace(/,/g, ''));
    if (!isFinite(n) || n <= 0) {
      Alert.alert('Invalid amount', 'Enter a valid amount to convert.');
      return;
    }

    addNotification({
      type: 'fx',
      title: 'FX request submitted',
      body: `${direction === 'localToUsd' ? `${n.toLocaleString()} ${selected.code} → ${formatUsd(converted)}` : `${formatUsd(n)} → ${Math.round(converted).toLocaleString()} ${selected.code}`} at ${Math.round(effectiveRate).toLocaleString()} ${selected.code}/USD. We'll confirm once settlement rails are live.`,
    });

    Alert.alert(
      'FX request submitted',
      'Your quote has been logged. Settlement via mobile money is coming online shortly.',
    );
    setAmount('');
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={[styles.scroll, isDesktop && styles.scrollDesktop]} showsVerticalScrollIndicator={false}>
        <View style={isDesktop ? styles.inner : undefined}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>Foreign Exchange</Text>
        </View>

        <View style={isDesktop ? styles.twoCol : undefined}>
        {/* Left column on desktop: hero + corridors list */}
        <View style={isDesktop ? styles.leftCol : undefined}>
        {/* Hero rate card (selected currency) */}
        <View style={{ paddingHorizontal: isDesktop ? 0 : Spacing.lg }}>
          <LinearGradient
            colors={selected.code === 'SSP' ? [colors.fxStart, colors.fxEnd] : [colors.gradientStart, colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroTop}>
              <Text style={styles.heroFlag}>{selected.flag}</Text>
              <View style={styles.liveDot}>
                <View style={styles.dot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            </View>
            <Text style={styles.heroName}>{selected.name}</Text>
            <Text style={styles.heroRate}>
              {Math.round(effectiveRate).toLocaleString()}{' '}
              <Text style={styles.heroRateSmall}>{selected.code} / USD</Text>
            </Text>
            <View style={styles.heroBottom}>
              <Text style={styles.heroMid}>
                Mid-market: {selected.rate.toLocaleString()} {selected.code}/USD
              </Text>
              <View style={styles.spreadBadge}>
                <Text style={styles.spreadText}>+{(selected.spread * 100).toFixed(1)}%</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* All corridors list */}
        <View style={{ paddingHorizontal: isDesktop ? 0 : Spacing.lg, marginTop: Spacing.lg }}>
          <Text style={[styles.listTitle, { color: colors.mutedForeground }]}>
            ALL CORRIDORS
          </Text>
          <View style={[styles.listWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {CORRIDORS.map((c, i) => {
              const isSelected = selected.code === c.code;
              const effRate = c.rate * (1 + c.spread);
              return (
                <TouchableOpacity
                  key={c.code}
                  onPress={() => setSelected(c)}
                  style={styles.listRow}
                  activeOpacity={0.7}
                >
                  <Text style={styles.listFlag}>{c.flag}</Text>
                  <View style={{ flex: 1 }}>
                    <View style={styles.listNameRow}>
                      <Text style={[styles.listCode, { color: colors.foreground }]}>{c.code}</Text>
                      {c.featured && (
                        <View style={[styles.featuredPill, { backgroundColor: colors.warning + '25' }]}>
                          <Text style={[styles.featuredText, { color: colors.warning }]}>FEATURED</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.listName, { color: colors.mutedForeground }]}>{c.name}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.listRate, { color: colors.foreground }]}>
                      {Math.round(effRate).toLocaleString()}
                    </Text>
                    <Text style={[styles.listSpread, { color: colors.mutedForeground }]}>
                      +{(c.spread * 100).toFixed(1)}% spread
                    </Text>
                  </View>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={18} color={colors.primary} style={{ marginLeft: 8 }} />
                  )}
                  {i < CORRIDORS.length - 1 && (
                    <View style={[styles.listDivider, { backgroundColor: colors.border }]} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
        </View>{/* end left col */}

        {/* Right column on desktop: converter */}
        <View style={isDesktop ? styles.rightCol : undefined}>
        {/* Converter */}
        <View style={{ paddingHorizontal: isDesktop ? 0 : Spacing.lg, marginTop: isDesktop ? 0 : Spacing.lg }}>
          <Card>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Convert</Text>

            {/* Direction toggle */}
            <View style={styles.toggleRow}>
              <TouchableOpacity
                onPress={() => setDirection('localToUsd')}
                style={[
                  styles.toggleBtn,
                  { borderColor: colors.border },
                  direction === 'localToUsd' && { backgroundColor: colors.primary, borderColor: colors.primary },
                ]}
              >
                <Text style={[
                  styles.toggleText,
                  { color: colors.foreground },
                  direction === 'localToUsd' && { color: '#08101D' },
                ]}>
                  {selected.code} → USD
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setDirection('usdToLocal')}
                style={[
                  styles.toggleBtn,
                  { borderColor: colors.border },
                  direction === 'usdToLocal' && { backgroundColor: colors.primary, borderColor: colors.primary },
                ]}
              >
                <Text style={[
                  styles.toggleText,
                  { color: colors.foreground },
                  direction === 'usdToLocal' && { color: '#08101D' },
                ]}>
                  USD → {selected.code}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={{ height: Spacing.md }} />

            <Input
              label={`You pay (${direction === 'localToUsd' ? selected.code : 'USD'})`}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="0.00"
            />

            <View style={[styles.receiveBox, { backgroundColor: colors.muted, borderColor: colors.border }]}>
              <Text style={[styles.receiveLabel, { color: colors.mutedForeground }]}>
                You receive (approx.)
              </Text>
              <Text style={[styles.receiveAmount, { color: colors.foreground }]}>
                {converted > 0
                  ? direction === 'localToUsd'
                    ? formatUsd(converted)
                    : `${selected.code} ${Math.round(converted).toLocaleString()}`
                  : '—'}
              </Text>
              <Text style={[styles.receiveHint, { color: colors.mutedForeground }]}>
                At ~{Math.round(effectiveRate).toLocaleString()} {selected.code} per 1 USD
              </Text>
            </View>

            <View style={{ height: Spacing.lg }} />
            <Button
              title="Request conversion"
              onPress={handleConfirm}
              disabled={!amount || parseFloat(amount) <= 0}
              fullWidth
            />
          </Card>
        </View>
        </View>{/* end right col */}
        </View>{/* end twoCol */}

        <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>
          Rates are illustrative and will be replaced with live feeds as each corridor goes live.
        </Text>
        </View>{/* end inner */}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingBottom: Spacing.xxl },
  scrollDesktop: { alignItems: 'center', paddingHorizontal: 40, paddingVertical: 32 },
  inner: { width: '100%', maxWidth: 1000 },
  twoCol: { flexDirection: 'row', gap: Spacing.xl, alignItems: 'flex-start' },
  leftCol: { flex: 1 },
  rightCol: { width: 360 },
  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.md },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold },

  heroCard: {
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    ...Shadow.hero,
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroFlag: { fontSize: 40 },
  liveDot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22C55E' },
  liveText: { color: 'white', fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 0.5 },
  heroName: { color: 'rgba(255,255,255,0.8)', fontSize: FontSize.sm, marginTop: Spacing.md },
  heroRate: { color: 'white', fontSize: FontSize.xxl, fontWeight: FontWeight.bold, marginTop: 4, letterSpacing: -0.5 },
  heroRateSmall: { color: 'rgba(255,255,255,0.7)', fontSize: FontSize.base, fontWeight: FontWeight.medium },
  heroBottom: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: Spacing.lg, paddingTop: Spacing.md,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.15)',
  },
  heroMid: { color: 'rgba(255,255,255,0.7)', fontSize: FontSize.xs },
  spreadBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: Radius.full,
  },
  spreadText: { color: 'white', fontSize: FontSize.xs, fontWeight: FontWeight.semibold },

  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold },

  toggleRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  toggleBtn: {
    flex: 1,
    height: 40,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },

  receiveBox: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  receiveLabel: { fontSize: FontSize.sm },
  receiveAmount: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, marginTop: 4 },
  receiveHint: { fontSize: FontSize.xs, marginTop: 4 },

  listTitle: {
    fontSize: 11,
    fontWeight: FontWeight.bold,
    letterSpacing: 1,
    marginBottom: Spacing.xs,
  },
  listWrap: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    position: 'relative',
  },
  listFlag: { fontSize: 24 },
  listNameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  listCode: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  listName: { fontSize: FontSize.xs, marginTop: 2 },
  listRate: { fontSize: FontSize.base, fontWeight: FontWeight.semibold },
  listSpread: { fontSize: FontSize.xs, marginTop: 2 },
  featuredPill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.full },
  featuredText: { fontSize: 9, fontWeight: FontWeight.bold, letterSpacing: 0.3 },
  listDivider: { position: 'absolute', bottom: 0, left: 56, right: 16, height: 1 },

  disclaimer: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    lineHeight: 16,
    fontStyle: 'italic',
  },
});
