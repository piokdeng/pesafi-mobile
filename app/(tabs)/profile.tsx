import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Spacing, FontSize, FontWeight, Radius } from '@/constants/theme';
import { useTheme } from '@/lib/theme';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/lib/auth';
import { usePreferences } from '@/lib/preferences';
import { SUPPORTED_CURRENCIES } from '@/lib/currency';

type RowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  right?: React.ReactNode;
  destructive?: boolean;
};

function Row({ icon, label, value, onPress, right, destructive }: RowProps) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress && !right}
      style={styles.row}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[
        styles.rowIcon,
        destructive
          ? { backgroundColor: colors.destructiveBg }
          : { backgroundColor: 'rgba(34,197,94,0.15)' },
      ]}>
        <Ionicons name={icon} size={18} color={destructive ? colors.destructive : colors.primary} />
      </View>
      <Text style={[styles.rowLabel, { color: destructive ? colors.destructive : colors.foreground }]}>{label}</Text>
      {right ?? (
        <View style={styles.rowRight}>
          {value && <Text style={[styles.rowValue, { color: colors.mutedForeground }]}>{value}</Text>}
          {onPress && <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />}
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user, signOut } = useAuth();
  const { prefs, setPref, toggle } = usePreferences();

  const initials = (user?.name ?? user?.email ?? 'U')
    .split(/[\s@]/)
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handleSignOut = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const handleCurrency = () => {
    Alert.alert(
      'Preferred currency',
      'Choose how local amounts are displayed.',
      [
        ...SUPPORTED_CURRENCIES.map((c) => ({
          text: c,
          onPress: () => setPref('preferredCurrency', c),
        })),
        { text: 'Cancel', style: 'cancel' as const },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerCard}
        >
          <View style={styles.avatarLg}>
            <Text style={styles.avatarLgText}>{initials}</Text>
          </View>
          <Text style={styles.userName}>{user?.name ?? 'PesaFi User'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          {user?.phone && <Text style={styles.userPhone}>{user.phone}</Text>}
        </LinearGradient>

        {/* Account section */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>ACCOUNT</Text>
        <Card padding={0}>
          <Row icon="person-outline" label="Edit profile" onPress={() => Alert.alert('Coming soon')} />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Row icon="cash-outline" label="Currency" value={prefs.preferredCurrency} onPress={handleCurrency} />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Row
            icon="business-outline"
            label="Switch to Business"
            onPress={() => Alert.alert('Business mode', 'Coming soon — your business workspace will live here.')}
          />
        </Card>

        {/* Privacy section */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>PRIVACY</Text>
        <Card padding={0}>
          <Row
            icon="eye-off-outline"
            label="Hide balance"
            right={
              <Switch
                value={prefs.hideBalance}
                onValueChange={() => toggle('hideBalance')}
                trackColor={{ false: colors.muted, true: colors.primary }}
              />
            }
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Row
            icon="finger-print-outline"
            label="Anonymize address"
            right={
              <Switch
                value={prefs.anonymizeAddress}
                onValueChange={() => toggle('anonymizeAddress')}
                trackColor={{ false: colors.muted, true: colors.primary }}
              />
            }
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Row
            icon="notifications-outline"
            label="Push notifications"
            right={
              <Switch
                value={prefs.notifications}
                onValueChange={() => toggle('notifications')}
                trackColor={{ false: colors.muted, true: colors.primary }}
              />
            }
          />
        </Card>

        {/* Support section */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>SUPPORT</Text>
        <Card padding={0}>
          <Row icon="help-circle-outline" label="Help center" onPress={() => Alert.alert('Coming soon')} />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Row icon="document-text-outline" label="Terms of service" onPress={() => Alert.alert('Coming soon')} />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Row icon="shield-checkmark-outline" label="Privacy policy" onPress={() => Alert.alert('Coming soon')} />
        </Card>

        {/* Sign out */}
        <Card padding={0} style={{ marginTop: Spacing.lg }}>
          <Row icon="log-out-outline" label="Sign out" onPress={handleSignOut} destructive />
        </Card>

        <Text style={[styles.version, { color: colors.mutedForeground }]}>PesaFi v0.1.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  headerCard: {
    borderRadius: Radius.xxl,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  avatarLg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  avatarLgText: { color: 'white', fontSize: 32, fontWeight: FontWeight.bold },
  userName: { color: 'white', fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  userEmail: { color: 'rgba(255,255,255,0.85)', fontSize: FontSize.sm, marginTop: 2 },
  userPhone: { color: 'rgba(255,255,255,0.7)', fontSize: FontSize.sm, marginTop: 2 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: FontWeight.bold,
    letterSpacing: 1,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { flex: 1, fontSize: FontSize.base, fontWeight: FontWeight.medium },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  rowValue: { fontSize: FontSize.sm },
  divider: { height: 1, marginLeft: 60 },
  version: {
    textAlign: 'center',
    fontSize: FontSize.xs,
    marginTop: Spacing.xl,
  },
});
