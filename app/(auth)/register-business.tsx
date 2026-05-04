import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';
import { Spacing, FontSize, FontWeight, Radius } from '@/constants/theme';

const BUSINESS_TYPES = ['Retail', 'Restaurant', 'Services', 'Technology', 'Agriculture', 'Healthcare', 'Other'] as const;
type BusinessType = typeof BUSINESS_TYPES[number];

const COUNTRIES = ['Kenya', 'Uganda', 'Tanzania', 'Ghana', 'Nigeria', 'Rwanda', 'South Sudan', 'Other'] as const;
type Country = typeof COUNTRIES[number];

export default function RegisterBusinessScreen() {
  const router = useRouter();
  const { signUpBusiness } = useAuth();
  const { colors } = useTheme();

  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState<BusinessType | null>(null);
  const [country, setCountry] = useState<Country | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!businessName.trim()) {
      Alert.alert('Missing info', 'Please enter your business name.');
      return;
    }
    if (!businessType) {
      Alert.alert('Missing info', 'Please select a business type.');
      return;
    }
    if (!country) {
      Alert.alert('Missing info', 'Please select a country.');
      return;
    }
    if (!fullName.trim()) {
      Alert.alert('Missing info', 'Please enter your full name.');
      return;
    }
    if (!email.trim()) {
      Alert.alert('Missing info', 'Please enter your email address.');
      return;
    }
    if (!phone.trim()) {
      Alert.alert('Missing info', 'Please enter your phone number.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Weak password', 'Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      await signUpBusiness({
        email: email.trim(),
        password,
        name: fullName.trim(),
        phone: phone.trim(),
        businessName: businessName.trim(),
        businessType,
        country,
      });
      router.replace('/(business)');
    } catch (e: any) {
      Alert.alert('Registration failed', e.message ?? 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="arrow-back" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: Spacing.md }}>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>Create business account</Text>
            <Text style={[styles.headerSubtitle, { color: colors.mutedForeground }]}>Get paid in USDC across Africa</Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.logoWrap}>
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={[colors.gradientStart, colors.gradientEnd]}
                style={styles.logoCircle}
              >
                <Text style={styles.logoText}>P</Text>
              </LinearGradient>
              <View style={[styles.bizBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.bizBadgeText}>Biz</Text>
              </View>
            </View>
          </View>

          {/* Business details section */}
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>BUSINESS DETAILS</Text>

          <Input
            label="Business name"
            value={businessName}
            onChangeText={setBusinessName}
            placeholder="Acme Ltd"
            autoCapitalize="words"
            leftIcon={<Ionicons name="business-outline" size={18} color={colors.mutedForeground} />}
          />

          <View style={{ height: Spacing.lg }} />

          <Text style={[styles.chipLabel, { color: colors.foreground }]}>Business type</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            {BUSINESS_TYPES.map((type) => {
              const active = businessType === type;
              return (
                <TouchableOpacity
                  key={type}
                  onPress={() => setBusinessType(type)}
                  style={[
                    styles.chip,
                    {
                      borderColor: active ? colors.primary : colors.border,
                      backgroundColor: active ? colors.primary : colors.card,
                    },
                  ]}
                >
                  <Text style={[styles.chipText, { color: active ? '#08101D' : colors.foreground }]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={{ height: Spacing.lg }} />

          <Text style={[styles.chipLabel, { color: colors.foreground }]}>Country</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            {COUNTRIES.map((c) => {
              const active = country === c;
              return (
                <TouchableOpacity
                  key={c}
                  onPress={() => setCountry(c)}
                  style={[
                    styles.chip,
                    {
                      borderColor: active ? colors.primary : colors.border,
                      backgroundColor: active ? colors.primary : colors.card,
                    },
                  ]}
                >
                  <Text style={[styles.chipText, { color: active ? '#08101D' : colors.foreground }]}>
                    {c}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Owner details section */}
          <View style={{ height: Spacing.xl }} />
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>OWNER DETAILS</Text>

          <View style={styles.form}>
            <Input
              label="Full name"
              value={fullName}
              onChangeText={setFullName}
              placeholder="Jane Mwangi"
              autoCapitalize="words"
              leftIcon={<Ionicons name="person-outline" size={18} color={colors.mutedForeground} />}
            />
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="jane@acme.co.ke"
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              leftIcon={<Ionicons name="mail-outline" size={18} color={colors.mutedForeground} />}
            />
            <Input
              label="Phone"
              value={phone}
              onChangeText={setPhone}
              placeholder="+254712345678"
              keyboardType="phone-pad"
              leftIcon={<Ionicons name="call-outline" size={18} color={colors.mutedForeground} />}
            />
            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Min. 8 characters"
              secureTextEntry
              autoComplete="new-password"
              leftIcon={<Ionicons name="lock-closed-outline" size={18} color={colors.mutedForeground} />}
            />

            <Button title="Create business account" onPress={handleRegister} loading={loading} fullWidth />
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.mutedForeground }]}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={[styles.footerLink, { color: colors.primary }]}>Sign in</Text>
            </TouchableOpacity>
          </View>
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
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  headerSubtitle: {
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  scroll: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logoContainer: {
    position: 'relative',
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: Radius.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: 'white',
    fontSize: 36,
    fontWeight: FontWeight.bold,
  },
  bizBadge: {
    position: 'absolute',
    bottom: -4,
    right: -8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  bizBadgeText: {
    color: '#08101D',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  sectionLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    letterSpacing: 0.8,
    marginBottom: Spacing.md,
  },
  chipLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    marginBottom: Spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingRight: Spacing.lg,
  },
  chip: {
    height: 38,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  form: {
    gap: Spacing.lg,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.xl,
  },
  footerText: {
    fontSize: FontSize.base,
  },
  footerLink: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
  },
});
