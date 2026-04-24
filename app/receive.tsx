import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Share,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';
import { useTheme } from '@/lib/theme';
import { Spacing, FontSize, FontWeight, Radius } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { getWallet } from '@/lib/api/client';
import { truncateAddress } from '@/lib/currency';
import { useAuth } from '@/lib/auth';

export default function ReceiveScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const [address, setAddress] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getWallet().then((w) => setAddress(w.address || null)).catch(() => {});
  }, []);

  const handleCopy = async () => {
    if (!address) return;
    await Clipboard.setStringAsync(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!address) return;
    await Share.share({ message: `Send me USDC on PesaFi: ${address}` });
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="close" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Receive money</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Card>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Scan this QR code or share your wallet address to receive USDC.
          </Text>

          {/* QR wrapper — fixed size, guaranteed visible background, centered */}
          <View style={styles.qrWrap}>
            <View style={styles.qrInner}>
              {address ? (
                <QRCode
                  value={address}
                  size={240}
                  color="#000000"
                  backgroundColor="#FFFFFF"
                  quietZone={8}
                />
              ) : (
                <View style={styles.qrLoading}>
                  <ActivityIndicator color={colors.primary} size="large" />
                </View>
              )}
            </View>
          </View>

          <Text style={[styles.userName, { color: colors.foreground }]}>
            {user?.name ?? 'Your wallet'}
          </Text>

          <TouchableOpacity
            onPress={handleCopy}
            style={[styles.addressPill, { backgroundColor: colors.muted }]}
            activeOpacity={0.7}
          >
            <Text style={[styles.addressText, { color: colors.foreground }]}>
              {address ? truncateAddress(address) : '...'}
            </Text>
            <Ionicons
              name={copied ? 'checkmark-circle' : 'copy-outline'}
              size={18}
              color={copied ? colors.success : colors.primary}
            />
          </TouchableOpacity>

          {copied && <Text style={[styles.copiedText, { color: colors.success }]}>Address copied!</Text>}

          <View style={styles.actionRow}>
            <Button
              title="Copy address"
              variant="outline"
              onPress={handleCopy}
              icon={<Ionicons name="copy-outline" size={18} color={colors.foreground} />}
              style={{ flex: 1 }}
            />
            <Button
              title="Share"
              onPress={handleShare}
              icon={<Ionicons name="share-outline" size={18} color="white" />}
              style={{ flex: 1 }}
            />
          </View>
        </Card>

        {/* Warning card */}
        <Card style={{ marginTop: Spacing.lg, backgroundColor: 'rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.3)' }}>
          <View style={{ flexDirection: 'row', gap: Spacing.md }}>
            <Ionicons name="warning-outline" size={20} color={colors.warning} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.warning, fontWeight: FontWeight.semibold, marginBottom: 4 }}>
                USDC on Base only
              </Text>
              <Text style={{ color: colors.foregroundSubtle, fontSize: FontSize.sm, lineHeight: 18 }}>
                Only send USDC on the Base network to this address. Other tokens or networks may be lost.
              </Text>
            </View>
          </View>
        </Card>
      </ScrollView>
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
  scroll: { padding: Spacing.lg },
  subtitle: {
    fontSize: FontSize.sm,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: 18,
  },
  qrWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.md,
  },
  qrInner: {
    width: 280,
    height: 280,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  qrLoading: {
    width: 240,
    height: 240,
    backgroundColor: '#F5F5F5',
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
  addressPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    borderRadius: Radius.full,
    marginTop: Spacing.sm,
  },
  addressText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    fontFamily: 'monospace',
  },
  copiedText: {
    textAlign: 'center',
    fontSize: FontSize.xs,
    marginTop: Spacing.xs,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
});
