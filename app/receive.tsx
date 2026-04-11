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
import { Colors, Spacing, FontSize, FontWeight, Radius } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { getWallet } from '@/lib/api/client';
import { truncateAddress } from '@/lib/currency';
import { useAuth } from '@/lib/auth';

export default function ReceiveScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [address, setAddress] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getWallet().then((w) => setAddress(w.address)).catch(() => {});
  }, []);

  const handleCopy = async () => {
    if (!address) return;
    await Clipboard.setStringAsync(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!address) return;
    await Share.share({
      message: `Send me USDC on PesaFi: ${address}`,
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="close" size={24} color={Colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.title}>Receive money</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Card>
          <Text style={styles.subtitle}>
            Scan this QR code or share your wallet address to receive USDC.
          </Text>

          <View style={styles.qrWrap}>
            {address ? (
              <View style={styles.qrInner}>
                <QRCode
                  value={address}
                  size={220}
                  color={Colors.foreground}
                  backgroundColor="white"
                />
              </View>
            ) : (
              <View style={styles.qrPlaceholder}>
                <ActivityIndicator color={Colors.primary} size="large" />
              </View>
            )}
          </View>

          {/* User name */}
          <Text style={styles.userName}>{user?.name ?? 'Your wallet'}</Text>

          {/* Address pill */}
          <TouchableOpacity onPress={handleCopy} style={styles.addressPill} activeOpacity={0.7}>
            <Text style={styles.addressText}>{address ? truncateAddress(address) : '...'}</Text>
            <Ionicons
              name={copied ? 'checkmark-circle' : 'copy-outline'}
              size={18}
              color={copied ? Colors.success : Colors.primary}
            />
          </TouchableOpacity>

          {copied && <Text style={styles.copiedText}>Address copied!</Text>}

          {/* Actions */}
          <View style={styles.actionRow}>
            <Button
              title="Copy address"
              variant="outline"
              onPress={handleCopy}
              icon={<Ionicons name="copy-outline" size={18} color={Colors.foreground} />}
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

        {/* Info card */}
        <Card style={{ marginTop: Spacing.lg, backgroundColor: 'rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.3)' }}>
          <View style={{ flexDirection: 'row', gap: Spacing.md }}>
            <Ionicons name="warning-outline" size={20} color={Colors.warning} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: Colors.warning, fontWeight: FontWeight.semibold, marginBottom: 4 }}>
                USDC on Base only
              </Text>
              <Text style={{ color: Colors.foregroundSubtle, fontSize: FontSize.sm, lineHeight: 18 }}>
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
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.mutedForeground,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  qrWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.md,
  },
  qrInner: {
    padding: Spacing.lg,
    backgroundColor: 'white',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  qrPlaceholder: {
    width: 252,
    height: 252,
    backgroundColor: Colors.muted,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.foreground,
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
  addressPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.muted,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    borderRadius: Radius.full,
    marginTop: Spacing.sm,
  },
  addressText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.foreground,
    fontFamily: 'monospace',
  },
  copiedText: {
    textAlign: 'center',
    color: Colors.success,
    fontSize: FontSize.xs,
    marginTop: Spacing.xs,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
});
