// PrivacyShield AI — Context-Based Permission Risk Assessment (CBPRA) Web Engine

// Global Knowledge Base of Permissions
const KNOWN_PERMISSIONS = {
    "CAMERA": { name: "Camera", weight: 25, group: "Media", desc: "Accesses visual camera feed & photos", riskDesc: "Unwarranted visual surveillance." },
    "RECORD_AUDIO": { name: "Microphone", weight: 25, group: "Audio", desc: "Records ambient acoustic audio", riskDesc: "Secret audio eavesdropping." },
    "ACCESS_FINE_LOCATION": { name: "GPS Location", weight: 25, group: "Location", desc: "Precise physical GPS coordinates", riskDesc: "Real-time geographical tracking & destination profiling." },
    "ACCESS_BACKGROUND_LOCATION": { name: "24/7 Background Location", weight: 35, group: "Location", desc: "Continuous passive GPS tracking", riskDesc: "24/7 autonomous mobility breadcrumb tracking." },
    "READ_CONTACTS": { name: "Read Contacts", weight: 25, group: "Social Graph", desc: "Reads entire address book & phone numbers", riskDesc: "Social graph harvesting & contacts scraping." },
    "READ_SMS": { name: "Read SMS / 2FA OTP", weight: 35, group: "Communications", desc: "Reads SMS inbox & banking verification codes", riskDesc: "Interception of banking OTPs and private SMS." },
    "RECEIVE_SMS": { name: "Receive Live SMS", weight: 35, group: "Communications", desc: "Processes live incoming text messages", riskDesc: "Real-time 2FA interception before user awareness." },
    "READ_CALL_LOG": { name: "Read Call Logs", weight: 30, group: "Telephony", desc: "Reads complete call duration & timestamps", riskDesc: "Personal communication profiling." },
    "READ_PHONE_STATE": { name: "Device ID / Phone State", weight: 20, group: "Identity", desc: "SIM status & cellular hardware identifiers", riskDesc: "Persistent device fingerprinting across apps." },
    "READ_EXTERNAL_STORAGE": { name: "Read Shared Files", weight: 15, group: "Storage", desc: "Accesses downloaded docs and photos", riskDesc: "Inspection of saved files and screenshots." },
    "INTERNET": { name: "Internet Network Egress", weight: 5, group: "Network", desc: "Opens network sockets to cloud servers", riskDesc: "Primary data egress channel for exfiltration." },
    "POST_NOTIFICATIONS": { name: "Notifications", weight: 5, group: "UI", desc: "Displays alerts on lock screen", riskDesc: "Commercial push spamming." },
    "VIBRATE": { name: "Vibration Haptics", weight: 2, group: "Hardware", desc: "Controls haptic motor", riskDesc: "Harmless utility." }
};

// Expected Permission Matrix per Category Baseline
const CATEGORY_EXPECTED_PERMS = {
    "CALCULATOR": ["VIBRATE", "INTERNET"],
    "FLASHLIGHT": ["CAMERA", "VIBRATE"],
    "CAMERA": ["CAMERA", "RECORD_AUDIO", "READ_EXTERNAL_STORAGE", "ACCESS_FINE_LOCATION", "VIBRATE"],
    "NAVIGATION_MAPS": ["ACCESS_FINE_LOCATION", "ACCESS_BACKGROUND_LOCATION", "INTERNET", "RECORD_AUDIO", "POST_NOTIFICATIONS", "VIBRATE"],
    "MESSAGING": ["INTERNET", "READ_CONTACTS", "CAMERA", "RECORD_AUDIO", "READ_EXTERNAL_STORAGE", "POST_NOTIFICATIONS", "READ_SMS", "RECEIVE_SMS", "VIBRATE"],
    "SOCIAL_MEDIA": ["INTERNET", "READ_CONTACTS", "CAMERA", "RECORD_AUDIO", "READ_EXTERNAL_STORAGE", "ACCESS_FINE_LOCATION", "POST_NOTIFICATIONS", "VIBRATE"],
    "BANKING_FINANCE": ["INTERNET", "CAMERA", "POST_NOTIFICATIONS", "ACCESS_FINE_LOCATION", "VIBRATE"],
    "FITNESS_HEALTH": ["INTERNET", "ACCESS_FINE_LOCATION", "ACCESS_BACKGROUND_LOCATION", "POST_NOTIFICATIONS"],
    "NOTES_MEMO": ["VIBRATE", "READ_EXTERNAL_STORAGE", "CAMERA", "RECORD_AUDIO", "INTERNET"],
    "GAMING": ["INTERNET", "VIBRATE", "POST_NOTIFICATIONS"]
};

// Installed Application Inventory Dataset
let appInventory = [
    {
        id: "smart-calc",
        name: "Smart Calculator Pro",
        category: "CALCULATOR",
        categoryDisplay: "Calculator 🧮",
        icon: "🧮",
        version: "2.4.1",
        permissions: ["INTERNET", "CAMERA", "RECORD_AUDIO", "ACCESS_FINE_LOCATION", "READ_SMS"]
    },
    {
        id: "flashlight-plus",
        name: "Flashlight Plus Torch",
        category: "FLASHLIGHT",
        categoryDisplay: "Flashlight / Torch 🔦",
        icon: "🔦",
        version: "1.1.0",
        permissions: ["CAMERA", "RECORD_AUDIO", "ACCESS_FINE_LOCATION", "INTERNET"]
    },
    {
        id: "secure-bank",
        name: "Apex Mobile Banking",
        category: "BANKING_FINANCE",
        categoryDisplay: "Banking & Finance 💳",
        icon: "💳",
        version: "5.0.3",
        permissions: ["INTERNET", "CAMERA", "ACCESS_FINE_LOCATION", "POST_NOTIFICATIONS"]
    },
    {
        id: "pro-cam",
        name: "Pro HDR Camera",
        category: "CAMERA",
        categoryDisplay: "Camera & Photo 📷",
        icon: "📷",
        version: "3.2.0",
        permissions: ["CAMERA", "RECORD_AUDIO", "READ_EXTERNAL_STORAGE", "ACCESS_FINE_LOCATION"]
    },
    {
        id: "social-hub",
        name: "SocialHub Live",
        category: "SOCIAL_MEDIA",
        categoryDisplay: "Social Networking 👥",
        icon: "👥",
        version: "12.8.4",
        permissions: ["INTERNET", "CAMERA", "READ_CONTACTS", "ACCESS_BACKGROUND_LOCATION", "POST_NOTIFICATIONS"]
    },
    {
        id: "offline-notes",
        name: "Minimalist Notes",
        category: "NOTES_MEMO",
        categoryDisplay: "Notes & Memos 📝",
        icon: "📝",
        version: "1.0.4",
        permissions: ["VIBRATE", "READ_EXTERNAL_STORAGE"]
    }
];

// Core CBPRA Calculation Implementation
function runCbpraAudit(category, permissionKeys) {
    const expectedList = CATEGORY_EXPECTED_PERMS[category] || ["INTERNET", "VIBRATE"];
    let baseSensitivity = 0;
    let mismatchPenalty = 0;
    let drivers = [];
    let unexpectedPerms = [];

    permissionKeys.forEach(pKey => {
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
    let threatVectors = [];
    let threatPenalty = 0;

    const hasInternet = permissionKeys.includes("INTERNET");
    const hasSms = permissionKeys.includes("READ_SMS") || permissionKeys.includes("RECEIVE_SMS");
    const hasCamera = permissionKeys.includes("CAMERA");
    const hasMic = permissionKeys.includes("RECORD_AUDIO");
    const hasBgGps = permissionKeys.includes("ACCESS_BACKGROUND_LOCATION");
    const hasContacts = permissionKeys.includes("READ_CONTACTS");

    if (hasSms && hasInternet && category !== "MESSAGING") {
        threatVectors.push({
            id: "THREAT_OTP_EXFILTRATION",
            title: "Credential & 2FA OTP Interception Vector",
            desc: "Possesses SMS reading capabilities alongside Internet egress outside messaging context. Can intercept banking verification OTPs and exfiltrate them."
        });
        threatPenalty += 30;
        drivers.push("Synergistic Threat: OTP Exfiltration Vector");
    }

    if (hasCamera && hasMic && !["CAMERA", "MESSAGING", "SOCIAL_MEDIA"].includes(category)) {
        threatVectors.push({
            id: "THREAT_AV_SURVEILLANCE",
            title: "Surreptitious Audio/Visual Surveillance Vector",
            desc: "Bundles concurrent Camera and Microphone access in an unexpected context. Capable of simultaneous room recording."
        });
        threatPenalty += 25;
        drivers.push("Synergistic Threat: Audio/Visual Surveillance Vector");
    }

    if (hasBgGps && hasInternet && !["NAVIGATION_MAPS", "FITNESS_HEALTH"].includes(category)) {
        threatVectors.push({
            id: "THREAT_BG_LOCATION",
            title: "24/7 Persistent Geolocation Tracking Vector",
            desc: "Continuous background tracking outside navigation/fitness. Harvests daily travel patterns."
        });
        threatPenalty += 25;
        drivers.push("Synergistic Threat: 24/7 Geolocation Profiling");
    }

    // Density factor
    let densityPenalty = permissionKeys.length > 5 ? 10 : 0;

    const rawScore = baseSensitivity + mismatchPenalty + threatPenalty + densityPenalty;
    const finalScore = Math.min(100, Math.round(rawScore));

    let riskLevel = "LOW";
    let badgeClass = "badge-safe";
    let recBadgeClass = "rec-allow";
    let recAction = "ALLOW";
    let recText = "Permissions appear standard and appropriate for this application category.";

    if (finalScore >= 81) {
        riskLevel = "CRITICAL";
        badgeClass = "badge-critical";
        recBadgeClass = "rec-deny";
        recAction = "REVOKE IMMEDIATELY";
        recText = `Severe privacy mismatch detected. Immediately revoke permissions (${unexpectedPerms.join(", ")}) in System Settings.`;
    } else if (finalScore >= 61) {
        riskLevel = "HIGH";
        badgeClass = "badge-high";
        recBadgeClass = "rec-deny";
        recAction = "DENY UNNECESSARY PERMS";
        recText = `Application requests permissions not required for its core functionality (${unexpectedPerms.join(", ")}). Deny these permissions.`;
    } else if (finalScore >= 31) {
        riskLevel = "MEDIUM";
        badgeClass = "badge-medium";
        recBadgeClass = "rec-allow-once";
        recAction = "ALLOW ONCE / REVIEW";
        recText = "Application requests secondary permissions. Consider granting 'Only while in use'.";
    }

    // Generate Natural Language AI Explanation
    let aiExplanation = "";
    if (riskLevel === "LOW") {
        aiExplanation = `This application operates within normal privacy parameters for a ${category} application. All requested permissions align with expected functional requirements.`;
    } else if (riskLevel === "MEDIUM") {
        aiExplanation = `Moderate privacy considerations. Requesting ${unexpectedPerms.join(", ")} represents slight functional drift.`;
    } else if (riskLevel === "HIGH") {
        aiExplanation = `High privacy risk. A ${category} application has no legitimate reason to access ${unexpectedPerms.join(", ")}. Granting these permissions exposes sensitive device boundaries without utility benefit.`;
    } else {
        aiExplanation = `CRITICAL PRIVACY ALERT: Severe risk score (${finalScore}/100). The combination of permissions requested (${unexpectedPerms.join(", ")}) introduces potential surveillance or data exfiltration channels.`;
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
            text: recText
        }
    };
}

// Attach audit outcomes to inventory
function auditAllInventory() {
    appInventory.forEach(app => {
        app.auditResult = runCbpraAudit(app.category, app.permissions);
    });
}

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

// Simulator Elements
const btnOpenSimulator = document.getElementById("btn-open-simulator");
const simulatorOverlay = document.getElementById("simulator-overlay");
const simulatorClose = document.getElementById("simulator-close");
const simCategorySelect = document.getElementById("sim-category-select");
const simPermToggles = document.getElementById("sim-perm-toggles");
const simScoreNumber = document.getElementById("sim-score-number");
const simScoreCircle = document.getElementById("sim-score-circle");
const simRiskBadge = document.getElementById("sim-risk-badge");
const simBaseScore = document.getElementById("sim-base-score");
const simMismatchScore = document.getElementById("sim-mismatch-score");
const simThreatScore = document.getElementById("sim-threat-score");
const simFinalScore = document.getElementById("sim-final-score");
const simAiExplanation = document.getElementById("sim-ai-explanation");
const simRecBadge = document.getElementById("sim-rec-badge");
const simRecText = document.getElementById("sim-rec-text");

// Patent Modal Elements
const btnPatentInfo = document.getElementById("btn-patent-info");
const btnConnectCalculator = document.getElementById("btn-connect-calculator");
const patentOverlay = document.getElementById("patent-overlay");
const patentClose = document.getElementById("patent-close");

let currentFilter = "all";
let simActivePerms = new Set(["CAMERA", "RECORD_AUDIO", "INTERNET"]);

// Calculate and render dashboard stats
function updateDashboardUI() {
    auditAllInventory();

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
    const healthScore = Math.max(0, Math.min(100, Math.round(100 - avgRisk)));

    // Animate score value
    scoreValue.innerText = healthScore;

    // Progress Ring offset: 264 is perimeter
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

    statScanned.innerText = totalApps;
    statSensitive.innerText = sensitiveCount;
    statDrift.innerText = mismatchCount;
    statThreats.innerText = threatsCount;

    renderAppList();
}

// Render app cards
function renderAppList() {
    appListContainer.innerHTML = "";

    const filtered = appInventory.filter(app => {
        if (currentFilter === "all") return true;
        if (currentFilter === "critical") return app.auditResult.riskLevel === "CRITICAL";
        if (currentFilter === "high") return app.auditResult.riskLevel === "HIGH";
        if (currentFilter === "medium") return app.auditResult.riskLevel === "MEDIUM";
        if (currentFilter === "low") return app.auditResult.riskLevel === "LOW";
        return true;
    });

    if (filtered.length === 0) {
        appListContainer.innerHTML = `<div class="glass" style="padding: 24px; text-align: center; color: var(--text-secondary); font-size: 13px;">No applications match the selected filter.</div>`;
        return;
    }

    filtered.forEach(app => {
        const res = app.auditResult;
        const card = document.createElement("div");
        card.className = "app-card glass";
        card.innerHTML = `
            <div class="app-info-left">
                <div class="app-icon">${app.icon}</div>
                <div>
                    <div class="app-title">${app.name}</div>
                    <div class="app-meta-text">${app.categoryDisplay} • ${app.permissions.length} perms</div>
                </div>
            </div>
            <div class="app-right-info">
                <span class="${res.badgeClass}">${res.riskLevel} (${res.finalScore}/100)</span>
                <span style="color: var(--text-muted); font-size: 14px;">➔</span>
            </div>
        `;
        card.addEventListener("click", () => openAppDetail(app));
        app.element = card;
        appListContainer.appendChild(card);
    });
}

// Open App Details Modal
function openAppDetail(app) {
    const res = app.auditResult;
    modalAppIcon.innerText = app.icon;
    modalAppTitle.innerText = app.name;
    modalAppCategory.innerText = `Category: ${app.categoryDisplay} • v${app.version}`;

    modalRiskNumber.innerText = res.finalScore;
    modalRiskLevelBadge.innerText = `${res.riskLevel} RISK`;
    modalRiskLevelBadge.className = res.badgeClass;
    modalRiskDesc.innerText = `Base: ${res.baseSensitivity} pts | Mismatch: +${res.mismatchPenalty} pts | Combos: +${res.threatPenalty} pts`;

    modalRiskDrivers.innerHTML = "";
    res.dominantDrivers.forEach(d => {
        const pill = document.createElement("span");
        pill.className = "driver-pill";
        pill.innerText = `• ${d}`;
        modalRiskDrivers.appendChild(pill);
    });

    // Threat Vectors
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

    modalAiExplanation.innerText = res.aiExplanation;

    modalRecBadge.innerText = res.recommendation.action;
    modalRecBadge.className = `rec-badge ${res.recommendation.badgeClass}`;
    modalRecText.innerText = res.recommendation.text;

    // Permissions List
    modalPermissionsList.innerHTML = "";
    const expectedList = CATEGORY_EXPECTED_PERMS[app.category] || [];
    app.permissions.forEach(pKey => {
        const def = KNOWN_PERMISSIONS[pKey];
        if (!def) return;
        const isExpected = expectedList.includes(pKey);

        const pItem = document.createElement("div");
        pItem.className = "perm-item";
        pItem.innerHTML = `
            <div class="perm-header">
                <span class="perm-name">${def.name}</span>
                <div>
                    ${!isExpected ? '<span class="perm-mismatch-tag">CONTEXT MISMATCH</span>' : '<span style="color: var(--emerald-safe); font-size: 10px; font-weight: 700;">EXPECTED</span>'}
                </div>
            </div>
            <div class="perm-desc">Group: ${def.group} • ${def.desc}</div>
            <div style="font-size: 10px; color: #FCA5A5; margin-top: 2px;">Risk: ${def.riskDesc}</div>
        `;
        modalPermissionsList.appendChild(pItem);
    });

    detailOverlay.classList.add("active");
}

// Live Simulator Setup
function setupSimulator() {
    simPermToggles.innerHTML = "";

    Object.keys(KNOWN_PERMISSIONS).forEach(pKey => {
        const def = KNOWN_PERMISSIONS[pKey];
        const btn = document.createElement("button");
        btn.className = `sim-toggle-btn ${simActivePerms.has(pKey) ? "active" : ""}`;
        btn.innerHTML = `
            <span>${def.name}</span>
            <span style="font-size: 9px; opacity: 0.7;">${def.weight}p</span>
        `;
        btn.addEventListener("click", () => {
            if (simActivePerms.has(pKey)) {
                simActivePerms.delete(pKey);
                btn.classList.remove("active");
            } else {
                simActivePerms.add(pKey);
                btn.classList.add("active");
            }
            computeSimScore();
        });
        simPermToggles.appendChild(btn);
    });

    simCategorySelect.addEventListener("change", computeSimScore);
    computeSimScore();
}

function computeSimScore() {
    const selectedCat = simCategorySelect.value;
    const permsArray = Array.from(simActivePerms);
    const res = runCbpraAudit(selectedCat, permsArray);

    simScoreNumber.innerText = res.finalScore;
    simRiskBadge.innerText = `${res.riskLevel} RISK`;
    simRiskBadge.className = res.badgeClass;

    if (res.finalScore >= 81) {
        simScoreCircle.style.borderColor = "var(--crimson-critical)";
        simScoreCircle.style.background = "rgba(239, 68, 68, 0.15)";
    } else if (res.finalScore >= 61) {
        simScoreCircle.style.borderColor = "var(--orange-high)";
        simScoreCircle.style.background = "rgba(249, 115, 22, 0.15)";
    } else if (res.finalScore >= 31) {
        simScoreCircle.style.borderColor = "var(--amber-warning)";
        simScoreCircle.style.background = "rgba(245, 158, 11, 0.15)";
    } else {
        simScoreCircle.style.borderColor = "var(--emerald-safe)";
        simScoreCircle.style.background = "rgba(16, 185, 129, 0.15)";
    }

    simBaseScore.innerText = `${res.baseSensitivity} pts`;
    simMismatchScore.innerText = `+${res.mismatchPenalty} pts`;
    simThreatScore.innerText = `+${res.threatPenalty} pts`;
    simFinalScore.innerText = `${res.finalScore} / 100`;

    simAiExplanation.innerText = res.aiExplanation;
    simRecBadge.innerText = res.recommendation.action;
    simRecBadge.className = `rec-badge ${res.recommendation.badgeClass}`;
    simRecText.innerText = res.recommendation.text;
}

// Filter Tab buttons
document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        currentFilter = btn.dataset.filter;
        renderAppList();
    });
});

// Scan Animation
btnScan.addEventListener("click", () => {
    scanOverlay.classList.add("active");
    scanProgressBar.style.width = "0%";
    const steps = [
        "Enumerating PackageManager installed packages...",
        "Resolving 3-tier application contextual taxonomies...",
        "Executing CBPRA Context-Permission Matrix matching...",
        "Synthesizing deterministic AI explanations & recommendations..."
    ];
    let stepIndex = 0;

    const interval = setInterval(() => {
        if (stepIndex < steps.length) {
            scanStepText.innerText = steps[stepIndex];
            scanProgressBar.style.width = `${((stepIndex + 1) / steps.length) * 100}%`;
            stepIndex++;
        } else {
            clearInterval(interval);
            setTimeout(() => {
                scanOverlay.classList.remove("active");
                updateDashboardUI();
            }, 400);
        }
    }, 450);
});

// Modal Listeners
modalClose.addEventListener("click", () => detailOverlay.classList.remove("active"));
btnSettingsRedirect.addEventListener("click", () => {
    alert("In standard Android deployment, PrivacyShield AI initiates an Intent to Settings.ACTION_APPLICATION_DETAILS_SETTINGS, opening the device's native app permission management panel.");
});

btnOpenSimulator.addEventListener("click", () => {
    setupSimulator();
    simulatorOverlay.classList.add("active");
});
simulatorClose.addEventListener("click", () => simulatorOverlay.classList.remove("active"));

btnPatentInfo.addEventListener("click", () => patentOverlay.classList.add("active"));
patentClose.addEventListener("click", () => patentOverlay.classList.remove("active"));

btnConnectCalculator.addEventListener("click", () => {
    const calcApp = appInventory.find(a => a.id === "smart-calc");
    if (calcApp) {
        currentFilter = "all";
        document.querySelectorAll(".tab-btn").forEach(b => {
            b.classList.toggle("active", b.dataset.filter === "all");
        });
        updateDashboardUI();
        openAppDetail(calcApp);
        calcApp.element?.scrollIntoView?.({ behavior: "smooth", block: "center" });
    }
});

// Close on outside click
window.addEventListener("click", (e) => {
    if (e.target === detailOverlay) detailOverlay.classList.remove("active");
    if (e.target === simulatorOverlay) simulatorOverlay.classList.remove("active");
    if (e.target === patentOverlay) patentOverlay.classList.remove("active");
});

// Initial boot
updateDashboardUI();
