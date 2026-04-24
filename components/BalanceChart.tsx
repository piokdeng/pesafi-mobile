import React, { useState, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, PanResponder } from 'react-native';
import Svg, {
  Polyline, Circle, Line, Defs, LinearGradient, Stop, Path
} from 'react-native-svg';
import { formatUsd } from '@/lib/currency';

type Point = { x: number; y: number; value: number; date: Date };

type Props = {
  /** Balance history points; expects oldest → newest */
  history?: { value: number; date: Date }[];
  width?: number;
  height?: number;
  strokeColor?: string;
  onScrub?: (value: number | null) => void;
};

const DEFAULT_WIDTH = Dimensions.get('window').width - 64;

/**
 * Coinbase-style interactive line chart.
 *  - Line with subtle gradient fill beneath
 *  - Every N points gets a small "star" dot for texture
 *  - Press & drag to scrub: vertical line + active dot + balance label
 *  - Haptic-free (to stay lightweight in Expo Go)
 */
export function BalanceChart({
  history,
  width = DEFAULT_WIDTH,
  height = 90,
  strokeColor = '#FFFFFF',
  onScrub,
}: Props) {
  const padX = 6;
  const padY = 12;

  // If no history given, generate a demo series. Once users have real data,
  // the home screen will pass the last 30 days from transactions.
  const data = useMemo(() => {
    if (history && history.length > 1) return history;
    // Demo fallback: 24 points rising gently
    const arr: { value: number; date: Date }[] = [];
    const now = Date.now();
    for (let i = 23; i >= 0; i--) {
      const t = new Date(now - i * 3600_000);
      const base = 5 + (23 - i) * 0.3;
      const wobble = Math.sin(i * 1.7) * 0.4 + Math.cos(i * 0.9) * 0.25;
      arr.push({ value: Math.max(0, base + wobble), date: t });
    }
    return arr;
  }, [history]);

  const { points, pathD, minV, maxV } = useMemo(() => {
    const values = data.map(d => d.value);
    const minV = Math.min(...values) * 0.95;
    const maxV = Math.max(...values) * 1.05 || 1;
    const range = maxV - minV || 1;
    const usableW = width - padX * 2;
    const usableH = height - padY * 2;

    const pts: Point[] = data.map((d, i) => {
      const x = padX + (i / (data.length - 1)) * usableW;
      const y = padY + (1 - (d.value - minV) / range) * usableH;
      return { x, y, value: d.value, date: d.date };
    });
    const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ');
    return { points: pts, pathD, minV, maxV };
  }, [data, width, height]);

  // Fill area path (closes back down to the baseline)
  const fillPath = useMemo(() => {
    if (!points.length) return '';
    const first = points[0];
    const last = points[points.length - 1];
    return `${pathD} L ${last.x} ${height - padY} L ${first.x} ${height - padY} Z`;
  }, [pathD, points, height]);

  // Star dots: pick every 4th point for a subtle "starry" texture
  const starPoints = useMemo(() => {
    return points.filter((_, i) => i % 4 === 0 && i !== points.length - 1);
  }, [points]);

  // Scrub state
  const [scrubIdx, setScrubIdx] = useState<number | null>(null);
  const scrubPoint = scrubIdx != null ? points[scrubIdx] : null;

  const findNearestIdx = (touchX: number): number => {
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < points.length; i++) {
      const dx = Math.abs(points[i].x - touchX);
      if (dx < bestDist) { bestDist = dx; best = i; }
    }
    return best;
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const x = evt.nativeEvent.locationX;
        const idx = findNearestIdx(x);
        setScrubIdx(idx);
        onScrub?.(points[idx].value);
      },
      onPanResponderMove: (evt) => {
        const x = evt.nativeEvent.locationX;
        const idx = findNearestIdx(x);
        setScrubIdx(idx);
        onScrub?.(points[idx].value);
      },
      onPanResponderRelease: () => {
        setScrubIdx(null);
        onScrub?.(null);
      },
      onPanResponderTerminate: () => {
        setScrubIdx(null);
        onScrub?.(null);
      },
    })
  ).current;

  return (
    <View style={{ width, height }} {...panResponder.panHandlers}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="bchartfill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={strokeColor} stopOpacity="0.28" />
            <Stop offset="1" stopColor={strokeColor} stopOpacity="0" />
          </LinearGradient>
        </Defs>

        {/* Fill area */}
        <Path d={fillPath} fill="url(#bchartfill)" />

        {/* Main line */}
        <Path
          d={pathD}
          fill="none"
          stroke={strokeColor}
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Starry dots */}
        {starPoints.map((p, i) => (
          <Circle
            key={`star-${i}`}
            cx={p.x}
            cy={p.y}
            r={1.4}
            fill={strokeColor}
            opacity={0.55}
          />
        ))}

        {/* End point indicator (bigger dot) */}
        {points.length > 0 && (
          <>
            <Circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r={5} fill={strokeColor} opacity={0.3} />
            <Circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r={2.5} fill={strokeColor} />
          </>
        )}

        {/* Scrubber */}
        {scrubPoint && (
          <>
            <Line
              x1={scrubPoint.x}
              y1={padY}
              x2={scrubPoint.x}
              y2={height - padY}
              stroke={strokeColor}
              strokeWidth={1}
              strokeDasharray="3,3"
              opacity={0.6}
            />
            <Circle cx={scrubPoint.x} cy={scrubPoint.y} r={6} fill={strokeColor} opacity={0.25} />
            <Circle cx={scrubPoint.x} cy={scrubPoint.y} r={3.2} fill={strokeColor} />
          </>
        )}
      </Svg>

      {/* Scrub tooltip */}
      {scrubPoint && (
        <View
          style={[
            styles.tooltip,
            {
              // keep within bounds
              left: Math.max(4, Math.min(scrubPoint.x - 55, width - 110)),
            },
          ]}
        >
          <Text style={styles.tooltipValue}>{formatUsd(scrubPoint.value)}</Text>
          <Text style={styles.tooltipDate}>
            {scrubPoint.date.toLocaleDateString([], { month: 'short', day: 'numeric' })}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tooltip: {
    position: 'absolute',
    top: -6,
    width: 110,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  tooltipValue: {
    color: 'white',
    fontWeight: '700',
    fontSize: 12,
  },
  tooltipDate: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    marginTop: 1,
  },
});
