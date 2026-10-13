import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BorderRadius, Colors, Spacing } from '../constants/theme';

interface StatBoxProps {
  value: number | string;
  label: string;
  variant?: 'cyan' | 'red' | 'orange' | 'crimson' | 'emerald';
  icon?: string;
}

export const StatBox: React.FC<StatBoxProps> = ({
  value,
  label,
  variant = 'cyan',
  icon,
}) => {
  let valueColor = Colors.cyanAccent;
  if (variant === 'red') valueColor = '#F87171';
  if (variant === 'orange') valueColor = Colors.orangeHigh;
  if (variant === 'crimson') valueColor = Colors.crimsonCritical;
  if (variant === 'emerald') valueColor = Colors.emeraldSafe;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={[styles.value, { color: valueColor }]}>{value}</Text>
        {icon && <Text style={styles.icon}>{icon}</Text>}
      </View>
      <Text style={styles.label} numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.glassFill,
    borderWidth: 1,
    borderColor: Colors.surfaceGlassBorder,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    minHeight: 82,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  value: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  icon: {
    fontSize: 16,
  },
  label: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
    lineHeight: 14,
  },
});
