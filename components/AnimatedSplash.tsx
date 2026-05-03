import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, Easing } from 'react-native';

type Props = { onFinish: () => void };

const { width, height } = Dimensions.get('window');

export function AnimatedSplash({ onFinish }: Props) {
  const scale = useRef(new Animated.Value(0.1)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const containerOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      // Wordmark zoom in
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.15,
          duration: 700,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1.0,
          duration: 200,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      // Wordmark fade in
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      // Glow pulse (delayed)
      Animated.sequence([
        Animated.delay(700),
        Animated.timing(glowOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity, {
          toValue: 0.6,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Fade out and finish
    Animated.sequence([
      Animated.delay(1700),
      Animated.timing(containerOpacity, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => onFinish());
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: containerOpacity }]}>
      <Animated.View style={[styles.glow, { opacity: glowOpacity }]} />
      <Animated.View style={[styles.logoWrap, { transform: [{ scale }], opacity }]}>
        <Text style={styles.wordmark}>PesaFi</Text>
        <View style={styles.underline} />
        <Text style={styles.tagline}>USDC wallet for Africa</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    width,
    height,
    backgroundColor: '#06090F',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  glow: {
    position: 'absolute',
    width: 420,
    height: 420,
    borderRadius: 210,
    backgroundColor: '#22C55E',
    opacity: 0.25,
    shadowColor: '#22C55E',
    shadowOpacity: 0.6,
    shadowRadius: 120,
    shadowOffset: { width: 0, height: 0 },
  },
  logoWrap: {
    alignItems: 'center',
  },
  wordmark: {
    fontSize: 64,
    fontWeight: '800',
    color: '#22C55E',
    letterSpacing: -2,
  },
  underline: {
    marginTop: 8,
    height: 3,
    width: 60,
    borderRadius: 2,
    backgroundColor: '#F97316',
  },
  tagline: {
    marginTop: 16,
    fontSize: 14,
    color: '#64748B',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
