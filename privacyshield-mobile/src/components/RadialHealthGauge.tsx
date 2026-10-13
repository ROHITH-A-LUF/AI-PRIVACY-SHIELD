import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Colors } from '../constants/theme';

interface RadialHealthGaugeProps {
  score: number;
  size?: number;
  strokeWidth?: number;
}

export const RadialHealthGauge: React.FC<RadialHealthGaugeProps> = ({
  score,
  size = 130,
  strokeWidth = 10,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.max(0, Math.min(100, score));
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  let strokeColor = Colors.emeraldSafe;
  let glowColor = Colors.emeraldGlow;

  if (clampedScore < 50) {
    strokeColor = Colors.crimsonCritical;
    glowColor = Colors.crimsonGlow;
  } else if (clampedScore < 80) {
    strokeColor = Colors.amberWarning;
    glowColor = Colors.amberGlow;
  }

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Background ambient glow circle */}
      <View
        style={[
          styles.glowCircle,
          {
            width: size * 0.85,
            height: size * 0.85,
            backgroundColor: glowColor,
            borderRadius: (size * 0.85) / 2,
          },
        ]}
      />

      <Svg width={size} height={size} style={styles.svg}>
        {/* Track circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>

      <View style={styles.textContainer}>
        <Text style={[styles.scoreValue, { color: strokeColor }]}>
          {clampedScore}
        </Text>
        <Text style={styles.scoreMax}>/100</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glowCircle: {
    position: 'absolute',
    opacity: 0.6,
  },
  svg: {
    transform: [{ rotate: '0deg' }],
  },
  textContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreValue: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  scoreMax: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginTop: -3,
  },
});
