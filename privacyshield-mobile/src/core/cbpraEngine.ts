import { AppCategory, AuditResult, PermissionKey, RiskLevel, ThreatVector } from '../models/types';
import { CATEGORY_EXPECTED_PERMS, KNOWN_PERMISSIONS } from '../constants/permissions';

export function runCbpraAudit(
  category: AppCategory,
  permissionKeys: PermissionKey[]
): AuditResult {
  const expectedList = CATEGORY_EXPECTED_PERMS[category] || ['INTERNET', 'VIBRATE'];
  let baseSensitivity = 0;
  let mismatchPenalty = 0;
  const drivers: string[] = [];
  const unexpectedPerms: string[] = [];

  permissionKeys.forEach((pKey) => {
    const def = KNOWN_PERMISSIONS[pKey];
    if (!def) return;

    baseSensitivity += def.weight;

    const isExpected = expectedList.includes(pKey);
    if (!isExpected) {
      const mismatchContrib = def.weight * 1.5;
      mismatchPenalty += mismatchContrib;
      unexpectedPerms.push(def.name);
      drivers.push(`Unexpected ${def.name} in ${category}`);
    }
  });

  // Synergistic Threat Vectors Detector
  const threatVectors: ThreatVector[] = [];
  let threatPenalty = 0;

  const hasInternet = permissionKeys.includes('INTERNET');
  const hasSms =
    permissionKeys.includes('READ_SMS') || permissionKeys.includes('RECEIVE_SMS');
  const hasCamera = permissionKeys.includes('CAMERA');
  const hasMic = permissionKeys.includes('RECORD_AUDIO');
  const hasBgGps = permissionKeys.includes('ACCESS_BACKGROUND_LOCATION');

  if (hasSms && hasInternet && category !== 'MESSAGING') {
    threatVectors.push({
      id: 'THREAT_OTP_EXFILTRATION',
      title: 'Credential & 2FA OTP Interception Vector',
      desc: 'Possesses SMS reading capabilities alongside Internet egress outside messaging context. Can intercept banking verification OTPs and exfiltrate them.',
    });
    threatPenalty += 30;
    drivers.push('Synergistic Threat: OTP Exfiltration Vector');
  }

  if (
    hasCamera &&
    hasMic &&
    !['CAMERA', 'MESSAGING', 'SOCIAL_MEDIA'].includes(category)
  ) {
    threatVectors.push({
      id: 'THREAT_AV_SURVEILLANCE',
      title: 'Surreptitious Audio/Visual Surveillance Vector',
      desc: 'Bundles concurrent Camera and Microphone access in an unexpected context. Capable of simultaneous room recording.',
    });
    threatPenalty += 25;
    drivers.push('Synergistic Threat: Audio/Visual Surveillance Vector');
  }

  if (
    hasBgGps &&
    hasInternet &&
    !['NAVIGATION_MAPS', 'FITNESS_HEALTH'].includes(category)
  ) {
    threatVectors.push({
      id: 'THREAT_BG_LOCATION',
      title: '24/7 Persistent Geolocation Tracking Vector',
      desc: 'Continuous background tracking outside navigation/fitness. Harvests daily travel patterns.',
    });
    threatPenalty += 25;
    drivers.push('Synergistic Threat: 24/7 Geolocation Profiling');
  }

  // Density factor
  const densityPenalty = permissionKeys.length > 5 ? 10 : 0;

  const rawScore =
    baseSensitivity + mismatchPenalty + threatPenalty + densityPenalty;
  const finalScore = Math.min(100, Math.round(rawScore));

  let riskLevel: RiskLevel = 'LOW';
  let badgeClass = 'badge-safe';
  let recBadgeClass: 'rec-allow' | 'rec-allow-once' | 'rec-deny' = 'rec-allow';
  let recAction = 'ALLOW';
  let recText =
    'Permissions appear standard and appropriate for this application category.';

  if (finalScore >= 81) {
    riskLevel = 'CRITICAL';
    badgeClass = 'badge-critical';
    recBadgeClass = 'rec-deny';
    recAction = 'REVOKE IMMEDIATELY';
    recText = `Severe privacy mismatch detected. Immediately revoke permissions (${unexpectedPerms.join(
      ', '
    )}) in System Settings.`;
  } else if (finalScore >= 61) {
    riskLevel = 'HIGH';
    badgeClass = 'badge-high';
    recBadgeClass = 'rec-deny';
    recAction = 'DENY UNNECESSARY PERMS';
    recText = `Application requests permissions not required for its core functionality (${unexpectedPerms.join(
      ', '
    )}). Deny these permissions.`;
  } else if (finalScore >= 31) {
    riskLevel = 'MEDIUM';
    badgeClass = 'badge-medium';
    recBadgeClass = 'rec-allow-once';
    recAction = 'ALLOW ONCE / REVIEW';
    recText =
      "Application requests secondary permissions. Consider granting 'Only while in use'.";
  }

  // Generate Natural Language Deterministic AI Explanation
  let aiExplanation = '';
  if (riskLevel === 'LOW') {
    aiExplanation = `This application operates within normal privacy parameters for a ${category} application. All requested permissions align with expected functional requirements.`;
  } else if (riskLevel === 'MEDIUM') {
    aiExplanation = `Moderate privacy considerations. Requesting ${unexpectedPerms.join(
      ', '
    )} represents slight functional drift.`;
  } else if (riskLevel === 'HIGH') {
    aiExplanation = `High privacy risk. A ${category} application has no legitimate reason to access ${unexpectedPerms.join(
      ', '
    )}. Granting these permissions exposes sensitive device boundaries without utility benefit.`;
  } else {
    aiExplanation = `CRITICAL PRIVACY ALERT: Severe risk score (${finalScore}/100). The combination of permissions requested (${unexpectedPerms.join(
      ', '
    )}) introduces potential surveillance or data exfiltration channels.`;
  }

  return {
    finalScore,
    riskLevel,
    badgeClass,
    baseSensitivity: Math.round(baseSensitivity),
    mismatchPenalty: Math.round(mismatchPenalty),
    threatPenalty,
    threatVectors,
    dominantDrivers: drivers.slice(0, 3),
    unexpectedPerms,
    aiExplanation,
    recommendation: {
      action: recAction,
      badgeClass: recBadgeClass,
      text: recText,
    },
  };
}
