import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

type Props = { onFinish: () => void };

const { width, height } = Dimensions.get('window');

/**
 * PesaFi splash — the wordmark starts at 0.1x scale in the dark void,
 * spring-zooms to 1x, glows for a beat, then fades out to the app.
 * Timing tuned to feel premium without keeping users waiting.
 */
export function AnimatedSplash({ onFinish }: Props) {
  const scale = useSharedValue(0.1);
  const opacity = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  const containerOpacity = useSharedValue(1);

  useEffect(() => {
    // Wordmark: zoom + fade in
    scale.value = withSequence(
      withTiming(1.15, { duration: 700, easing: Easing.out(Easing.cubic) }),
      withTiming(1.0, { duration: 200, easing: Easing.inOut(Easing.cubic) })
    );
    opacity.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) });

    // Glow pulses in once the logo lands
    glowOpacity.value = withDelay(
      700,
      withSequence(
        withTiming(1, { duration: 400 }),
        withTiming(0.6, { duration: 500 })
      )
    );

    // Fade out the whole splash and hand off to the app
    containerOpacity.value = withDelay(
      1700,
      withTiming(0, { duration: 400, easing: Easing.out(Easing.ease) }, (finished) => {
        if (finished) runOnJS(onFinish)();
      })
    );
  }, []);

  const containerStyle = useAnimatedStyle(() => ({ opacity: containerOpacity.value }));
  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: glowOpacity.value }));

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      {/* Radial glow behind the logo */}
      <Animated.View style={[styles.glow, glowStyle]} />
      <Animated.View style={[styles.logoWrap, logoStyle]}>
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
    // soft blur using shadow
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
