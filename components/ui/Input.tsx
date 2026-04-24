import React from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import { useTheme } from '@/lib/theme';
import { Radius, FontSize, FontWeight, Spacing } from '@/constants/theme';

type Props = TextInputProps & {
  label?: string;
  helperText?: string;
  error?: string;
  containerStyle?: ViewStyle;
  leftIcon?: React.ReactNode;
  rightAdornment?: React.ReactNode;
};

export function Input({ label, helperText, error, containerStyle, leftIcon, rightAdornment, style, ...rest }: Props) {
  const { colors } = useTheme();

  return (
    <View style={[{ gap: Spacing.xs }, containerStyle]}>
      {label && <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>}
      <View style={[styles.inputWrap, { backgroundColor: colors.muted, borderColor: error ? colors.destructive : colors.border }]}>
        {leftIcon && <View style={{ marginRight: Spacing.sm }}>{leftIcon}</View>}
        <TextInput
          placeholderTextColor={colors.mutedForeground}
          style={[styles.input, { color: colors.foreground }, style]}
          {...rest}
        />
        {rightAdornment}
      </View>
      {(helperText || error) && (
        <Text style={[styles.helper, { color: error ? colors.destructive : colors.mutedForeground }]}>
          {error || helperText}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, minHeight: 48,
  },
  input: { flex: 1, fontSize: FontSize.base, paddingVertical: Spacing.md },
  helper: { fontSize: FontSize.xs },
});
