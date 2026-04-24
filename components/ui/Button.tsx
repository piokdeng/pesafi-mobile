import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle, TextStyle, View } from 'react-native';
import { useTheme } from '@/lib/theme';
import { Radius, FontSize, FontWeight, Spacing } from '@/constants/theme';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
type Size = 'sm' | 'md' | 'lg';

type Props = {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  style?: ViewStyle;
};

export function Button({ title, onPress, variant = 'primary', size = 'md', loading, disabled, icon, fullWidth, style }: Props) {
  const { colors, isDark } = useTheme();
  const isDisabled = disabled || loading;

  const bgColors: Record<Variant, string> = {
    primary: colors.primary,
    secondary: colors.muted,
    outline: 'transparent',
    ghost: 'transparent',
    destructive: colors.destructive,
  };

  const textColors: Record<Variant, string> = {
    primary: isDark ? '#08101D' : '#FFFFFF',
    secondary: colors.foreground,
    outline: colors.foreground,
    ghost: colors.foreground,
    destructive: '#FFFFFF',
  };

  const sizeStyles: Record<Size, { py: number; px: number; fs: number }> = {
    sm: { py: 8, px: 14, fs: FontSize.sm },
    md: { py: 14, px: 18, fs: FontSize.base },
    lg: { py: 18, px: 22, fs: FontSize.lg },
  };

  const s = sizeStyles[size];
  const textColor = textColors[variant];

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.base,
        {
          backgroundColor: bgColors[variant],
          paddingVertical: s.py,
          paddingHorizontal: s.px,
          borderWidth: variant === 'outline' ? 1 : 0,
          borderColor: colors.border,
        },
        fullWidth && { alignSelf: 'stretch' },
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <View style={styles.content}>
          {icon}
          <Text style={[styles.text, { color: textColor, fontSize: s.fs }]}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  content: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  text: { fontWeight: FontWeight.semibold },
  disabled: { opacity: 0.5 },
});
