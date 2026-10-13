import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { AppItem } from '../models/types';
import { BorderRadius, Colors, Spacing } from '../constants/theme';

interface AppCardProps {
  app: AppItem;
  onPress: (app: AppItem) => void;
  highlighted?: boolean;
}

export const AppCard: React.FC<AppCardProps> = ({
  app,
  onPress,
  highlighted = false,
}) => {
  const audit = app.auditResult;

  const handlePress = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    onPress(app);
  };

  let badgeBg = 'rgba(16, 185, 129, 0.15)';
  let badgeBorder = Colors.emeraldSafe;
  let badgeText = Colors.emeraldSafe;

  if (audit?.riskLevel === 'CRITICAL') {
    badgeBg = 'rgba(239, 68, 68, 0.18)';
    badgeBorder = Colors.crimsonCritical;
    badgeText = '#FCA5A5';
  } else if (audit?.riskLevel === 'HIGH') {
    badgeBg = 'rgba(249, 115, 22, 0.18)';
    badgeBorder = Colors.orangeHigh;
    badgeText = '#FDBA74';
  } else if (audit?.riskLevel === 'MEDIUM') {
    badgeBg = 'rgba(245, 158, 11, 0.18)';
    badgeBorder = Colors.amberWarning;
    badgeText = '#FCD34D';
  }

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={[
        styles.card,
        highlighted && styles.cardHighlighted,
      ]}
      onPress={handlePress}
    >
      <View style={styles.leftContainer}>
        <View style={styles.iconBox}>
          <Text style={styles.iconText}>{app.icon}</Text>
        </View>
        <View style={styles.metaContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {app.name}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {app.categoryDisplay} • {app.permissions.length} perms
          </Text>
        </View>
      </View>

      <View style={styles.rightContainer}>
        {audit && (
          <View
            style={[
              styles.badge,
              { backgroundColor: badgeBg, borderColor: badgeBorder },
            ]}
          >
            <Text style={[styles.badgeLabel, { color: badgeText }]}>
              {audit.riskLevel} ({audit.finalScore}/100)
            </Text>
          </View>
        )}
        <Text style={styles.chevron}>➔</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.glassFill,
    borderWidth: 1,
    borderColor: Colors.surfaceGlassBorder,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  cardHighlighted: {
    borderColor: Colors.cyanAccent,
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.sm,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceDark,
    borderWidth: 1,
    borderColor: Colors.surfaceGlassBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  iconText: {
    fontSize: 22,
  },
  metaContainer: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    borderWidth: 1,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 3,
    marginRight: Spacing.xs + 2,
  },
  badgeLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  chevron: {
    fontSize: 14,
    color: Colors.textMuted,
    marginLeft: 2,
  },
});
