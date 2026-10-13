import React from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { AppItem } from '../models/types';
import { BorderRadius, Colors, Spacing } from '../constants/theme';
import { RadialHealthGauge } from './RadialHealthGauge';
import { ThreatVectorCard } from './ThreatVectorCard';
import { PermissionAuditItem } from './PermissionAuditItem';
import { CATEGORY_EXPECTED_PERMS, KNOWN_PERMISSIONS } from '../constants/permissions';

interface AppDetailModalProps {
  app: AppItem | null;
  visible: boolean;
  onClose: () => void;
  onProbeSensor: (sensor: 'camera' | 'mic') => void;
  onToggleCamera: (allow: boolean) => void;
  onToggleMic: (allow: boolean) => void;
}

export const AppDetailModal: React.FC<AppDetailModalProps> = ({
  app,
  visible,
  onClose,
  onProbeSensor,
  onToggleCamera,
  onToggleMic,
}) => {
  if (!app) return null;

  const audit = app.auditResult;
  const hasCam = app.permissions.includes('CAMERA');
  const hasMic = app.permissions.includes('RECORD_AUDIO');
  const hasLoc = app.permissions.includes('ACCESS_FINE_LOCATION') || app.permissions.includes('ACCESS_BACKGROUND_LOCATION');
  const hasContacts = app.permissions.includes('READ_CONTACTS');
  const hasSms = app.permissions.includes('READ_SMS') || app.permissions.includes('RECEIVE_SMS');
  const hasStorage = app.permissions.includes('READ_EXTERNAL_STORAGE');
  const hasNet = app.permissions.includes('INTERNET');

  const expectedList = CATEGORY_EXPECTED_PERMS[app.category] || ['INTERNET', 'VIBRATE'];

  const sensors = [
    {
      id: 'camera',
      name: 'Camera',
      icon: '📷',
      requested: hasCam,
      status: hasCam ? 'GRANTED' : 'NOT REQUESTED',
      canProbe: true,
      onProbe: () => onProbeSensor('camera'),
      onToggle: () => onToggleCamera(!hasCam),
      isAllowed: hasCam,
    },
    {
      id: 'mic',
      name: 'Microphone',
      icon: '🎤',
      requested: hasMic,
      status: hasMic ? 'GRANTED' : 'NOT REQUESTED',
      canProbe: true,
      onProbe: () => onProbeSensor('mic'),
      onToggle: () => onToggleMic(!hasMic),
      isAllowed: hasMic,
    },
    {
      id: 'loc',
      name: 'GPS Location',
      icon: '📍',
      requested: hasLoc,
      status: hasLoc ? 'GRANTED' : 'NOT REQUESTED',
      canProbe: false,
    },
    {
      id: 'contacts',
      name: 'Contacts',
      icon: '👥',
      requested: hasContacts,
      status: hasContacts ? 'GRANTED' : 'NOT REQUESTED',
      canProbe: false,
    },
    {
      id: 'sms',
      name: 'SMS / 2FA',
      icon: '✉️',
      requested: hasSms,
      status: hasSms ? 'GRANTED' : 'NOT REQUESTED',
      canProbe: false,
    },
    {
      id: 'storage',
      name: 'Storage',
      icon: '📁',
      requested: hasStorage,
      status: hasStorage ? 'GRANTED' : 'NOT REQUESTED',
      canProbe: false,
    },
    {
      id: 'internet',
      name: 'Internet',
      icon: '🌐',
      requested: hasNet,
      status: hasNet ? 'DECLARED' : 'NOT REQUESTED',
      canProbe: false,
    },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.appHeaderLeft}>
            <View style={styles.appIconBox}>
              <Text style={styles.appIconText}>{app.icon}</Text>
            </View>
            <View style={styles.appTitleWrap}>
              <Text style={styles.appName} numberOfLines={1}>
                {app.name}
              </Text>
              <Text style={styles.appMeta} numberOfLines={1}>
                {app.categoryDisplay} • {app.packageName || app.id}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* CBPRA Threat Score Card */}
          <View style={styles.scoreCard}>
            <RadialHealthGauge
              score={100 - (audit?.finalScore || 0)}
              size={100}
              strokeWidth={8}
            />
            <View style={styles.scoreDetails}>
              <View style={styles.scoreBadgeRow}>
                <Text style={styles.threatScoreText}>
                  {audit?.finalScore || 0}
                  <Text style={styles.threatMax}> / 100</Text>
                </Text>
                <View
                  style={[
                    styles.riskBadge,
                    audit?.riskLevel === 'CRITICAL'
                      ? styles.badgeCritical
                      : audit?.riskLevel === 'HIGH'
                      ? styles.badgeHigh
                      : audit?.riskLevel === 'MEDIUM'
                      ? styles.badgeMedium
                      : styles.badgeSafe,
                  ]}
                >
                  <Text style={styles.riskBadgeText}>{audit?.riskLevel || 'LOW'} RISK</Text>
                </View>
              </View>
              <Text style={styles.scoreBreakdownText}>
                Sensitivity: {audit?.baseSensitivity || 0} pts | Mismatch: +{audit?.mismatchPenalty || 0} pts | Synergies: +{audit?.threatPenalty || 0} pts
              </Text>
            </View>
          </View>

          {/* Sensitive Hardware Sensors Matrix */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>🛡️ Sensitive Hardware Sensors Matrix</Text>
            <View style={styles.sensorGrid}>
              {sensors.map((s) => {
                const isRequested = s.requested;
                const isGranted = s.status === 'GRANTED' || s.status === 'DECLARED';
                return (
                  <View key={s.id} style={styles.sensorItem}>
                    <View style={styles.sensorItemTop}>
                      <Text style={styles.sensorName}>
                        {s.icon} {s.name}
                      </Text>
                      <View
                        style={[
                          styles.statusBadge,
                          !isRequested
                            ? styles.badgeNotRequested
                            : isGranted
                            ? styles.badgeGranted
                            : styles.badgeDenied,
                        ]}
                      >
                        <Text style={styles.statusBadgeText}>{s.status}</Text>
                      </View>
                    </View>

                    <Text style={styles.sensorRequestedText}>
                      Requested: <Text style={{ fontWeight: '700', color: isRequested ? Colors.textPrimary : Colors.textSecondary }}>{isRequested ? 'YES' : 'NO'}</Text>
                    </Text>

                    {/* Action buttons for Camera and Mic */}
                    {s.canProbe && (
                      <View style={styles.sensorActions}>
                        <TouchableOpacity
                          style={styles.btnSensorProbe}
                          onPress={s.onProbe}
                        >
                          <Text style={styles.btnSensorProbeText}>
                            {s.id === 'camera' ? '⚙️ Manage Camera' : '⚙️ Manage Mic'}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.btnSensorToggle,
                            s.isAllowed ? styles.btnToggleOff : styles.btnToggleOn,
                          ]}
                          onPress={s.onToggle}
                        >
                          <Text style={styles.btnSensorToggleText}>
                            {s.isAllowed ? '🛑 Turn OFF' : '🟢 Allow'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>

          {/* AI Privacy Explanation */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>🤖 AI Contextual Risk Analysis</Text>
            <Text style={styles.aiExplanationText}>
              {audit?.aiExplanation || 'No risk anomalies detected.'}
            </Text>
          </View>

          {/* Action Recommendation */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>💡 System Recommendation</Text>
            <View style={styles.recBadge}>
              <Text style={styles.recBadgeText}>{audit?.recommendation?.action || 'ALLOW'}</Text>
            </View>
            <Text style={styles.recText}>
              {audit?.recommendation?.text || 'Permissions appear normal for this application.'}
            </Text>
          </View>

          {/* Synergistic Threat Vectors (if any) */}
          {audit && audit.threatVectors && audit.threatVectors.length > 0 && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>🚨 Active Synergistic Threat Vectors</Text>
              {audit.threatVectors.map((v) => (
                <ThreatVectorCard key={v.id} threat={v} />
              ))}
            </View>
          )}

          {/* Declared Manifest Permissions Audit */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>
              📋 Declared Manifest Permissions ({app.permissions.length})
            </Text>
            {app.permissions.map((pKey) => {
              const def = KNOWN_PERMISSIONS[pKey] || {
                key: pKey,
                name: pKey,
                weight: 10,
                group: 'System',
                desc: 'System capability',
                riskDesc: 'Standard capability',
              };
              const isExpected = expectedList.includes(pKey);
              return (
                <PermissionAuditItem
                  key={pKey}
                  permission={def}
                  isExpected={isExpected}
                />
              );
            })}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E17',
    paddingTop: Platform.OS === 'ios' ? 48 : 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceGlassBorder,
  },
  appHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  appIconBox: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: Colors.surfaceGlassBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  appIconText: {
    fontSize: 24,
  },
  appTitleWrap: {
    flex: 1,
  },
  appName: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  appMeta: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: Spacing.xs + 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: BorderRadius.full,
  },
  closeBtnText: {
    fontSize: 18,
    color: Colors.textPrimary,
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: 60,
  },
  scoreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.glassFill,
    borderWidth: 1,
    borderColor: Colors.surfaceGlassBorder,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  scoreDetails: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  scoreBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  threatScoreText: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  threatMax: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  riskBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  badgeCritical: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: Colors.crimsonCritical,
  },
  badgeHigh: {
    backgroundColor: 'rgba(249, 115, 22, 0.2)',
    borderWidth: 1,
    borderColor: Colors.orangeHigh,
  },
  badgeMedium: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderWidth: 1,
    borderColor: Colors.amberWarning,
  },
  badgeSafe: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    borderColor: Colors.emeraldSafe,
  },
  riskBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  scoreBreakdownText: {
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  sectionCard: {
    backgroundColor: Colors.glassFill,
    borderWidth: 1,
    borderColor: Colors.surfaceGlassBorder,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  sensorGrid: {
    gap: Spacing.sm,
  },
  sensorItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm + 2,
  },
  sensorItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sensorName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  badgeGranted: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    borderColor: Colors.emeraldSafe,
  },
  badgeDenied: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: Colors.crimsonCritical,
  },
  badgeNotRequested: {
    backgroundColor: 'rgba(100, 116, 139, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.45)',
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  sensorRequestedText: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  sensorActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  btnSensorProbe: {
    flex: 1,
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.35)',
    paddingVertical: 7,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  btnSensorProbeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.cyanAccent,
  },
  btnSensorToggle: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  btnToggleOff: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: Colors.crimsonCritical,
  },
  btnToggleOn: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    borderColor: Colors.emeraldSafe,
  },
  btnSensorToggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  aiExplanationText: {
    fontSize: 12,
    color: Colors.textPrimary,
    lineHeight: 18,
  },
  recBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
    borderWidth: 1,
    borderColor: Colors.cyanAccent,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
  },
  recBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.cyanAccent,
  },
  recText: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
});
