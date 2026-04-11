import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { Colors, Radius, Spacing, Shadow } from '@/constants/theme';

type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: keyof typeof Spacing | number;
};

export function Card({ children, style, padding = 'lg' }: Props) {
  const pad = typeof padding === 'number' ? padding : Spacing[padding];
  return <View style={[styles.card, { padding: pad }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.card,
  },
});
