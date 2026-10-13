import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ThreatVector } from '../models/types';
import { BorderRadius, Colors, Spacing } from '../constants/theme';

interface ThreatVectorCardProps {
  threat: ThreatVector;
}

export const ThreatVectorCard: React.FC<ThreatVectorCardProps> = ({ threat }) => {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.warningIcon}>⚠️</Text>
        <Text style={styles.title}>{threat.title}</Text>
      </View>
      <Text style={styles.desc}>{threat.desc}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderLeftWidth: 4,
    borderLeftColor: Colors.crimsonCritical,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  warningIcon: {
    fontSize: 16,
    marginRight: Spacing.xs + 2,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FCA5A5',
    flex: 1,
  },
  desc: {
    fontSize: 12,
    color: '#E2E8F0',
    lineHeight: 17,
  },
});
