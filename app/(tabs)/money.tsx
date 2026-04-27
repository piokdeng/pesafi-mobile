import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/lib/theme';
import { Spacing, FontSize, FontWeight, Radius, Shadow } from '@/constants/theme';
import { useResponsive } from '@/lib/responsive';

export default function MoneyTab() {
  const router = useRouter();
  const { colors } = useTheme();
  const { isDesktop } = useResponsive();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.container, isDesktop && styles.containerDesktop]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>Money</Text>
      </View>

      <View style={[styles.grid, isDesktop && styles.gridDesktop]}>
        <TouchableOpacity onPress={() => router.push('/deposit')} activeOpacity={0.85} style={styles.cell}>
          <LinearGradient colors={[colors.deposit, colors.depositDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
            <View style={styles.cardIcon}>
              <Ionicons name="add-circle" size={28} color="white" />
            </View>
            <Text style={styles.cardTitle}>Deposit</Text>
            <Text style={styles.cardSub}>Card, Apple Pay, ACH</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/withdraw')} activeOpacity={0.85} style={styles.cell}>
          <LinearGradient colors={[colors.withdraw, colors.withdrawDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
            <View style={styles.cardIcon}>
              <Ionicons name="arrow-up-circle" size={28} color="white" />
            </View>
            <Text style={styles.cardTitle}>Withdraw</Text>
            <Text style={styles.cardSub}>Bank or mobile money</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1 },
  containerDesktop: { maxWidth: 780, width: '100%', alignSelf: 'center', paddingHorizontal: 40, paddingTop: 32 },
  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.md },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold },
  grid: { flexDirection: 'row', gap: Spacing.md, paddingHorizontal: Spacing.lg },
  gridDesktop: { paddingHorizontal: 0 },
  cell: { flex: 1 },
  card: {
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    minHeight: 170,
    justifyContent: 'flex-end',
    ...Shadow.card,
  },
  cardIcon: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  cardTitle: { color: 'white', fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  cardSub: { color: 'rgba(255,255,255,0.7)', fontSize: FontSize.xs, marginTop: 2 },
});
