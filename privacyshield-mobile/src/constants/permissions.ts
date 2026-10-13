import { AppCategory, PermissionDef, PermissionKey } from '../models/types';

export const KNOWN_PERMISSIONS: Record<PermissionKey, PermissionDef> = {
  CAMERA: {
    key: 'CAMERA',
    name: 'Camera',
    weight: 25,
    group: 'Media',
    desc: 'Accesses visual camera feed & photos',
    riskDesc: 'Unwarranted visual surveillance.',
  },
  RECORD_AUDIO: {
    key: 'RECORD_AUDIO',
    name: 'Microphone',
    weight: 25,
    group: 'Audio',
    desc: 'Records ambient acoustic audio',
    riskDesc: 'Secret audio eavesdropping.',
  },
  ACCESS_FINE_LOCATION: {
    key: 'ACCESS_FINE_LOCATION',
    name: 'GPS Location',
    weight: 25,
    group: 'Location',
    desc: 'Precise physical GPS coordinates',
    riskDesc: 'Real-time geographical tracking & destination profiling.',
  },
  ACCESS_BACKGROUND_LOCATION: {
    key: 'ACCESS_BACKGROUND_LOCATION',
    name: '24/7 Background Location',
    weight: 35,
    group: 'Location',
    desc: 'Continuous passive GPS tracking',
    riskDesc: '24/7 autonomous mobility breadcrumb tracking.',
  },
  READ_CONTACTS: {
    key: 'READ_CONTACTS',
    name: 'Read Contacts',
    weight: 25,
    group: 'Social Graph',
    desc: 'Reads entire address book & phone numbers',
    riskDesc: 'Social graph harvesting & contacts scraping.',
  },
  READ_SMS: {
    key: 'READ_SMS',
    name: 'Read SMS / 2FA OTP',
    weight: 35,
    group: 'Communications',
    desc: 'Reads SMS inbox & banking verification codes',
    riskDesc: 'Interception of banking OTPs and private SMS.',
  },
  RECEIVE_SMS: {
    key: 'RECEIVE_SMS',
    name: 'Receive Live SMS',
    weight: 35,
    group: 'Communications',
    desc: 'Processes live incoming text messages',
    riskDesc: 'Real-time 2FA interception before user awareness.',
  },
  READ_CALL_LOG: {
    key: 'READ_CALL_LOG',
    name: 'Read Call Logs',
    weight: 30,
    group: 'Telephony',
    desc: 'Reads complete call duration & timestamps',
    riskDesc: 'Personal communication profiling.',
  },
  READ_PHONE_STATE: {
    key: 'READ_PHONE_STATE',
    name: 'Device ID / Phone State',
    weight: 20,
    group: 'Identity',
    desc: 'SIM status & cellular hardware identifiers',
    riskDesc: 'Persistent device fingerprinting across apps.',
  },
  READ_EXTERNAL_STORAGE: {
    key: 'READ_EXTERNAL_STORAGE',
    name: 'Read Shared Files',
    weight: 15,
    group: 'Storage',
    desc: 'Accesses downloaded docs and photos',
    riskDesc: 'Inspection of saved files and screenshots.',
  },
  INTERNET: {
    key: 'INTERNET',
    name: 'Internet Network Egress',
    weight: 5,
    group: 'Network',
    desc: 'Opens network sockets to cloud servers',
    riskDesc: 'Primary data egress channel for exfiltration.',
  },
  POST_NOTIFICATIONS: {
    key: 'POST_NOTIFICATIONS',
    name: 'Notifications',
    weight: 5,
    group: 'UI',
    desc: 'Displays alerts on lock screen',
    riskDesc: 'Commercial push spamming.',
  },
  VIBRATE: {
    key: 'VIBRATE',
    name: 'Vibration Haptics',
    weight: 2,
    group: 'Hardware',
    desc: 'Controls haptic motor',
    riskDesc: 'Harmless utility.',
  },
};

export const CATEGORY_EXPECTED_PERMS: Record<AppCategory, PermissionKey[]> = {
  CALCULATOR: ['VIBRATE', 'INTERNET'],
  FLASHLIGHT: ['CAMERA', 'VIBRATE'],
  CAMERA: ['CAMERA', 'RECORD_AUDIO', 'READ_EXTERNAL_STORAGE', 'ACCESS_FINE_LOCATION', 'VIBRATE'],
  NAVIGATION_MAPS: ['ACCESS_FINE_LOCATION', 'ACCESS_BACKGROUND_LOCATION', 'INTERNET', 'RECORD_AUDIO', 'POST_NOTIFICATIONS', 'VIBRATE'],
  MESSAGING: ['INTERNET', 'READ_CONTACTS', 'CAMERA', 'RECORD_AUDIO', 'READ_EXTERNAL_STORAGE', 'POST_NOTIFICATIONS', 'READ_SMS', 'RECEIVE_SMS', 'VIBRATE'],
  SOCIAL_MEDIA: ['INTERNET', 'READ_CONTACTS', 'CAMERA', 'RECORD_AUDIO', 'READ_EXTERNAL_STORAGE', 'ACCESS_FINE_LOCATION', 'POST_NOTIFICATIONS', 'VIBRATE'],
  BANKING_FINANCE: ['INTERNET', 'CAMERA', 'POST_NOTIFICATIONS', 'ACCESS_FINE_LOCATION', 'VIBRATE'],
  FITNESS_HEALTH: ['INTERNET', 'ACCESS_FINE_LOCATION', 'ACCESS_BACKGROUND_LOCATION', 'POST_NOTIFICATIONS'],
  NOTES_MEMO: ['VIBRATE', 'READ_EXTERNAL_STORAGE', 'CAMERA', 'RECORD_AUDIO', 'INTERNET'],
  GAMING: ['INTERNET', 'VIBRATE', 'POST_NOTIFICATIONS'],
  STREAMING_MEDIA: ['INTERNET', 'POST_NOTIFICATIONS', 'VIBRATE', 'READ_PHONE_STATE', 'RECORD_AUDIO'],
  UTILITY: ['INTERNET', 'VIBRATE', 'POST_NOTIFICATIONS', 'READ_PHONE_STATE'],
  SHOPPING: ['INTERNET', 'ACCESS_FINE_LOCATION', 'POST_NOTIFICATIONS', 'VIBRATE', 'READ_EXTERNAL_STORAGE', 'CAMERA'],
};

export interface CategoryOption {
  value: AppCategory;
  label: string;
  icon: string;
}

export const CATEGORY_OPTIONS: CategoryOption[] = [
  { value: 'CALCULATOR', label: 'Calculator & Tools', icon: '🧮' },
  { value: 'FLASHLIGHT', label: 'Flashlight / Torch', icon: '🔦' },
  { value: 'CAMERA', label: 'Camera & Photography', icon: '📷' },
  { value: 'NAVIGATION_MAPS', label: 'Maps & Navigation', icon: '🗺️' },
  { value: 'MESSAGING', label: 'Messaging & Chat', icon: '💬' },
  { value: 'SOCIAL_MEDIA', label: 'Social Networking', icon: '👥' },
  { value: 'BANKING_FINANCE', label: 'Banking & Finance', icon: '💳' },
  { value: 'FITNESS_HEALTH', label: 'Fitness & Health', icon: '🏃' },
  { value: 'NOTES_MEMO', label: 'Notes & Productivity', icon: '📝' },
  { value: 'GAMING', label: 'Gaming', icon: '🎮' },
  { value: 'STREAMING_MEDIA', label: 'Streaming & Music', icon: '🎵' },
  { value: 'UTILITY', label: 'Utilities & Security', icon: '📱' },
  { value: 'SHOPPING', label: 'Shopping', icon: '🛍️' },
];
