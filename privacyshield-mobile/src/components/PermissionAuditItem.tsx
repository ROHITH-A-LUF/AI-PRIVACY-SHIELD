import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PermissionDef } from '../models/types';
import { BorderRadius, Colors, Spacing } from '../constants/theme';

interface PermissionAuditItemProps {
  permission: PermissionDef;
  isExpected: boolean;
}

export const PermissionAuditItem: React.FC<PermissionAuditItemProps> = ({
  permission,
  isExpected,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.permName}>{permission.name}</Text>
          <View style={styles.weightBadge}>
            <Text style={styles.weightText}>{permission.weight} pts</Text>
          </View>
        </View>

        <View
          style={[
            styles.tag,
            isExpected ? styles.tagExpected : styles.tagMismatch,
          ]}
        >
          <Text
            style={[
              styles.tagText,
              isExpected ? styles.tagTextExpected : styles.tagTextMismatch,
            ]}
          >
            {isExpected ? 'EXPECTED' : 'CONTEXT MISMATCH'}
          </Text>
        </View>
      </View>

      <Text style={styles.desc}>
        <Text style={styles.groupText}>{permission.group}</Text> • {permission.desc}
      </Text>

      <Text style={styles.riskDesc}>
        <Text style={{ fontWeight: '700' }}>Threat:</Text> {permission.riskDesc}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  permName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginRight: Spacing.xs + 2,
  },
  weightBadge: {
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  weightText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.cyanAccent,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  tagExpected: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: Colors.emeraldSafe,
  },
  tagMismatch: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: Colors.crimsonCritical,
  },
  tagText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  tagTextExpected: {
    color: Colors.emeraldSafe,
  },
  tagTextMismatch: {
    color: '#FCA5A5',
  },
  desc: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
    lineHeight: 16,
  },
  groupText: {
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  riskDesc: {
    fontSize: 11,
    color: '#F87171',
    lineHeight: 15,
  },
});
