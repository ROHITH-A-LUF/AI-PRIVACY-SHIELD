import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AuditProvider, useAudit } from './src/context/AuditContext';
import { RadialHealthGauge } from './src/components/RadialHealthGauge';
import { StatBox } from './src/components/StatBox';
import { AppCard } from './src/components/AppCard';
import { ScanProgressModal } from './src/components/ScanProgressModal';
import { LiveSensorProbeModal } from './src/components/LiveSensorProbeModal';
import { AppDetailModal } from './src/components/AppDetailModal';
import { Colors, Spacing, BorderRadius } from './src/constants/theme';
import { AppItem } from './src/models/types';

function MainPrivacyDashboard() {
  const {
    apps,
    stats,
    healthScore,
    healthStatus,
    healthLevel,
    healthDescription,
    currentFilter,
    setCurrentFilter,
    isScanning,
    scanStep,
    scanProgress,
    triggerAuditScan,
    toggleCameraPermission,
    toggleMicPermission,
  } = useAudit();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedApp, setSelectedApp] = useState<AppItem | null>(null);

  // Live Sensor Probe Modal state
  const [probeModalVisible, setProbeModalVisible] = useState<boolean>(false);
  const [probeInitialMode, setProbeInitialMode] = useState<'camera' | 'mic'>('camera');
  const [probeTargetApp, setProbeTargetApp] = useState<AppItem | null>(null);

  const filteredApps = useMemo(() => {
    return apps.filter((app) => {
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = app.name.toLowerCase().includes(q);
        const matchCat = app.category.toLowerCase().includes(q);
        const matchPkg = app.packageName ? app.packageName.toLowerCase().includes(q) : false;
        if (!matchName && !matchCat && !matchPkg) return false;
      }

      // Tab filter
      if (currentFilter === 'all') return true;
      if (currentFilter === 'camera') return app.permissions.includes('CAMERA');
      if (currentFilter === 'mic') return app.permissions.includes('RECORD_AUDIO');
      if (currentFilter === 'critical') return (app.auditResult?.finalScore || 0) >= 81;
      if (currentFilter === 'high') return (app.auditResult?.finalScore || 0) >= 61;
      if (currentFilter === 'safe') return (app.auditResult?.finalScore || 0) <= 30;
      return true;
    });
  }, [apps, searchQuery, currentFilter]);

  const handleToggleCamera = (app: AppItem, allow: boolean) => {
    toggleCameraPermission(app.id, allow);
    // Refresh selected app if open in modal
    if (selectedApp && selectedApp.id === app.id) {
      setSelectedApp((prev) => {
        if (!prev) return null;
        const cur = prev.permissions || [];
        const next = allow
          ? cur.includes('CAMERA') ? cur : [...cur, 'CAMERA']
          : cur.filter((p) => p !== 'CAMERA');
        return { ...prev, permissions: next as any };
      });
    }
    Alert.alert(
      allow ? '🟢 Camera Allowed' : '🛑 Camera Turned OFF',
      allow
        ? `Camera access has been allowed for ${app.name}. Threat score recalculated.`
        : `Camera permission turned OFF for ${app.name}! Privacy Shield engaged and risk score decreased.`
    );
  };

  const handleToggleMic = (app: AppItem, allow: boolean) => {
    toggleMicPermission(app.id, allow);
    // Refresh selected app if open in modal
    if (selectedApp && selectedApp.id === app.id) {
      setSelectedApp((prev) => {
        if (!prev) return null;
        const cur = prev.permissions || [];
        const next = allow
          ? cur.includes('RECORD_AUDIO') ? cur : [...cur, 'RECORD_AUDIO']
          : cur.filter((p) => p !== 'RECORD_AUDIO');
        return { ...prev, permissions: next as any };
      });
    }
    Alert.alert(
      allow ? '🟢 Microphone Allowed' : '🛑 Microphone Turned OFF',
      allow
        ? `Microphone access allowed for ${app.name}. Threat score recalculated.`
        : `Microphone muted / revoked for ${app.name}! Privacy Shield active.`
    );
  };

  const openSensorProbe = (mode: 'camera' | 'mic', app?: AppItem) => {
    setProbeInitialMode(mode);
    setProbeTargetApp(app || null);
    setProbeModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <Text style={styles.logoIcon}>🛡️</Text>
            <View>
              <Text style={styles.logoTitle}>
                PrivacyShield <Text style={styles.cyanText}>AI</Text>
              </Text>
              <Text style={styles.logoSubtitle}>Mobile App Privacy & Sensor Auditor</Text>
            </View>
          </View>

          <View style={styles.headerButtonsRow}>
            <TouchableOpacity
              style={styles.btnHeaderProbe}
              activeOpacity={0.7}
              onPress={() => openSensorProbe('camera')}
            >
              <Text style={styles.btnHeaderProbeText}>📸 Live Probe</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.scanButton}
              activeOpacity={0.7}
              onPress={triggerAuditScan}
            >
              <Text style={styles.scanButtonText}>⚡ Audit Apps</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Health Score Card */}
        <View style={styles.healthCard}>
          <RadialHealthGauge score={healthScore} size={110} strokeWidth={9} />
          <View style={styles.healthInfo}>
            <View style={styles.healthBadgeRow}>
              <Text style={styles.healthIndexLabel}>HEALTH INDEX</Text>
              <View
                style={[
                  styles.healthLevelBadge,
                  healthLevel === 'HEALTHY'
                    ? styles.badgeSafe
                    : healthLevel === 'CAUTION'
                    ? styles.badgeWarn
                    : styles.badgeRisk,
                ]}
              >
                <Text style={styles.healthLevelText}>{healthLevel}</Text>
              </View>
            </View>
            <Text style={styles.healthStatusTitle}>{healthStatus}</Text>
            <Text style={styles.healthDesc}>{healthDescription}</Text>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatBox value={stats.totalApps} label="Audited Apps" variant="cyan" />
          <StatBox
            value={stats.sensitiveCount}
            label="Sensitive Perms"
            variant="crimson"
          />
          <StatBox
            value={stats.mismatchCount}
            label="Context Drift"
            variant="orange"
          />
          <StatBox
            value={stats.threatsCount}
            label="Threat Vectors"
            variant="crimson"
          />
        </View>

        {/* Live Camera & Mic Access Hub Banner */}
        <View style={styles.cameraBridgeBox}>
          <View style={styles.cameraBridgeHeader}>
            <Text style={styles.cameraBridgeIcon}>📸</Text>
            <View style={styles.cameraBridgeTexts}>
              <Text style={styles.cameraBridgeTitle}>Live Camera & Mic Sensor Hub</Text>
              <Text style={styles.cameraBridgeSubtitle}>
                Probe device sensors in real time and test hardware kill-switch / privacy blocking.
              </Text>
            </View>
          </View>

          <View style={styles.bridgeActionsRow}>
            <TouchableOpacity
              style={styles.btnBridgeAction}
              onPress={() => openSensorProbe('camera')}
            >
              <Text style={styles.btnBridgeActionText}>📷 Test Camera Feed</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btnBridgeAction, styles.btnBridgeMic]}
              onPress={() => openSensorProbe('mic')}
            >
              <Text style={styles.btnBridgeActionText}>🎙️ Test Microphone</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBarWrap}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search all apps by name, category, or package..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.searchClear}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContainer}
        >
          {[
            { id: 'all', label: `All Apps (${apps.length})` },
            { id: 'camera', label: '📷 Camera' },
            { id: 'mic', label: '🎙️ Mic' },
            { id: 'critical', label: '🚨 Critical' },
            { id: 'high', label: 'High Risk' },
            { id: 'safe', label: '🟢 Safe' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.filterTab,
                currentFilter === tab.id && styles.filterTabActive,
              ]}
              onPress={() => setCurrentFilter(tab.id)}
            >
              <Text
                style={[
                  styles.filterTabText,
                  currentFilter === tab.id && styles.filterTabTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* App List */}
        <View style={styles.appList}>
          <View style={styles.listHeaderRow}>
            <Text style={styles.listHeading}>
              Installed Applications ({filteredApps.length})
            </Text>
            <Text style={styles.listSubheading}>Tap any card for deep audit</Text>
          </View>

          {filteredApps.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyText}>No applications found matching your criteria.</Text>
            </View>
          ) : (
            filteredApps.map((app) => {
              const hasCam = app.permissions.includes('CAMERA');
              const hasMic = app.permissions.includes('RECORD_AUDIO');

              return (
                <View key={app.id} style={styles.appCardWrapper}>
                  <AppCard
                    app={app}
                    onPress={(item) => setSelectedApp(item)}
                  />

                  {/* Sensor Quick Actions Row */}
                  {(hasCam || hasMic) && (
                    <View style={styles.cardSensorActionsRow}>
                      {hasCam && (
                        <View style={styles.sensorItemAction}>
                          <TouchableOpacity
                            style={styles.btnAccessSmall}
                            onPress={() => openSensorProbe('camera', app)}
                          >
                            <Text style={styles.btnAccessSmallText}>⚙️ Manage Camera</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.btnToggleSmall, styles.btnToggleOff]}
                            onPress={() => handleToggleCamera(app, false)}
                          >
                            <Text style={styles.btnToggleSmallText}>🛑 Turn OFF</Text>
                          </TouchableOpacity>
                        </View>
                      )}

                      {hasMic && (
                        <View style={styles.sensorItemAction}>
                          <TouchableOpacity
                            style={styles.btnAccessSmall}
                            onPress={() => openSensorProbe('mic', app)}
                          >
                            <Text style={styles.btnAccessSmallText}>⚙️ Manage Mic</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.btnToggleSmall, styles.btnToggleOff]}
                            onPress={() => handleToggleMic(app, false)}
                          >
                            <Text style={styles.btnToggleSmallText}>🛑 Turn OFF</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* App Detail Deep-Dive Modal */}
      <AppDetailModal
        app={selectedApp}
        visible={selectedApp !== null}
        onClose={() => setSelectedApp(null)}
        onProbeSensor={(sensor) => {
          if (selectedApp) {
            openSensorProbe(sensor, selectedApp);
          }
        }}
        onToggleCamera={(allow) => {
          if (selectedApp) handleToggleCamera(selectedApp, allow);
        }}
        onToggleMic={(allow) => {
          if (selectedApp) handleToggleMic(selectedApp, allow);
        }}
      />

      {/* Live Camera & Mic Probe Modal */}
      <LiveSensorProbeModal
        visible={probeModalVisible}
        initialMode={probeInitialMode}
        appName={probeTargetApp ? probeTargetApp.name : 'PrivacyShield Live Probe'}
        packageName={probeTargetApp ? probeTargetApp.packageName : ''}
        isCameraAllowed={probeTargetApp ? probeTargetApp.permissions.includes('CAMERA') : true}
        isMicAllowed={probeTargetApp ? probeTargetApp.permissions.includes('RECORD_AUDIO') : true}
        onClose={() => setProbeModalVisible(false)}
        onToggleCamera={(allow) => {
          if (probeTargetApp) handleToggleCamera(probeTargetApp, allow);
        }}
        onToggleMic={(allow) => {
          if (probeTargetApp) handleToggleMic(probeTargetApp, allow);
        }}
      />

      {/* Scanning Animation Modal */}
      <ScanProgressModal
        visible={isScanning}
        stepText={scanStep}
        progress={scanProgress}
      />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <AuditProvider>
      <MainPrivacyDashboard />
    </AuditProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0A0E17',
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
    paddingTop: 8,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIcon: {
    fontSize: 28,
    marginRight: Spacing.xs + 2,
  },
  logoTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  cyanText: {
    color: Colors.cyanAccent,
  },
  logoSubtitle: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  headerButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  btnHeaderProbe: {
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.4)',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
  },
  btnHeaderProbeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.cyanAccent,
  },
  scanButton: {
    backgroundColor: Colors.cyanAccent,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
  },
  scanButtonText: {
    color: '#0A0E17',
    fontSize: 11,
    fontWeight: '800',
  },
  healthCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.glassFill,
    borderWidth: 1,
    borderColor: Colors.surfaceGlassBorder,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  healthInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  healthBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  healthIndexLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  healthLevelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  badgeSafe: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    borderColor: Colors.emeraldSafe,
  },
  badgeWarn: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderWidth: 1,
    borderColor: Colors.amberWarning,
  },
  badgeRisk: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: Colors.crimsonCritical,
  },
  healthLevelText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  healthStatusTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  healthDesc: {
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  cameraBridgeBox: {
    backgroundColor: 'rgba(0, 240, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.25)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  cameraBridgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  cameraBridgeIcon: {
    fontSize: 26,
    marginRight: Spacing.sm,
  },
  cameraBridgeTexts: {
    flex: 1,
  },
  cameraBridgeTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.cyanAccent,
  },
  cameraBridgeSubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 15,
  },
  bridgeActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  btnBridgeAction: {
    flex: 1,
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.4)',
    paddingVertical: 9,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  btnBridgeMic: {
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
    borderColor: 'rgba(249, 115, 22, 0.4)',
  },
  btnBridgeActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.glassFill,
    borderWidth: 1,
    borderColor: Colors.surfaceGlassBorder,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm + 4,
    marginBottom: Spacing.sm,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: Colors.textPrimary,
    fontSize: 12,
  },
  searchClear: {
    color: Colors.textSecondary,
    fontSize: 14,
    padding: 4,
  },
  filterScroll: {
    marginBottom: Spacing.md,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  filterTabActive: {
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
    borderColor: Colors.cyanAccent,
  },
  filterTabText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  filterTabTextActive: {
    color: Colors.cyanAccent,
    fontWeight: '800',
  },
  appList: {
    marginBottom: Spacing.xl,
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  listHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  listSubheading: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  emptyContainer: {
    backgroundColor: Colors.glassFill,
    borderWidth: 1,
    borderColor: Colors.surfaceGlassBorder,
    borderRadius: BorderRadius.md,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: Spacing.xs,
  },
  emptyText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  appCardWrapper: {
    marginBottom: Spacing.sm,
  },
  cardSensorActionsRow: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: BorderRadius.md,
    padding: 8,
    marginTop: -4,
    marginBottom: 8,
    gap: 6,
  },
  sensorItemAction: {
    flexDirection: 'row',
    gap: 8,
  },
  btnAccessSmall: {
    flex: 2,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.3)',
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  btnAccessSmallText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.cyanAccent,
  },
  btnToggleSmall: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  btnToggleOff: {
    backgroundColor: 'rgba(239, 68, 68, 0.18)',
    borderWidth: 1,
    borderColor: Colors.crimsonCritical,
  },
  btnToggleSmallText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
});
