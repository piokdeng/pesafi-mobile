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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';
import { Spacing, FontSize, FontWeight } from '@/constants/theme';

export default function RegisterScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !phone || !password) {
      Alert.alert('Missing info', 'Please fill in all fields.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Weak password', 'Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      await signUp({ name, email, phone, password });
      router.replace('/(tabs)');
    } catch (e: any) {
      Alert.alert('Sign up failed', e.message ?? 'Please try again.');
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
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => router.back()} style={styles.back}>
            <Ionicons name="arrow-back" size={24} color={colors.foreground} />
          </TouchableOpacity>

          <View style={styles.headerWrap}>
            <Text style={[styles.title, { color: colors.foreground }]}>Create your account</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Get a free PesaFi wallet in 30 seconds. No card or seed phrase needed.
            </Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Full name"
              value={name}
              onChangeText={setName}
              placeholder="Deng Ajak"
              autoCapitalize="words"
              leftIcon={<Ionicons name="person-outline" size={18} color={colors.mutedForeground} />}
            />
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
              leftIcon={<Ionicons name="mail-outline" size={18} color={colors.mutedForeground} />}
            />
            <Input
              label="Phone number"
              value={phone}
              onChangeText={setPhone}
              placeholder="+254 712 345 678"
              keyboardType="phone-pad"
              helperText="Include country code so we can route mobile money."
              leftIcon={<Ionicons name="call-outline" size={18} color={colors.mutedForeground} />}
            />
            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="At least 8 characters"
              secureTextEntry
              leftIcon={<Ionicons name="lock-closed-outline" size={18} color={colors.mutedForeground} />}
            />

            <Button title="Create account" onPress={handleRegister} loading={loading} fullWidth />

            <Text style={[styles.terms, { color: colors.mutedForeground }]}>
              By signing up you agree to PesaFi's Terms of Service and Privacy Policy.
            </Text>
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.mutedForeground }]}>Already have an account? </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text style={[styles.footerLink, { color: colors.primary }]}>Sign in</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flexGrow: 1, padding: Spacing.xl },
  back: { marginBottom: Spacing.lg },
  headerWrap: { marginBottom: Spacing.xl },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold },
  subtitle: { fontSize: FontSize.base, marginTop: 6, lineHeight: 22 },
  form: { gap: Spacing.lg },
  terms: {
    fontSize: FontSize.xs,
    textAlign: 'center',
    marginTop: Spacing.xs,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.xxl,
  },
  footerText: { fontSize: FontSize.base },
  footerLink: { fontSize: FontSize.base, fontWeight: FontWeight.semibold },
});
