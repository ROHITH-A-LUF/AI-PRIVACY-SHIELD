export type PermissionKey =
  | 'CAMERA'
  | 'RECORD_AUDIO'
  | 'ACCESS_FINE_LOCATION'
  | 'ACCESS_BACKGROUND_LOCATION'
  | 'READ_CONTACTS'
  | 'READ_SMS'
  | 'RECEIVE_SMS'
  | 'READ_CALL_LOG'
  | 'READ_PHONE_STATE'
  | 'READ_EXTERNAL_STORAGE'
  | 'INTERNET'
  | 'POST_NOTIFICATIONS'
  | 'VIBRATE';

export interface PermissionDef {
  key: PermissionKey;
  name: string;
  weight: number;
  group: string;
  desc: string;
  riskDesc: string;
}

export type AppCategory =
  | 'CALCULATOR'
  | 'FLASHLIGHT'
  | 'CAMERA'
  | 'NAVIGATION_MAPS'
  | 'MESSAGING'
  | 'SOCIAL_MEDIA'
  | 'BANKING_FINANCE'
  | 'FITNESS_HEALTH'
  | 'NOTES_MEMO'
  | 'GAMING'
  | 'STREAMING_MEDIA'
  | 'UTILITY'
  | 'SHOPPING';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ThreatVector {
  id: string;
  title: string;
  desc: string;
}

export interface Recommendation {
  action: string;
  badgeClass: 'rec-allow' | 'rec-allow-once' | 'rec-deny';
  text: string;
}

export interface AuditResult {
  finalScore: number;
  riskLevel: RiskLevel;
  badgeClass: string;
  baseSensitivity: number;
  mismatchPenalty: number;
  threatPenalty: number;
  threatVectors: ThreatVector[];
  dominantDrivers: string[];
  unexpectedPerms: string[];
  aiExplanation: string;
  recommendation: Recommendation;
}

export interface AppItem {
  id: string;
  name: string;
  packageName?: string;
  category: AppCategory;
  categoryDisplay: string;
  icon: string;
  version: string;
  permissions: PermissionKey[];
  auditResult?: AuditResult;
}

export type RootTabParamList = {
  Dashboard: undefined;
  Inventory: undefined;
  Simulator: undefined;
  CalculatorDemo: undefined;
  Blueprint: undefined;
};

export type RootStackParamList = {
  MainTabs: undefined;
  AppDetail: { app: AppItem };
};
