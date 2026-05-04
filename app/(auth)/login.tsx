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
import { Link, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';
import { Spacing, FontSize, FontWeight, Radius } from '@/constants/theme';
import { useResponsive, MAX_CONTENT_WIDTH } from '@/lib/responsive';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const { colors } = useTheme();
  const { isDesktop } = useResponsive();
  const [accountType, setAccountType] = useState<'personal' | 'business'>('personal');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing info', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      await signIn(email, password);
      // Routing handled by RootNavigator based on user.account_type
    } catch (e: any) {
      Alert.alert('Sign in failed', e.message ?? 'Please try again.');
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
        <ScrollView
          contentContainerStyle={[styles.scroll, isDesktop && styles.scrollDesktop]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={isDesktop ? [styles.card, { backgroundColor: colors.card, borderColor: colors.border }] : undefined}>
            {/* Logo / hero */}
            <View style={styles.heroWrap}>
              <LinearGradient
                colors={[colors.gradientStart, colors.gradientEnd]}
                style={styles.logoCircle}
              >
                <Text style={styles.logoText}>P</Text>
              </LinearGradient>
              <Text style={[styles.title, { color: colors.foreground }]}>Welcome back</Text>
              <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Sign in to your PesaFi wallet</Text>
            </View>

            {/* Account type toggle */}
            <View style={styles.toggleWrap}>
              <Text style={[styles.toggleLabel, { color: colors.foreground }]}>Account type</Text>
              <View style={[styles.toggleRow, { backgroundColor: colors.muted, borderRadius: Radius.md }]}>
                {(['personal', 'business'] as const).map((type) => {
                  const active = accountType === type;
                  return (
                    <TouchableOpacity
                      key={type}
                      onPress={() => setAccountType(type)}
                      style={[
                        styles.toggleBtn,
                        {
                          backgroundColor: active ? colors.primary : 'transparent',
                          borderRadius: Radius.md,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.toggleText,
                          { color: active ? '#08101D' : colors.mutedForeground },
                        ]}
                      >
                        {type === 'personal' ? 'Personal' : 'Business'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Form */}
            <View style={styles.form}>
              <Input
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                leftIcon={<Ionicons name="mail-outline" size={18} color={colors.mutedForeground} />}
              />
              <Input
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry
                autoComplete="password"
                leftIcon={<Ionicons name="lock-closed-outline" size={18} color={colors.mutedForeground} />}
              />

              <TouchableOpacity style={{ alignSelf: 'flex-end' }}>
                <Text style={[styles.forgot, { color: colors.primary }]}>Forgot password?</Text>
              </TouchableOpacity>

              <Button title="Sign in" onPress={handleLogin} loading={loading} fullWidth />
            </View>

            {/* Footer */}
            {accountType === 'personal' && (
              <View style={styles.footer}>
                <Text style={[styles.footerText, { color: colors.mutedForeground }]}>Don't have an account? </Text>
                <Link href="/(auth)/register" asChild>
                  <TouchableOpacity>
                    <Text style={[styles.footerLink, { color: colors.primary }]}>Sign up</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            )}

            {accountType === 'business' && (
              <View style={styles.footer}>
                <Text style={[styles.footerText, { color: colors.mutedForeground }]}>New business? </Text>
                <Link href="/(auth)/register-business" asChild>
                  <TouchableOpacity>
                    <Text style={[styles.footerLink, { color: colors.primary }]}>Register →</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: {
    flexGrow: 1,
    padding: Spacing.xl,
    justifyContent: 'center',
  },
  scrollDesktop: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  card: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    borderRadius: 20,
    padding: Spacing.xxl,
    borderWidth: 1,
  },
  heroWrap: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: Radius.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  logoText: {
    color: 'white',
    fontSize: 40,
    fontWeight: FontWeight.bold,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
  },
  subtitle: {
    fontSize: FontSize.base,
    marginTop: 4,
  },
  toggleWrap: {
    marginBottom: Spacing.xl,
  },
  toggleLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    marginBottom: Spacing.xs,
  },
  toggleRow: {
    flexDirection: 'row',
    padding: 4,
  },
  toggleBtn: {
    flex: 1,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  form: {
    gap: Spacing.lg,
  },
  forgot: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.xxl,
  },
  footerText: {
    fontSize: FontSize.base,
  },
  footerLink: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
  },
});
