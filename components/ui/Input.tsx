import React from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { Colors, Radius, FontSize, FontWeight, Spacing } from '@/constants/theme';

type Props = TextInputProps & {
  label?: string;
  helperText?: string;
  error?: string;
  containerStyle?: ViewStyle;
  leftIcon?: React.ReactNode;
  rightAdornment?: React.ReactNode;
};

export function Input({
  label,
  helperText,
  error,
  containerStyle,
  leftIcon,
  rightAdornment,
  style,
  ...rest
}: Props) {
  return (
    <View style={[{ gap: Spacing.xs }, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputWrap, error && { borderColor: Colors.destructive }]}>
        {leftIcon && <View style={{ marginRight: Spacing.sm }}>{leftIcon}</View>}
        <TextInput
          placeholderTextColor={Colors.mutedForeground}
          style={[styles.input, style]}
          {...rest}
        />
        {rightAdornment}
      </View>
      {(helperText || error) && (
        <Text style={[styles.helper, error && { color: Colors.destructive }]}>
          {error || helperText}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.foreground,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.muted,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    minHeight: 48,
  },
  input: {
    flex: 1,
    fontSize: FontSize.base,
    color: Colors.foreground,
    paddingVertical: Spacing.md,
  },
  helper: {
    fontSize: FontSize.xs,
    color: Colors.mutedForeground,
  },
});
