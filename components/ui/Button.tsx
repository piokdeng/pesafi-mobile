import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { Colors, Radius, FontSize, FontWeight, Spacing } from '@/constants/theme';

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

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  icon,
  fullWidth,
  style,
}: Props) {
  const isDisabled = disabled || loading;
  const variantStyle = variantStyles[variant];
  const sizeStyle = sizeStyles[size];
  const textColor = variantTextColors[variant];

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.base,
        sizeStyle.button,
        variantStyle,
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
          <Text style={[styles.text, sizeStyle.text, { color: textColor }]}>
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  text: {
    fontWeight: FontWeight.semibold,
  },
  disabled: {
    opacity: 0.5,
  },
});

const variantStyles: Record<Variant, ViewStyle> = {
  primary:    { backgroundColor: Colors.primary },
  secondary:  { backgroundColor: Colors.muted },
  outline:    { backgroundColor: 'transparent', borderWidth: 1, borderColor: Colors.border },
  ghost:      { backgroundColor: 'transparent' },
  destructive:{ backgroundColor: Colors.destructive },
};

const variantTextColors: Record<Variant, string> = {
  primary: '#08101D',         // dark text on bright green for contrast
  secondary: Colors.foreground,
  outline: Colors.foreground,
  ghost: Colors.foreground,
  destructive: Colors.white,
};

const sizeStyles: Record<Size, { button: ViewStyle; text: TextStyle }> = {
  sm: { button: { paddingVertical: 8,  paddingHorizontal: 14 }, text: { fontSize: FontSize.sm } },
  md: { button: { paddingVertical: 14, paddingHorizontal: 18 }, text: { fontSize: FontSize.base } },
  lg: { button: { paddingVertical: 18, paddingHorizontal: 22 }, text: { fontSize: FontSize.lg } },
};
