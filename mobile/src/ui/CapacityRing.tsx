import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { colors, type } from '../theme/tokens';

type Props = {
  percent: number;
  label?: string;
  size?: number;
  stroke?: number;
};

/**
 * Conic-style capacity gauge matching docs/stitch-ref/event-hub.html
 * (`.progress-ring` with 162deg fill, 45% label, "CAPACITY" caption).
 */
export function CapacityRing({ percent, label = 'Capacity', size = 220, stroke = 24 }: Props) {
  const clamped = Math.max(0, Math.min(100, percent));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - clamped / 100);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.slate100}
          strokeWidth={stroke}
          fill="transparent"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.primary}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          fill="transparent"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.centerLabel}>
        <Text style={styles.percent}>{clamped}%</Text>
        <Text style={styles.capCaption}>{label.toUpperCase()}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centerLabel: { position: 'absolute', alignItems: 'center' },
  percent: {
    fontSize: 44,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -1,
  },
  capCaption: {
    marginTop: 2,
    fontSize: type.labelXs,
    fontWeight: '700',
    color: colors.slate500,
    letterSpacing: 2,
  },
});
