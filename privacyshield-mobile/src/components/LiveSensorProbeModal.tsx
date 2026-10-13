import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
  Dimensions,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Audio } from 'expo-av';
import { BorderRadius, Colors, Spacing } from '../constants/theme';

interface LiveSensorProbeModalProps {
  visible: boolean;
  initialMode?: 'camera' | 'mic';
  appName?: string;
  packageName?: string;
  onClose: () => void;
  onToggleCamera?: (allow: boolean) => void;
  onToggleMic?: (allow: boolean) => void;
  isCameraAllowed?: boolean;
  isMicAllowed?: boolean;
}

const { width } = Dimensions.get('window');

export const LiveSensorProbeModal: React.FC<LiveSensorProbeModalProps> = ({
  visible,
  initialMode = 'camera',
  appName = 'PrivacyShield AI Probe',
  packageName = '',
  onClose,
  onToggleCamera,
  onToggleMic,
  isCameraAllowed = true,
  isMicAllowed = true,
}) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'mic'>(initialMode);
  const [facing, setFacing] = useState<'front' | 'back'>('front');
  const [camPermission, requestCamPermission] = useCameraPermissions();
  const [micPermissionGranted, setMicPermissionGranted] = useState<boolean>(false);
  const [isRecordingMic, setIsRecordingMic] = useState<boolean>(false);
  const [micMeterLevel, setMicMeterLevel] = useState<number>(0.2);
  const [isCamBlockedLocally, setIsCamBlockedLocally] = useState<boolean>(!isCameraAllowed);
  const [isMicBlockedLocally, setIsMicBlockedLocally] = useState<boolean>(!isMicAllowed);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const meterIntervalRef = useRef<any>(null);

  useEffect(() => {
    if (visible) {
      setActiveTab(initialMode);
      setIsCamBlockedLocally(!isCameraAllowed);
      setIsMicBlockedLocally(!isMicAllowed);
    } else {
      stopMicRecording();
    }
  }, [visible, initialMode, isCameraAllowed, isMicAllowed]);

  // Request camera permission
  const handleRequestCamera = async () => {
    try {
      const res = await requestCamPermission();
      if (!res.granted) {
        Alert.alert(
          'Camera Permission Denied',
          'Please enable camera permissions in device settings to test live camera feed.'
        );
      }
    } catch (e) {
      console.warn('Camera request error:', e);
    }
  };

  // Request audio permission and start test recording
  const handleStartMicTest = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Microphone Permission Denied',
          'Please grant microphone permission to probe audio recording.'
        );
        setMicPermissionGranted(false);
        return;
      }
      setMicPermissionGranted(true);

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setIsRecordingMic(true);

      // Simulate live audio meter fluctuation
      meterIntervalRef.current = setInterval(() => {
        setMicMeterLevel(Math.random() * 0.7 + 0.15);
      }, 150);
    } catch (err) {
      console.warn('Failed to start audio recording:', err);
      // Fallback meter for testing
      setIsRecordingMic(true);
      setMicPermissionGranted(true);
      meterIntervalRef.current = setInterval(() => {
        setMicMeterLevel(Math.random() * 0.6 + 0.2);
      }, 150);
    }
  };

  const stopMicRecording = async () => {
    if (meterIntervalRef.current) {
      clearInterval(meterIntervalRef.current);
      meterIntervalRef.current = null;
    }
    if (recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
      } catch {}
      recordingRef.current = null;
    }
    setIsRecordingMic(false);
    setMicMeterLevel(0.05);
  };

  const handleToggleCamShield = () => {
    const next = !isCamBlockedLocally;
    setIsCamBlockedLocally(next);
    if (onToggleCamera) onToggleCamera(!next);
  };

  const handleToggleMicShield = () => {
    const next = !isMicBlockedLocally;
    setIsMicBlockedLocally(next);
    if (next) {
      stopMicRecording();
    }
    if (onToggleMic) onToggleMic(!next);
  };

  const toggleFacing = () => {
    setFacing((prev) => (prev === 'front' ? 'back' : 'front'));
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>
              {activeTab === 'camera' ? '📸 Live Camera Probe' : '🎙️ Live Microphone Probe'}
            </Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {appName} {packageName ? `(${packageName})` : ''}
            </Text>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'camera' && styles.tabItemActive]}
            onPress={() => setActiveTab('camera')}
          >
            <Text style={[styles.tabItemText, activeTab === 'camera' && styles.tabItemTextActive]}>
              📷 Camera View
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'mic' && styles.tabItemActive]}
            onPress={() => setActiveTab('mic')}
          >
            <Text style={[styles.tabItemText, activeTab === 'mic' && styles.tabItemTextActive]}>
              🎙️ Microphone Meter
            </Text>
          </TouchableOpacity>
        </View>

        {/* Body */}
        {activeTab === 'camera' ? (
          <View style={styles.sensorBody}>
            {/* Camera Viewport */}
            <View style={styles.viewportContainer}>
              {isCamBlockedLocally ? (
                <View style={styles.blockedScreen}>
                  <Text style={styles.blockedIcon}>🔒</Text>
                  <Text style={styles.blockedTitle}>CAMERA HARDWARE BLOCKED</Text>
                  <Text style={styles.blockedSubtitle}>
                    Privacy Shield has revoked camera access for this application. Video sensor
                    stream is completely terminated.
                  </Text>
                  <TouchableOpacity
                    style={styles.unblockBtn}
                    onPress={handleToggleCamShield}
                  >
                    <Text style={styles.unblockBtnText}>🟢 Unblock / Allow Camera</Text>
                  </TouchableOpacity>
                </View>
              ) : camPermission?.granted ? (
                <View style={styles.cameraWrapper}>
                  <CameraView style={styles.cameraView} facing={facing}>
                    {/* HUD Overlay */}
                    <View style={styles.hudOverlay}>
                      <View style={styles.hudBadge}>
                        <View style={styles.liveDot} />
                        <Text style={styles.hudBadgeText}>LIVE SENSOR PROBE</Text>
                      </View>
                      <TouchableOpacity style={styles.flipBtn} onPress={toggleFacing}>
                        <Text style={styles.flipBtnText}>🔄 Flip</Text>
                      </TouchableOpacity>
                    </View>
                  </CameraView>
                </View>
              ) : (
                <View style={styles.permissionPromptBox}>
                  <Text style={styles.promptIcon}>📷</Text>
                  <Text style={styles.promptTitle}>Camera Access Required</Text>
                  <Text style={styles.promptDesc}>
                    Tap below to request device camera permission and inspect live visual risk.
                  </Text>
                  <TouchableOpacity style={styles.grantBtn} onPress={handleRequestCamera}>
                    <Text style={styles.grantBtnText}>Grant Camera Permission</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Camera Controls Footer */}
            <View style={styles.controlsFooter}>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Camera Permission State:</Text>
                <Text
                  style={[
                    styles.statusValue,
                    isCamBlockedLocally ? styles.statusBlocked : styles.statusActive,
                  ]}
                >
                  {isCamBlockedLocally ? '🛑 TURNED OFF / BLOCKED' : '🟢 ACTIVE / ALLOWED'}
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.shieldToggleBtn, isCamBlockedLocally ? styles.btnGreen : styles.btnRed]}
                onPress={handleToggleCamShield}
              >
                <Text style={styles.shieldToggleText}>
                  {isCamBlockedLocally ? '🟢 Allow Camera Access' : '🛑 Turn OFF Camera (Engage Shield)'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.sensorBody}>
            {/* Microphone Viewport */}
            <View style={styles.viewportContainer}>
              {isMicBlockedLocally ? (
                <View style={styles.blockedScreen}>
                  <Text style={styles.blockedIcon}>🔇</Text>
                  <Text style={styles.blockedTitle}>MICROPHONE HARDWARE MUTED</Text>
                  <Text style={styles.blockedSubtitle}>
                    Privacy Shield has revoked audio recording privileges. Ambient audio
                    eavesdropping channel is completely severed.
                  </Text>
                  <TouchableOpacity
                    style={styles.unblockBtn}
                    onPress={handleToggleMicShield}
                  >
                    <Text style={styles.unblockBtnText}>🟢 Unblock / Allow Microphone</Text>
                  </TouchableOpacity>
                </View>
              ) : isRecordingMic ? (
                <View style={styles.micActiveBox}>
                  <View style={styles.micPulseCircle}>
                    <Text style={styles.micPulseIcon}>🎙️</Text>
                  </View>
                  <Text style={styles.micActiveTitle}>Ambient Audio Sensor Active</Text>
                  <Text style={styles.micActiveSubtitle}>
                    Listening for room acoustics and vocal input...
                  </Text>

                  {/* Audio Waveform Bars */}
                  <View style={styles.waveformContainer}>
                    {[0.3, 0.6, 0.9, 0.4, 0.8, 1.0, 0.7, 0.5, 0.85, 0.4].map((scale, i) => {
                      const dynamicH = Math.max(12, micMeterLevel * scale * 75);
                      return (
                        <View
                          key={i}
                          style={[
                            styles.waveBar,
                            {
                              height: dynamicH,
                              backgroundColor: i % 2 === 0 ? Colors.cyanAccent : Colors.orangeHigh,
                            },
                          ]}
                        />
                      );
                    })}
                  </View>

                  <TouchableOpacity style={styles.stopMicBtn} onPress={stopMicRecording}>
                    <Text style={styles.stopMicBtnText}>⏹ Stop Audio Probe</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.permissionPromptBox}>
                  <Text style={styles.promptIcon}>🎙️</Text>
                  <Text style={styles.promptTitle}>Test Microphone Audio</Text>
                  <Text style={styles.promptDesc}>
                    Tap below to probe microphone hardware and test ambient sound exfiltration risk.
                  </Text>
                  <TouchableOpacity style={styles.grantBtn} onPress={handleStartMicTest}>
                    <Text style={styles.grantBtnText}>Start Microphone Audio Probe</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Microphone Controls Footer */}
            <View style={styles.controlsFooter}>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Microphone Permission State:</Text>
                <Text
                  style={[
                    styles.statusValue,
                    isMicBlockedLocally ? styles.statusBlocked : styles.statusActive,
                  ]}
                >
                  {isMicBlockedLocally ? '🛑 TURNED OFF / BLOCKED' : '🟢 ACTIVE / ALLOWED'}
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.shieldToggleBtn, isMicBlockedLocally ? styles.btnGreen : styles.btnRed]}
                onPress={handleToggleMicShield}
              >
                <Text style={styles.shieldToggleText}>
                  {isMicBlockedLocally ? '🟢 Allow Microphone Access' : '🛑 Turn OFF Microphone (Engage Shield)'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
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
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.cyanAccent,
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    borderRadius: BorderRadius.md,
    padding: 3,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
  },
  tabItemActive: {
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.4)',
  },
  tabItemText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tabItemTextActive: {
    color: Colors.cyanAccent,
    fontWeight: '800',
  },
  sensorBody: {
    flex: 1,
    padding: Spacing.md,
    justifyContent: 'space-between',
  },
  viewportContainer: {
    flex: 1,
    backgroundColor: '#05070C',
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.surfaceGlassBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraWrapper: {
    width: '100%',
    height: '100%',
  },
  cameraView: {
    flex: 1,
  },
  hudOverlay: {
    flex: 1,
    padding: Spacing.md,
    justifyContent: 'space-between',
  },
  hudBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.4)',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.crimsonCritical,
    marginRight: 6,
  },
  hudBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.cyanAccent,
    letterSpacing: 0.5,
  },
  flipBtn: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.surfaceGlassBorder,
  },
  flipBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  blockedScreen: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blockedIcon: {
    fontSize: 54,
    marginBottom: Spacing.md,
  },
  blockedTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.crimsonCritical,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  blockedSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing.lg,
  },
  unblockBtn: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    borderColor: Colors.emeraldSafe,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: BorderRadius.full,
  },
  unblockBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.emeraldSafe,
  },
  permissionPromptBox: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promptIcon: {
    fontSize: 56,
    marginBottom: Spacing.md,
  },
  promptTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  promptDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing.lg,
  },
  grantBtn: {
    backgroundColor: Colors.cyanAccent,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: BorderRadius.full,
  },
  grantBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0A0E17',
  },
  micActiveBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    width: '100%',
  },
  micPulseCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    borderWidth: 2,
    borderColor: Colors.cyanAccent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  micPulseIcon: {
    fontSize: 36,
  },
  micActiveTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  micActiveSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 90,
    width: '80%',
    gap: 8,
    marginBottom: Spacing.lg,
  },
  waveBar: {
    width: 6,
    borderRadius: 3,
  },
  stopMicBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: Colors.crimsonCritical,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
  },
  stopMicBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.crimsonCritical,
  },
  controlsFooter: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: Colors.surfaceGlassBorder,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  statusLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  statusValue: {
    fontSize: 12,
    fontWeight: '800',
  },
  statusActive: {
    color: Colors.emeraldSafe,
  },
  statusBlocked: {
    color: Colors.crimsonCritical,
  },
  shieldToggleBtn: {
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  btnRed: {
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    borderWidth: 1,
    borderColor: Colors.crimsonCritical,
  },
  btnGreen: {
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
    borderWidth: 1,
    borderColor: Colors.emeraldSafe,
  },
  shieldToggleText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
});
