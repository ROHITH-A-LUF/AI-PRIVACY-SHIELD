// PrivacyShield AI — Context-Based Permission Risk Assessment (CBPRA) Web Engine
// Physical Android Phone Live Dashboard & Real ADB Permission Bridge

// Global Knowledge Base of Android Permissions
const KNOWN_PERMISSIONS = {
    "CAMERA": { name: "Camera", weight: 25, group: "Media", desc: "Accesses visual camera feed & captures photos/videos", riskDesc: "Unwarranted visual surveillance." },
    "RECORD_AUDIO": { name: "Microphone", weight: 25, group: "Audio", desc: "Records ambient acoustic audio", riskDesc: "Secret audio eavesdropping." },
    "ACCESS_FINE_LOCATION": { name: "GPS Location", weight: 25, group: "Location", desc: "Precise physical GPS coordinates", riskDesc: "Real-time geographical tracking & destination profiling." },
    "ACCESS_BACKGROUND_LOCATION": { name: "24/7 Background Location", weight: 35, group: "Location", desc: "Continuous passive GPS tracking", riskDesc: "24/7 autonomous mobility breadcrumb tracking." },
    "READ_CONTACTS": { name: "Read Contacts", weight: 25, group: "Social Graph", desc: "Reads entire address book & phone numbers", riskDesc: "Social graph harvesting & contacts scraping." },
    "READ_SMS": { name: "Read SMS / 2FA OTP", weight: 35, group: "Communications", desc: "Reads SMS inbox & banking verification codes", riskDesc: "Interception of banking OTPs and private SMS." },
    "RECEIVE_SMS": { name: "Receive Live SMS", weight: 35, group: "Communications", desc: "Processes live incoming text messages", riskDesc: "Real-time 2FA interception before user awareness." },
    "READ_CALL_LOG": { name: "Read Call Logs", weight: 30, group: "Telephony", desc: "Reads complete call duration & timestamps", riskDesc: "Personal communication profiling." },
    "READ_PHONE_STATE": { name: "Device ID / Phone State", weight: 20, group: "Identity", desc: "SIM status & cellular hardware identifiers", riskDesc: "Persistent device fingerprinting across apps." },
    "READ_EXTERNAL_STORAGE": { name: "Shared Files & Media", weight: 15, group: "Storage", desc: "Accesses downloaded docs, photos and media", riskDesc: "Inspection of saved files and screenshots." },
    "READ_MEDIA_IMAGES": { name: "Photos Library", weight: 15, group: "Storage", desc: "Granular access to photo library (Android 13+)", riskDesc: "Inspection of personal photo albums." },
    "READ_MEDIA_VIDEO": { name: "Videos Library", weight: 15, group: "Storage", desc: "Granular access to video recordings", riskDesc: "Access to private personal videos." },
    "READ_MEDIA_AUDIO": { name: "Audio Library", weight: 10, group: "Storage", desc: "Granular access to music & audio files", riskDesc: "Inspection of recorded voice memos." },
    "INTERNET": { name: "Internet Network", weight: 5, group: "Network", desc: "Opens network sockets to cloud servers", riskDesc: "Primary data egress channel for exfiltration." },
    "POST_NOTIFICATIONS": { name: "Notifications", weight: 5, group: "UI", desc: "Displays alerts on lock screen", riskDesc: "Commercial push spamming." },
    "VIBRATE": { name: "Vibration Haptics", weight: 2, group: "Hardware", desc: "Controls haptic motor", riskDesc: "Harmless utility." }
};

// Expected Permission Matrix per Category Baseline
const CATEGORY_EXPECTED_PERMS = {
    "CALCULATOR": ["VIBRATE", "INTERNET"],
    "FLASHLIGHT": ["CAMERA", "VIBRATE"],
    "CAMERA": ["CAMERA", "RECORD_AUDIO", "READ_EXTERNAL_STORAGE", "ACCESS_FINE_LOCATION", "VIBRATE", "INTERNET", "POST_NOTIFICATIONS"],
    "NAVIGATION_MAPS": ["ACCESS_FINE_LOCATION", "ACCESS_BACKGROUND_LOCATION", "INTERNET", "RECORD_AUDIO", "POST_NOTIFICATIONS", "VIBRATE", "READ_PHONE_STATE"],
    "MESSAGING": ["INTERNET", "READ_CONTACTS", "CAMERA", "RECORD_AUDIO", "READ_EXTERNAL_STORAGE", "POST_NOTIFICATIONS", "READ_SMS", "RECEIVE_SMS", "READ_CALL_LOG", "READ_PHONE_STATE", "VIBRATE"],
    "SOCIAL_MEDIA": ["INTERNET", "READ_CONTACTS", "CAMERA", "RECORD_AUDIO", "READ_EXTERNAL_STORAGE", "ACCESS_FINE_LOCATION", "POST_NOTIFICATIONS", "VIBRATE", "READ_PHONE_STATE"],
    "BANKING_FINANCE": ["INTERNET", "CAMERA", "POST_NOTIFICATIONS", "ACCESS_FINE_LOCATION", "READ_PHONE_STATE", "READ_SMS", "RECEIVE_SMS", "READ_CONTACTS", "VIBRATE"],
    "FITNESS_HEALTH": ["INTERNET", "ACCESS_FINE_LOCATION", "ACCESS_BACKGROUND_LOCATION", "POST_NOTIFICATIONS", "VIBRATE"],
    "NOTES_MEMO": ["VIBRATE", "READ_EXTERNAL_STORAGE", "CAMERA", "RECORD_AUDIO", "INTERNET", "POST_NOTIFICATIONS", "READ_CONTACTS"],
    "GAMING": ["INTERNET", "VIBRATE", "POST_NOTIFICATIONS", "READ_EXTERNAL_STORAGE", "RECORD_AUDIO"],
    "STREAMING_MEDIA": ["INTERNET", "READ_EXTERNAL_STORAGE", "POST_NOTIFICATIONS", "VIBRATE", "READ_PHONE_STATE", "RECORD_AUDIO"],
    "SHOPPING": ["INTERNET", "ACCESS_FINE_LOCATION", "POST_NOTIFICATIONS", "VIBRATE", "READ_EXTERNAL_STORAGE", "CAMERA"],
    "UTILITY": ["INTERNET", "VIBRATE", "POST_NOTIFICATIONS", "READ_EXTERNAL_STORAGE", "READ_PHONE_STATE"]
};

// State Variables
let appInventory = [];
let connectedAndroidDevice = null;
let lastAuditTimestamp = null;
let searchQuery = "";
let currentFilter = "all";
let currentDetailApp = null;
let isRealPhoneMode = false;
let waitingForReturnFromSettings = null;

// UI Elements
const scoreValue = document.getElementById("score-value");
const scoreRing = document.getElementById("score-ring");
const scoreStatus = document.getElementById("score-status");
const scoreDescription = document.getElementById("score-description");
const scoreLevelBadge = document.getElementById("score-level-badge");

const statScanned = document.getElementById("stat-scanned");
const statSensitive = document.getElementById("stat-sensitive");
const statDrift = document.getElementById("stat-drift");
const statThreats = document.getElementById("stat-threats");

const appListContainer = document.getElementById("app-list-container");
const btnScan = document.getElementById("btn-scan");
const scanOverlay = document.getElementById("scan-overlay");
const scanStepText = document.getElementById("scan-step-text");
const scanProgressBar = document.getElementById("scan-progress-bar");

// Android Bridge UI Elements
const deviceStatusPill = document.getElementById("device-status-pill");
const deviceStatusDot = document.getElementById("device-status-dot");
const deviceStatusText = document.getElementById("device-status-text");
const deviceMetaSubtitle = document.getElementById("device-meta-subtitle");
const deviceSpecsBar = document.getElementById("device-specs-bar");
const specDeviceName = document.getElementById("spec-device-name");
const specAndroidVer = document.getElementById("spec-android-ver");
const specAdbStatus = document.getElementById("spec-adb-status");
const specLastAudit = document.getElementById("spec-last-audit");
const specAppsCount = document.getElementById("spec-apps-count");

const btnScanRealPhone = document.getElementById("btn-scan-real-phone");
const btnRefreshDevice = document.getElementById("btn-refresh-device");
const appListHeading = document.getElementById("app-list-heading");
const appListSubheading = document.getElementById("app-list-subheading");
const appSearchInput = document.getElementById("app-search-input");

// Detail Modal Elements
const detailOverlay = document.getElementById("detail-overlay");
const modalAppIcon = document.getElementById("modal-app-icon");
const modalAppTitle = document.getElementById("modal-app-title");
const modalAppCategory = document.getElementById("modal-app-category");
const modalRiskNumber = document.getElementById("modal-risk-number");
const modalRiskLevelBadge = document.getElementById("modal-risk-level-badge");
const modalRiskDesc = document.getElementById("modal-risk-desc");
const modalRiskDrivers = document.getElementById("modal-risk-drivers");
const modalThreatsContainer = document.getElementById("modal-threats-container");
const modalAiExplanation = document.getElementById("modal-ai-explanation");
const modalRecBadge = document.getElementById("modal-rec-badge");
const modalRecText = document.getElementById("modal-rec-text");
const modalPermissionsList = document.getElementById("modal-permissions-list");
const modalClose = document.getElementById("modal-close");
const btnSettingsRedirect = document.getElementById("btn-settings-redirect");
const btnRescanApp = document.getElementById("btn-rescan-app");

// Toast element
const privacyToast = document.getElementById("privacy-toast");
let toastTimer = null;

function showPrivacyToast(msg, type = "info") {
    if (!privacyToast) return;
    clearTimeout(toastTimer);
    privacyToast.innerText = msg;
    privacyToast.className = "privacy-toast show";
    if (type === "danger") privacyToast.classList.add("toast-danger");
    if (type === "success") privacyToast.classList.add("toast-success");
    toastTimer = setTimeout(() => {
        privacyToast.classList.remove("show");
    }, 4000);
}

// CBPRA Mathematical Risk Engine (Preserved & Verified)
function runCbpraAudit(category, requestedPerms, grantedPerms = []) {
    const expected = CATEGORY_EXPECTED_PERMS[category] || ["INTERNET", "VIBRATE", "POST_NOTIFICATIONS", "READ_EXTERNAL_STORAGE"];
    let rawSensitivity = 0;
    let rawMismatch = 0;
    const unexpectedPerms = [];
    const dominantDrivers = [];

    requestedPerms.forEach(p => {
        const def = KNOWN_PERMISSIONS[p];
        if (!def) return;
        const isGranted = grantedPerms.includes(p);
        const weightFactor = isGranted ? 1.0 : 0.35;
        rawSensitivity += def.weight * weightFactor;

        if (!expected.includes(p)) {
            const factor = isGranted ? 1.5 : 0.4;
            rawMismatch += def.weight * factor;
            const statusLabel = isGranted ? "GRANTED" : "DENIED";
            unexpectedPerms.push(`${def.name} [${statusLabel}]`);
            dominantDrivers.push(`Unexpected ${def.name} (${statusLabel}) in ${category.replace('_', ' ')}`);
        }
    });

    const baseSensitivity = Math.min(30.0, (rawSensitivity / 140.0) * 30.0);
    const mismatchPenalty = Math.min(45.0, (rawMismatch / 70.0) * 45.0);

    const threatVectors = [];
    let threatPenalty = 0;

    const hasInternet = requestedPerms.includes("INTERNET");
    const hasSms = requestedPerms.includes("READ_SMS") || requestedPerms.includes("RECEIVE_SMS");
    const hasCamera = requestedPerms.includes("CAMERA");
    const hasMic = requestedPerms.includes("RECORD_AUDIO");
    const hasBgGps = requestedPerms.includes("ACCESS_BACKGROUND_LOCATION");
    const hasContacts = requestedPerms.includes("READ_CONTACTS");

    const smsGranted = grantedPerms.includes("READ_SMS") || grantedPerms.includes("RECEIVE_SMS");
    const camGranted = grantedPerms.includes("CAMERA");
    const micGranted = grantedPerms.includes("RECORD_AUDIO");
    const bgGpsGranted = grantedPerms.includes("ACCESS_BACKGROUND_LOCATION");
    const contactsGranted = grantedPerms.includes("READ_CONTACTS");

    if (hasSms && hasInternet && !["MESSAGING", "BANKING_FINANCE"].includes(category)) {
        if (smsGranted) {
            threatVectors.push({
                id: "THREAT_OTP_EXFILTRATION",
                title: "Credential & 2FA OTP Interception Vector [ACTIVE]",
                desc: "Possesses active SMS reading capabilities alongside Internet egress outside messaging/finance context. Can intercept banking verification OTPs and exfiltrate them."
            });
            threatPenalty += 15;
            dominantDrivers.push("Synergistic Threat: OTP Exfiltration Vector (Active)");
        } else {
            threatVectors.push({
                id: "THREAT_OTP_EXFILTRATION_LATENT",
                title: "SMS Interception Capability [BLOCKED BY USER]",
                desc: "Declared SMS permissions alongside Internet egress, but SMS is currently DENIED by user."
            });
            threatPenalty += 5;
            dominantDrivers.push("Synergistic Threat: OTP Vector (Blocked by User)");
        }
    }

    if (hasCamera && hasMic && !["CAMERA", "MESSAGING", "SOCIAL_MEDIA"].includes(category)) {
        if (camGranted && micGranted) {
            threatVectors.push({
                id: "THREAT_AV_SURVEILLANCE",
                title: "Surreptitious Audio/Visual Surveillance Vector [ACTIVE]",
                desc: "Bundles concurrent active Camera and Microphone access in an unexpected context. Capable of simultaneous room recording."
            });
            threatPenalty += 12;
            dominantDrivers.push("Synergistic Threat: Audio/Visual Surveillance (Active)");
        } else if (camGranted || micGranted) {
            threatVectors.push({
                id: "THREAT_AV_SURVEILLANCE_PARTIAL",
                title: "Partial Sensor Surveillance Vector",
                desc: `Requests Camera and Microphone. One sensor is active (${camGranted ? 'Camera' : 'Microphone'}), while the other is denied.`
            });
            threatPenalty += 6;
            dominantDrivers.push("Synergistic Threat: Partial Sensor Access");
        } else {
            threatVectors.push({
                id: "THREAT_AV_SURVEILLANCE_BLOCKED",
                title: "Audio/Visual Sensor Capabilities [BLOCKED BY USER]",
                desc: "Requests Camera and Microphone in manifest, but both are currently DENIED by user."
            });
            threatPenalty += 3;
            dominantDrivers.push("Synergistic Threat: A/V Sensors (Shielded)");
        }
    }

    if (hasBgGps && hasInternet && !["NAVIGATION_MAPS", "FITNESS_HEALTH"].includes(category)) {
        threatVectors.push({
            id: "THREAT_BG_LOCATION",
            title: `24/7 Persistent Geolocation Tracking Vector [${bgGpsGranted ? 'ACTIVE' : 'DENIED'}]`,
            desc: "Continuous background GPS tracking outside navigation/fitness. Harvests daily travel patterns."
        });
        threatPenalty += bgGpsGranted ? 12 : 4;
        dominantDrivers.push("Synergistic Threat: 24/7 Geolocation Profiling");
    }

    if (hasContacts && hasInternet && !["MESSAGING", "SOCIAL_MEDIA", "BANKING_FINANCE", "NOTES_MEMO"].includes(category)) {
        threatVectors.push({
            id: "THREAT_CONTACTS_HARVEST",
            title: `Social Graph & Contacts Harvesting Vector [${contactsGranted ? 'ACTIVE' : 'DENIED'}]`,
            desc: "Extracts phone contacts alongside network transmission in an application that does not require social graph communication."
        });
        threatPenalty += contactsGranted ? 8 : 3;
        dominantDrivers.push("Synergistic Threat: Social Graph Scraping");
    }

    threatPenalty = Math.min(25.0, threatPenalty);
    const rawScore = baseSensitivity + mismatchPenalty + threatPenalty;
    const finalScore = Math.min(100, Math.max(5, Math.round(rawScore)));

    let riskLevel = "LOW";
    let badgeClass = "badge-safe";
    if (finalScore >= 81) {
        riskLevel = "CRITICAL";
        badgeClass = "badge-critical";
    } else if (finalScore >= 61) {
        riskLevel = "HIGH";
        badgeClass = "badge-high";
    } else if (finalScore >= 31) {
        riskLevel = "MEDIUM";
        badgeClass = "badge-medium";
    }

    let aiExplanation = "";
    if (riskLevel === "LOW") {
        aiExplanation = `This application operates within normal privacy parameters for a ${category.replace('_', ' ').toLowerCase()} application. Declared permissions align with standard functional baselines.`;
    } else if (riskLevel === "MEDIUM") {
        aiExplanation = `Moderate privacy considerations (${finalScore}/100). Requesting ${unexpectedPerms.length ? unexpectedPerms.join(', ') : 'secondary capabilities'} represents mild functional drift.`;
    } else if (riskLevel === "HIGH") {
        aiExplanation = `High privacy risk detected (${finalScore}/100). A ${category.replace('_', ' ').toLowerCase()} application has no legitimate reason to access ${unexpectedPerms.join(', ')}. Keeping unnecessary permissions revoked protects your personal data.`;
    } else {
        aiExplanation = `CRITICAL PRIVACY ALERT: Severe threat score (${finalScore}/100). The combination of permissions requested (${unexpectedPerms.join(', ')}) introduces potential surveillance or data exfiltration channels.`;
    }

    return {
        finalScore,
        riskLevel,
        badgeClass,
        baseSensitivity: Math.round(baseSensitivity),
        mismatchPenalty: Math.round(mismatchPenalty),
        threatPenalty: Math.round(threatPenalty),
        threatVectors,
        dominantDrivers: dominantDrivers.slice(0, 3),
        unexpectedPerms,
        aiExplanation,
        recommendation: {
            action: finalScore >= 61 ? "REVOKE PERMISSIONS" : (finalScore >= 31 ? "REVIEW PERMISSIONS" : "ALLOW ACCESS"),
            badgeClass: finalScore >= 61 ? "rec-deny" : (finalScore >= 31 ? "rec-allow-once" : "rec-allow"),
            text: finalScore >= 61 ? "Revoke sensitive permissions on your phone immediately." : (finalScore >= 31 ? "Audit sensor usage periodically." : "Operates within normal boundaries.")
        }
    };
}

// Transform app data received from python bridge into normalized state
function normalizeAppAudit(app) {
    const pkg = app.packageName || app.id;
    const permissions = app.permissions || [];
    const granted = app.grantedPermissions || [];
    const denied = app.deniedPermissions || [];

    const auditRes = app.auditResult || runCbpraAudit(app.category, permissions, granted);

    // Build sensor matrix strictly from phone reported state
    const hasCam = permissions.includes("CAMERA");
    const grantedCam = granted.includes("CAMERA");

    const hasMic = permissions.includes("RECORD_AUDIO");
    const grantedMic = granted.includes("RECORD_AUDIO");

    const hasLoc = permissions.includes("ACCESS_FINE_LOCATION") || permissions.includes("ACCESS_BACKGROUND_LOCATION");
    const grantedLoc = granted.includes("ACCESS_FINE_LOCATION") || granted.includes("ACCESS_BACKGROUND_LOCATION");

    const hasNet = permissions.includes("INTERNET");
    const grantedNet = granted.includes("INTERNET") || hasNet;

    const sensorMatrix = {
        camera: {
            name: "Camera",
            icon: "📷",
            requested: hasCam,
            granted: grantedCam,
            status: grantedCam ? "GRANTED" : (hasCam ? "DENIED" : "NOT_REQUESTED"),
            statusText: grantedCam ? "GRANTED" : (hasCam ? "DENIED" : "NOT REQUESTED")
        },
        microphone: {
            name: "Microphone",
            icon: "🎤",
            requested: hasMic,
            granted: grantedMic,
            status: grantedMic ? "GRANTED" : (hasMic ? "DENIED" : "NOT_REQUESTED"),
            statusText: grantedMic ? "GRANTED" : (hasMic ? "DENIED" : "NOT REQUESTED")
        },
        location: {
            name: "Location",
            icon: "📍",
            requested: hasLoc,
            granted: grantedLoc,
            status: grantedLoc ? "GRANTED" : (hasLoc ? "DENIED" : "NOT_REQUESTED"),
            statusText: grantedLoc ? "GRANTED" : (hasLoc ? "DENIED" : "NOT REQUESTED")
        },
        internet: {
            name: "Internet",
            icon: "🌐",
            requested: hasNet,
            granted: grantedNet,
            status: hasNet ? "DECLARED" : "NOT_REQUESTED",
            statusText: hasNet ? "DECLARED" : "NOT REQUESTED"
        }
    };

    return {
        id: pkg,
        packageName: pkg,
        name: app.name || pkg,
        category: app.category || "UTILITY",
        categoryDisplay: app.categoryDisplay || `${(app.category || 'Utility').replace('_', ' ')} ${app.icon || '📱'}`,
        icon: app.icon || "📱",
        version: app.version || "1.0",
        permissions,
        grantedPermissions: granted,
        deniedPermissions: denied,
        sensorMatrix,
        permissionDetails: app.permissionDetails || [],
        hasCamera: hasCam,
        grantedCamera: grantedCam,
        hasMicrophone: hasMic,
        grantedMicrophone: grantedMic,
        hasLocation: hasLoc,
        grantedLocation: grantedLoc,
        hasInternet: hasNet,
        grantedInternet: grantedNet,
        threatScore: auditRes.finalScore,
        riskLevel: auditRes.riskLevel,
        badgeClass: auditRes.badgeClass,
        auditResult: auditRes,
        suggestion: app.suggestion || auditRes.aiExplanation
    };
}

// Update single app in inventory following ADB revocation or grant
function updateAppInInventory(rawApp) {
    const normalized = normalizeAppAudit(rawApp);
    const idx = appInventory.findIndex(a => a.packageName === normalized.packageName);
    if (idx >= 0) {
        appInventory[idx] = normalized;
    } else {
        appInventory.push(normalized);
    }
    updateDashboardUI();
    if (currentDetailApp && currentDetailApp.packageName === normalized.packageName) {
        openAppDetail(normalized);
    }
}

// Update full dashboard metrics & stats
function updateDashboardUI() {
    const totalApps = appInventory.length;
    let totalRisk = 0;
    let sensitiveCount = 0;
    let mismatchCount = 0;
    let threatsCount = 0;

    appInventory.forEach(app => {
        const res = app.auditResult;
        totalRisk += res.finalScore;
        if (res.mismatchPenalty > 0) mismatchCount++;
        if (res.threatVectors.length > 0) threatsCount += res.threatVectors.length;

        app.permissions.forEach(p => {
            if (KNOWN_PERMISSIONS[p] && KNOWN_PERMISSIONS[p].weight >= 20) {
                sensitiveCount++;
            }
        });
    });

    const avgRisk = totalApps > 0 ? totalRisk / totalApps : 0;
    const healthScore = totalApps > 0 ? Math.max(0, Math.min(100, Math.round(100 - avgRisk))) : 100;

    if (scoreValue) scoreValue.innerText = healthScore;

    if (scoreRing) {
        const offset = 264 - (healthScore / 100) * 264;
        scoreRing.style.strokeDashoffset = offset;

        if (healthScore >= 80) {
            scoreRing.style.stroke = "var(--emerald-safe)";
            scoreStatus.innerText = "Secured Mobile Privacy Environment";
            scoreStatus.className = "badge-safe";
            scoreLevelBadge.innerText = "HEALTHY";
            scoreLevelBadge.className = "badge-safe";
            scoreDescription.innerText = "All application permissions align cleanly with declared functional baselines.";
        } else if (healthScore >= 50) {
            scoreRing.style.stroke = "var(--amber-warning)";
            scoreStatus.innerText = "Moderate Privacy Anomalies Detected";
            scoreStatus.className = "badge-medium";
            scoreLevelBadge.innerText = "CAUTION";
            scoreLevelBadge.className = "badge-medium";
            scoreDescription.innerText = `${mismatchCount} applications request permissions outside their functional domain.`;
        } else {
            scoreRing.style.stroke = "var(--crimson-critical)";
            scoreStatus.innerText = "Critical Privacy Exposure Alert";
            scoreStatus.className = "badge-critical";
            scoreLevelBadge.innerText = "AT RISK";
            scoreLevelBadge.className = "badge-critical";
            scoreDescription.innerText = `${mismatchCount} apps show severe context drift, including ${threatsCount} active threat vectors.`;
        }
    }

    if (statScanned) statScanned.innerText = totalApps;
    if (statSensitive) statSensitive.innerText = sensitiveCount;
    if (statDrift) statDrift.innerText = mismatchCount;
    if (statThreats) statThreats.innerText = threatsCount;

    renderAppList();
}

// Render real application cards with individual permission states & controls
function renderAppList() {
    if (!appListContainer) return;
    appListContainer.innerHTML = "";

    if (!isRealPhoneMode && (!appInventory || appInventory.length === 0)) {
        appListContainer.innerHTML = `
            <div class="glass" style="padding: 40px 20px; text-align: center; border: 1px dashed rgba(239, 68, 68, 0.4); border-radius: 12px;">
                <div style="font-size: 40px; margin-bottom: 12px;">🔴</div>
                <h3 style="color: var(--text-primary); margin-bottom: 8px;">PHONE DISCONNECTED</h3>
                <p style="color: var(--text-secondary); font-size: 13px; max-width: 520px; margin: 0 auto 16px auto;">
                    Connect your physical Android phone (Vivo V2561) via USB with <strong>USB Debugging enabled</strong>.
                    PrivacyShield AI will immediately detect your device and audit all real application permissions.
                </p>
                <button class="btn btn-primary btn-sm" id="btn-reconnect-check">
                    🔄 Refresh Connection
                </button>
            </div>
        `;
        const rcBtn = document.getElementById("btn-reconnect-check");
        if (rcBtn) rcBtn.addEventListener("click", () => checkAndroidDeviceStatus(true));
        return;
    }

    const filtered = appInventory.filter(app => {
        const res = app.auditResult;
        const q = searchQuery.toLowerCase();
        if (q) {
            const matchName = app.name && app.name.toLowerCase().includes(q);
            const matchPkg = app.packageName && app.packageName.toLowerCase().includes(q);
            const matchCat = app.category && app.category.toLowerCase().includes(q);
            if (!matchName && !matchPkg && !matchCat) return false;
        }

        if (currentFilter === "all") return true;
        if (currentFilter === "camera") return app.hasCamera;
        if (currentFilter === "mic") return app.hasMicrophone;
        if (currentFilter === "critical") return res.finalScore >= 81;
        if (currentFilter === "high") return res.finalScore >= 61;
        if (currentFilter === "medium") return res.finalScore >= 31 && res.finalScore <= 60;
        if (currentFilter === "low" || currentFilter === "safe") return res.finalScore <= 30;
        return true;
    });

    if (filtered.length === 0) {
        appListContainer.innerHTML = `<div class="glass" style="padding: 24px; text-align: center; color: var(--text-secondary); font-size: 13px;">No applications found matching your criteria.</div>`;
        return;
    }

    filtered.forEach(app => {
        const res = app.auditResult;
        const m = app.sensorMatrix;
        const scoreColor = res.finalScore >= 81 ? 'var(--crimson-critical)' : (res.finalScore >= 61 ? 'var(--orange-high)' : (res.finalScore >= 31 ? 'var(--amber-warning)' : 'var(--emerald-safe)'));

        // Helper for building individual phone permission boxes
        function buildPermBox(sensor, permKey, allowToggle = false) {
            let stateClass = "perm-state-not-requested";
            let badgeClass = "badge-not-requested";
            if (sensor.requested) {
                if (sensor.status === "DECLARED") {
                    stateClass = "perm-state-granted";
                    badgeClass = "badge-declared";
                } else if (sensor.granted) {
                    stateClass = "perm-state-granted";
                    badgeClass = "badge-granted";
                } else {
                    stateClass = "perm-state-denied";
                    badgeClass = "badge-denied";
                }
            }

            let controlHtml = "";
            if (allowToggle && sensor.requested) {
                if (sensor.granted) {
                    controlHtml = `
                        <div class="phone-perm-control-row">
                            <button class="btn-perm-revoke btn-perm-action" data-pkg="${app.packageName}" data-perm="${permKey}" data-action="revoke">
                                🛑 Turn OFF ${sensor.name}
                            </button>
                        </div>
                    `;
                } else {
                    controlHtml = `
                        <div class="phone-perm-control-row">
                            <button class="btn-perm-grant btn-perm-action" data-pkg="${app.packageName}" data-perm="${permKey}" data-action="grant">
                                🟢 Allow ${sensor.name}
                            </button>
                        </div>
                    `;
                }
            }

            return `
                <div class="phone-perm-box ${stateClass}">
                    <div class="phone-perm-box-top">
                        <span class="phone-perm-name">${sensor.icon} ${sensor.name}</span>
                        <span class="phone-perm-badge ${badgeClass}">${sensor.statusText}</span>
                    </div>
                    <div class="phone-perm-details">
                        <span>Requested: <strong>${sensor.requested ? 'YES' : 'NO'}</strong></span>
                        <span>Status: <strong>${sensor.statusText}</strong></span>
                    </div>
                    ${controlHtml}
                </div>
            `;
        }

        const cameraBoxHtml = buildPermBox(m.camera, "CAMERA", true);
        const micBoxHtml = buildPermBox(m.microphone, "RECORD_AUDIO", true);
        const locBoxHtml = buildPermBox(m.location, "ACCESS_FINE_LOCATION", false);
        const netBoxHtml = buildPermBox(m.internet, "INTERNET", false);

        // Card suggestion
        let cardSuggestionText = "";
        if (m.camera.requested && m.camera.granted && m.microphone.requested && m.microphone.granted && !["CAMERA", "MESSAGING", "SOCIAL_MEDIA"].includes(app.category)) {
            cardSuggestionText = `🚨 <strong>Surveillance Vector:</strong> App has concurrent active Camera & Microphone access. Click 'Turn OFF' above to revoke on phone.`;
        } else if (m.camera.requested && !m.camera.granted) {
            cardSuggestionText = `🛡️ <strong>Camera Shielded:</strong> Camera permission is DENIED by user. Visual feed blocked on physical phone.`;
        } else if (res.finalScore >= 81) {
            cardSuggestionText = `🚨 <strong>Critical Risk (${res.finalScore}/100):</strong> Permissions exceed application domain. Tap 'Manage Permissions' to restrict on phone.`;
        } else if (res.finalScore >= 61) {
            cardSuggestionText = `🟠 <strong>High Risk (${res.finalScore}/100):</strong> Review non-essential permissions in Android Settings.`;
        } else {
            cardSuggestionText = `🟢 <strong>Privacy Baseline Normal (${res.finalScore}/100):</strong> Permissions align with declared archetype.`;
        }

        const card = document.createElement("div");
        card.className = "app-card glass";
        card.setAttribute("data-pkg", app.packageName);
        card.innerHTML = `
            <div class="app-card-top">
                <div class="app-info-left">
                    <div class="app-icon">${app.icon}</div>
                    <div>
                        <div class="app-title">${app.name}</div>
                        <div class="app-meta-text">${app.packageName} • ${app.categoryDisplay}</div>
                    </div>
                </div>
                <div class="app-right-info">
                    <div class="threat-score-gauge">
                        <span class="threat-num" style="color: ${scoreColor};">${res.finalScore}</span>
                        <span class="threat-denom">/100</span>
                    </div>
                    <span class="${res.badgeClass}">${res.riskLevel}</span>
                </div>
            </div>

            <!-- Real Phone Permissions Dashboard Section -->
            <div class="phone-perms-container">
                <div class="phone-perms-header">
                    <span class="phone-perms-title">📱 PHONE PERMISSIONS</span>
                    <span class="phone-perms-source-tag">Source: Physical Phone (ADB)</span>
                </div>
                <div class="phone-perms-grid">
                    ${cameraBoxHtml}
                    ${micBoxHtml}
                    ${locBoxHtml}
                    ${netBoxHtml}
                </div>
            </div>

            <div class="card-suggestion-box ${res.finalScore <= 30 ? 'safe' : ''}">
                ${cardSuggestionText}
            </div>

            <div class="card-actions-row">
                <button class="btn btn-secondary btn-sm btn-open-phone" data-pkg="${app.packageName}" title="Open native Android app info settings on your phone screen">
                    ⚙️ Manage Permissions
                </button>
                <button class="btn btn-outline btn-sm btn-re-audit-app" data-pkg="${app.packageName}" title="Re-query connected phone via ADB for updated permission grant state">
                    🔄 Refresh
                </button>
                <button class="btn btn-outline btn-sm btn-view-audit" title="View complete declared manifest permissions and CBPRA breakdown">
                    🔍 Full Audit
                </button>
            </div>
        `;

        // Event Listeners for Card
        card.querySelectorAll(".btn-perm-action").forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                const pkg = btn.getAttribute("data-pkg");
                const perm = btn.getAttribute("data-perm");
                const action = btn.getAttribute("data-action");
                manageAppPermission(pkg, perm, action, app.name);
            });
        });

        card.querySelector(".btn-open-phone").addEventListener("click", (e) => {
            e.stopPropagation();
            openAppSettingsOnPhone(app.packageName);
        });

        card.querySelector(".btn-re-audit-app").addEventListener("click", (e) => {
            e.stopPropagation();
            rescanSingleApp(app.packageName);
        });

        card.querySelector(".btn-view-audit").addEventListener("click", (e) => {
            e.stopPropagation();
            openAppDetail(app);
        });

        card.addEventListener("click", () => openAppDetail(app));

        appListContainer.appendChild(card);
    });
}

// Manage real phone permissions via backend ADB bridge (revoke or grant)
async function manageAppPermission(pkg, permission, action, appName = "") {
    const isRevoke = (action === "revoke");
    const permDisplay = permission === "RECORD_AUDIO" ? "Microphone" : permission.replace("android.permission.", "").replace("_", " ").toLowerCase();
    const actionLabel = isRevoke ? "Revoking" : "Granting";

    showPrivacyToast(`📱 ${actionLabel} ${permDisplay} for ${appName || pkg} on connected phone...`, "info");

    try {
        const resp = await fetch(`/api/android/app/permission/${action}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ package: pkg, permission: permission })
        });

        const data = await resp.json();

        if (data.ok && data.app) {
            updateAppInInventory(data.app);
            showPrivacyToast(data.message || `✓ Permission updated on phone!`, "success");
        } else {
            showPrivacyToast(data.message || data.reason || `❌ Unable to change permission on phone.`, "danger");
            if (data.canOpenSettings) {
                setTimeout(() => {
                    if (confirm(`${data.reason || data.message}\n\nWould you like to open Android Settings for ${appName || pkg} on your phone screen to manage it?`)) {
                        openAppSettingsOnPhone(pkg);
                    }
                }, 350);
            }
        }
    } catch (err) {
        showPrivacyToast(`❌ Communication error with ADB server.`, "danger");
    }
}

// Open application settings directly on connected physical phone
async function openAppSettingsOnPhone(pkg) {
    if (!pkg) return;
    try {
        const resp = await fetch(`/api/android/app/settings`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ package: pkg })
        });
        const data = await resp.json();
        if (data.ok) {
            showPrivacyToast(`📱 Opened Android Settings for ${pkg} on your phone screen.`, "success");
        } else {
            showPrivacyToast(`Note: Open Settings > Apps > ${pkg} > Permissions on your device.`, "info");
        }
    } catch (e) {
        showPrivacyToast(`Triggered native app settings for ${pkg}.`, "info");
    }
}

// Re-scan a single application directly from phone
async function rescanSingleApp(pkg) {
    if (!pkg) return;
    showPrivacyToast(`🔄 Re-querying phone for ${pkg}...`, "info");
    try {
        const resp = await fetch(`/api/android/rescan-package`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ package: pkg })
        });
        const data = await resp.json();
        if (data.ok && data.app) {
            updateAppInInventory(data.app);
            showPrivacyToast(`✓ Updated ${data.app.name} state from phone!`, "success");
        } else {
            showPrivacyToast(data.error || "Could not re-audit app.", "danger");
        }
    } catch (e) {
        showPrivacyToast("Error querying phone bridge.", "danger");
    }
}

// Full audit modal
function openAppDetail(app) {
    currentDetailApp = app;
    const res = app.auditResult;

    if (modalAppIcon) modalAppIcon.innerText = app.icon;
    if (modalAppTitle) modalAppTitle.innerText = app.name;
    if (modalAppCategory) modalAppCategory.innerText = `Package: ${app.packageName} • Category: ${app.categoryDisplay} • v${app.version}`;

    if (modalRiskNumber) modalRiskNumber.innerText = res.finalScore;
    if (modalRiskLevelBadge) {
        modalRiskLevelBadge.innerText = `${res.riskLevel} RISK (${res.finalScore}/100)`;
        modalRiskLevelBadge.className = res.badgeClass;
    }
    if (modalRiskDesc) {
        modalRiskDesc.innerText = `Base: ${res.baseSensitivity} pts | Mismatch: +${res.mismatchPenalty} pts | Synergies: +${res.threatPenalty} pts`;
    }

    if (modalRiskDrivers) {
        modalRiskDrivers.innerHTML = "";
        res.dominantDrivers.forEach(d => {
            const pill = document.createElement("span");
            pill.className = "driver-pill";
            pill.innerText = `• ${d}`;
            modalRiskDrivers.appendChild(pill);
        });
    }

    // Modal Sensitive Sensors Grid
    const modalSensorGrid = document.getElementById("modal-sensor-grid");
    if (modalSensorGrid) {
        modalSensorGrid.innerHTML = "";
        const m = app.sensorMatrix;
        const list = [m.camera, m.microphone, m.location, m.internet];

        list.forEach(s => {
            let badgeClass = "perm-badge-not-requested";
            let statusText = s.statusText;
            if (s.requested) {
                if (s.status === "DECLARED") {
                    badgeClass = "perm-badge-declared";
                } else if (s.granted) {
                    badgeClass = "perm-badge-granted";
                } else {
                    badgeClass = "perm-badge-denied";
                }
            }

            const item = document.createElement("div");
            item.className = "sensor-grid-item";
            item.innerHTML = `
                <div class="sensor-item-header">
                    <span>${s.icon} ${s.name}</span>
                    <span class="perm-badge ${badgeClass}">${statusText}</span>
                </div>
                <div class="sensor-item-details">
                    <span>Requested: <strong>${s.requested ? 'YES' : 'NO'}</strong></span>
                    <span>Status: <strong>${statusText}</strong></span>
                </div>
            `;
            modalSensorGrid.appendChild(item);
        });
    }

    // Threat Vectors
    if (modalThreatsContainer) {
        modalThreatsContainer.innerHTML = "";
        if (res.threatVectors.length > 0) {
            res.threatVectors.forEach(v => {
                const tCard = document.createElement("div");
                tCard.className = "threat-card";
                tCard.innerHTML = `
                    <div class="threat-title">⚠️ ${v.title}</div>
                    <div class="threat-desc">${v.desc}</div>
                `;
                modalThreatsContainer.appendChild(tCard);
            });
        }
    }

    // AI Explanation
    if (modalAiExplanation) {
        modalAiExplanation.innerHTML = app.suggestion ? app.suggestion.replace(/\n\n/g, '<br><br>') : res.aiExplanation;
    }

    if (modalRecBadge) {
        modalRecBadge.innerText = res.recommendation.action;
        modalRecBadge.className = `rec-badge ${res.recommendation.badgeClass}`;
    }
    if (modalRecText) {
        modalRecText.innerText = res.recommendation.text;
    }

    // Manifest Permissions List
    if (modalPermissionsList) {
        modalPermissionsList.innerHTML = "";
        const expectedList = CATEGORY_EXPECTED_PERMS[app.category] || [];

        app.permissions.forEach(pKey => {
            const def = KNOWN_PERMISSIONS[pKey] || { name: pKey, weight: 10, group: "System", desc: "System capability", riskDesc: "Standard risk" };
            const isExpected = expectedList.includes(pKey);
            const isNormal = ["INTERNET", "POST_NOTIFICATIONS", "VIBRATE"].includes(pKey);
            const isGranted = app.grantedPermissions.includes(pKey);

            let statusBadgeClass = "perm-badge-denied";
            let statusBadgeText = "DENIED";
            if (isNormal) {
                statusBadgeClass = "perm-badge-declared";
                statusBadgeText = "DECLARED";
            } else if (isGranted) {
                statusBadgeClass = "perm-badge-granted";
                statusBadgeText = "GRANTED";
            }

            const pItem = document.createElement("div");
            pItem.className = "perm-item";
            pItem.innerHTML = `
                <div class="perm-header">
                    <div>
                        <span class="perm-name">${def.name}</span>
                        <span style="font-size: 10px; color: var(--text-muted); margin-left: 6px;">(${pKey})</span>
                    </div>
                    <div style="display: flex; gap: 6px; align-items: center;">
                        <span class="perm-badge ${statusBadgeClass}">${statusBadgeText}</span>
                        ${!isExpected ? '<span class="perm-mismatch-tag">MISMATCH</span>' : '<span style="color: var(--emerald-safe); font-size: 10px; font-weight: 700;">EXPECTED</span>'}
                    </div>
                </div>
                <div class="perm-desc">
                    Requested: <strong>YES</strong> • Group: ${def.group} • Level: <strong>${isNormal ? 'NORMAL' : 'DANGEROUS'}</strong> • ${def.desc}
                </div>
            `;
            modalPermissionsList.appendChild(pItem);
        });
    }

    if (detailOverlay) detailOverlay.classList.add("active");
}

// Window Focus Listener: Detects user return from phone settings screen
window.addEventListener("focus", () => {
    if (waitingForReturnFromSettings) {
        const pkg = waitingForReturnFromSettings;
        waitingForReturnFromSettings = null;
        setTimeout(() => {
            rescanSingleApp(pkg);
        }, 800);
    }
});

if (modalClose) modalClose.addEventListener("click", () => detailOverlay.classList.remove("active"));

if (btnSettingsRedirect) {
    btnSettingsRedirect.addEventListener("click", () => {
        if (currentDetailApp) {
            waitingForReturnFromSettings = currentDetailApp.packageName;
            openAppSettingsOnPhone(currentDetailApp.packageName);
        }
    });
}

if (btnRescanApp) {
    btnRescanApp.addEventListener("click", () => {
        if (currentDetailApp) {
            rescanSingleApp(currentDetailApp.packageName);
        }
    });
}

// Scan downloaded apps from the connected physical Android phone
async function scanRealAndroidPhone() {
    if (scanOverlay) scanOverlay.classList.add("active");
    if (scanProgressBar) scanProgressBar.style.width = "0%";
    if (scanStepText) scanStepText.innerText = "Querying connected Android mobile (ADB)...";

    const steps = [
        "Connecting to physical Android device via ADB bridge...",
        "Querying PackageManager for installed 3rd-party applications...",
        "Dumping Android manifest declarations for Camera & Microphone...",
        "Inspecting runtime grant states (dumpsys package)...",
        "Executing CBPRA Context-Permission Matrix matching...",
        "Synthesizing threat scores and actionable security suggestions..."
    ];
    let stepIdx = 0;
    const progressTimer = setInterval(() => {
        if (stepIdx < steps.length) {
            if (scanStepText) scanStepText.innerText = steps[stepIdx];
            if (scanProgressBar) scanProgressBar.style.width = `${((stepIdx + 1) / steps.length) * 90}%`;
            stepIdx++;
        }
    }, 400);

    try {
        const resp = await fetch("/api/android/scan");
        clearInterval(progressTimer);
        const data = await resp.json();

        if (scanProgressBar) scanProgressBar.style.width = "100%";
        if (scanStepText) scanStepText.innerText = "Audit complete!";

        setTimeout(() => {
            if (scanOverlay) scanOverlay.classList.remove("active");

            if (data.ok && data.apps && data.apps.length > 0) {
                isRealPhoneMode = true;
                appInventory = data.apps.map(normalizeAppAudit);
                lastAuditTimestamp = new Date().toLocaleTimeString();

                if (data.device) {
                    connectedAndroidDevice = data.device;
                    if (specDeviceName) specDeviceName.innerText = data.device.name || "Vivo V2561";
                    if (specAndroidVer) specAndroidVer.innerText = `Android ${data.device.android_version}`;
                    if (specAdbStatus) specAdbStatus.innerText = "Connected";
                    if (specLastAudit) specLastAudit.innerText = lastAuditTimestamp;
                    if (specAppsCount) specAppsCount.innerText = `${appInventory.length} Packages`;
                }

                if (deviceStatusDot) deviceStatusDot.className = "indicator green";
                if (deviceStatusText) deviceStatusText.innerHTML = "<strong>🟢 REAL PHONE DATA</strong>";
                if (deviceStatusPill) {
                    deviceStatusPill.style.borderColor = "var(--emerald-safe)";
                    deviceStatusPill.style.background = "rgba(16, 185, 129, 0.15)";
                }

                if (appListHeading) appListHeading.innerText = `Real Android Apps (${appInventory.length} Packages Audited)`;
                if (appListSubheading) appListSubheading.innerText = `Live phone permission grants and CBPRA threat analysis on ${connectedAndroidDevice ? connectedAndroidDevice.name : 'Connected Phone'}`;

                updateDashboardUI();
                showPrivacyToast(`🟢 Audited ${appInventory.length} applications from connected phone!`, "success");
            } else {
                isRealPhoneMode = false;
                connectedAndroidDevice = null;
                appInventory = [];
                updateDeviceStatusDisconnected();
                updateDashboardUI();
                showPrivacyToast(data.message || "Phone not connected via ADB.", "danger");
            }
        }, 400);
    } catch (err) {
        clearInterval(progressTimer);
        if (scanOverlay) scanOverlay.classList.remove("active");
        showPrivacyToast("Could not communicate with Python ADB server.", "danger");
    }
}

function updateDeviceStatusDisconnected() {
    if (deviceStatusDot) deviceStatusDot.className = "indicator red";
    if (deviceStatusText) deviceStatusText.innerHTML = "<strong>🔴 PHONE DISCONNECTED</strong>";
    if (deviceStatusPill) {
        deviceStatusPill.style.borderColor = "var(--crimson-critical)";
        deviceStatusPill.style.background = "rgba(239, 68, 68, 0.12)";
    }
    if (deviceMetaSubtitle) deviceMetaSubtitle.innerText = "No phone detected via ADB. Connect your Android phone with USB Debugging enabled to audit live application permissions.";
    if (specDeviceName) specDeviceName.innerText = "No Phone Connected";
    if (specAndroidVer) specAndroidVer.innerText = "--";
    if (specAdbStatus) specAdbStatus.innerText = "Disconnected";
    if (specLastAudit) specLastAudit.innerText = "--:--:--";
    if (specAppsCount) specAppsCount.innerText = "0 Packages";

    if (appListHeading) appListHeading.innerText = "Application Permissions";
    if (appListSubheading) appListSubheading.innerText = "Connect phone via USB to inspect live permission grants.";
}

// Check ADB connection status periodically
async function checkAndroidDeviceStatus(isManual = false) {
    try {
        const resp = await fetch("/api/android/status");
        if (!resp.ok) return;
        const data = await resp.json();

        if (data.connected && data.device) {
            const wasDisconnected = !connectedAndroidDevice;
            connectedAndroidDevice = data.device;
            isRealPhoneMode = true;

            if (deviceStatusDot) deviceStatusDot.className = "indicator green";
            if (deviceStatusText) deviceStatusText.innerHTML = "<strong>🟢 REAL PHONE DATA</strong>";
            if (deviceStatusPill) {
                deviceStatusPill.style.borderColor = "var(--emerald-safe)";
                deviceStatusPill.style.background = "rgba(16, 185, 129, 0.15)";
            }
            if (deviceMetaSubtitle) deviceMetaSubtitle.innerText = `Connected to ${data.device.name} (Android ${data.device.android_version}). Permission audit is live from physical phone.`;

            if (specDeviceName) specDeviceName.innerText = data.device.name || "Vivo V2561";
            if (specAndroidVer) specAndroidVer.innerText = `Android ${data.device.android_version}`;
            if (specAdbStatus) specAdbStatus.innerText = "Connected";
            if (specAppsCount) specAppsCount.innerText = `${data.device.downloaded_apps_count} Packages`;

            if (isManual) {
                showPrivacyToast(`Connected to ${data.device.name}! Performing fresh scan...`, "success");
                scanRealAndroidPhone();
            } else if (wasDisconnected || appInventory.length === 0) {
                scanRealAndroidPhone();
            }
        } else {
            if (connectedAndroidDevice || isRealPhoneMode) {
                connectedAndroidDevice = null;
                isRealPhoneMode = false;
                appInventory = [];
                updateDeviceStatusDisconnected();
                updateDashboardUI();
                showPrivacyToast("🔴 Phone Disconnected", "danger");
            } else {
                updateDeviceStatusDisconnected();
            }
        }
    } catch (e) {
        updateDeviceStatusDisconnected();
    }
}

// Filter Tabs
document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        currentFilter = btn.dataset.filter;
        renderAppList();
    });
});

// App Search input
if (appSearchInput) {
    appSearchInput.addEventListener("input", (e) => {
        searchQuery = e.target.value.trim();
        renderAppList();
    });
}

// Action Bar Buttons
if (btnScanRealPhone) btnScanRealPhone.addEventListener("click", () => scanRealAndroidPhone());
if (btnScan) btnScan.addEventListener("click", () => scanRealAndroidPhone());
if (btnRefreshDevice) btnRefreshDevice.addEventListener("click", () => checkAndroidDeviceStatus(true));

// Close on outside click
window.addEventListener("click", (e) => {
    if (detailOverlay && e.target === detailOverlay) detailOverlay.classList.remove("active");
});

// Initial boot
checkAndroidDeviceStatus();
setInterval(() => checkAndroidDeviceStatus(false), 3500);
