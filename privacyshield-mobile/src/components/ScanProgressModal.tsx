import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { BorderRadius, Colors, Spacing } from '../constants/theme';

interface ScanProgressModalProps {
  visible: boolean;
  stepText: string;
  progress: number;
}

export const ScanProgressModal: React.FC<ScanProgressModalProps> = ({
  visible,
  stepText,
  progress,
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [visible, pulseAnim]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <View style={styles.iconContainer}>
            <ActivityIndicator
              size={80}
              color={Colors.cyanAccent}
              style={styles.spinner}
            />
            <Animated.Text
              style={[
                styles.shieldIcon,
                { transform: [{ scale: pulseAnim }] },
              ]}
            >
              🛡️
            </Animated.Text>
          </View>

          <Text style={styles.title}>Auditing App Permissions</Text>
          <Text style={styles.subtitle}>
            Context-Based Permission Risk Assessment
          </Text>

          <View style={styles.stepBox}>
            <Text style={styles.stepText}>{stepText || 'Initializing...'}</Text>
          </View>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressBar,
                { width: `${Math.min(100, Math.max(0, progress))}%` },
              ]}
            />
          </View>

          <Text style={styles.progressPercent}>{Math.round(progress)}%</Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 14, 23, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: Colors.surfaceDark,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.surfaceGlassBorder,
    padding: Spacing.xxl,
    alignItems: 'center',
    shadowColor: Colors.cyanAccent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  iconContainer: {
    width: 90,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    position: 'relative',
  },
  spinner: {
    position: 'absolute',
  },
  shieldIcon: {
    fontSize: 34,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  stepBox: {
    width: '100%',
    backgroundColor: 'rgba(0, 240, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.2)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    minHeight: 52,
    justifyContent: 'center',
  },
  stepText: {
    fontSize: 12,
    color: Colors.cyanAccent,
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 16,
  },
  progressTrack: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.cyanAccent,
    borderRadius: BorderRadius.full,
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
});
