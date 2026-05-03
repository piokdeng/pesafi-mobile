import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Spacing, FontSize, FontWeight, Radius } from '@/constants/theme';
import { useTheme } from '@/lib/theme';
import { Button } from '@/components/ui/Button';
import { isValidEthAddress } from '@/lib/currency';

export default function ScanScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    if (!permission) requestPermission();
  }, [permission]);

  const handleBarcode = ({ data }: { data: string }) => {
    if (scanned) return;
    const text = data.trim();
    if (isValidEthAddress(text)) {
      setScanned(true);
      // Pass the scanned address back to the send screen
      router.replace({ pathname: '/send', params: { scannedAddress: text } });
    }
  };

  if (!permission) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.permissionWrap}>
          <Ionicons name="camera-outline" size={64} color={colors.mutedForeground} />
          <Text style={[styles.permTitle, { color: colors.foreground }]}>Camera permission needed</Text>
          <Text style={[styles.permText, { color: colors.mutedForeground }]}>
            PesaFi needs camera access to scan wallet QR codes for sending money.
          </Text>
          <Button title="Allow camera" onPress={requestPermission} fullWidth />
          <TouchableOpacity onPress={() => Linking.openSettings()} style={{ marginTop: Spacing.md }}>
            <Text style={[styles.settingsLink, { color: colors.primary }]}>Open settings</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.fullScreen}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={handleBarcode}
      />

      {/* Overlay */}
      <SafeAreaView style={styles.overlay}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn} hitSlop={10}>
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.overlayTitle}>Scan QR code</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.frameWrap}>
          <View style={styles.frame}>
            <View style={[styles.corner, styles.cornerTL, { borderColor: colors.primary }]} />
            <View style={[styles.corner, styles.cornerTR, { borderColor: colors.primary }]} />
            <View style={[styles.corner, styles.cornerBL, { borderColor: colors.primary }]} />
            <View style={[styles.corner, styles.cornerBR, { borderColor: colors.primary }]} />
          </View>
          <Text style={styles.hint}>Point your camera at a wallet QR code</Text>
        </View>

        <View style={{ flex: 1 }} />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  fullScreen: { flex: 1, backgroundColor: 'black' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayTitle: { color: 'white', fontSize: FontSize.lg, fontWeight: FontWeight.semibold },
  frameWrap: {
    alignItems: 'center',
    marginTop: Spacing.xxl * 2,
  },
  frame: {
    width: 260,
    height: 260,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 32,
    height: 32,
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: Radius.md },
  cornerTR: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: Radius.md },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: Radius.md },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: Radius.md },
  hint: {
    color: 'white',
    fontSize: FontSize.base,
    marginTop: Spacing.xl,
    textAlign: 'center',
  },
  permissionWrap: {
    flex: 1,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  permTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
  },
  permText: {
    fontSize: FontSize.base,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  settingsLink: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
});
