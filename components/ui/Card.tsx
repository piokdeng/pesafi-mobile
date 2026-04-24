import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { useTheme } from '@/lib/theme';
import { Radius, Spacing, Shadow } from '@/constants/theme';

type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: keyof typeof Spacing | number;
};

export function Card({ children, style, padding = 'lg' }: Props) {
  const { colors } = useTheme();
  const pad = typeof padding === 'number' ? padding : Spacing[padding];
  return (
    <View style={[
      styles.card,
      { padding: pad, backgroundColor: colors.card, borderColor: colors.border },
      style,
    ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    ...Shadow.card,
  },
});
