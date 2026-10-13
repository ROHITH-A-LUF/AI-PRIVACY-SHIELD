package com.privacyshield.ai.core.cbpra

import com.privacyshield.ai.core.model.AppCategory
import com.privacyshield.ai.core.model.RiskLevel
import com.privacyshield.ai.core.model.ThreatVector

object ThreatVectorDetector {

    /**
     * Identifies synergistic threat combinations where the combination of permissions creates
     * an elevated data leakage or covert monitoring vector beyond individual permission risks.
     */
    fun detectThreatVectors(
        category: AppCategory,
        requestedPermissions: Set<String>,
        grantedPermissions: Set<String>
    ): List<ThreatVector> {
        val detected = mutableListOf<ThreatVector>()
        val hasInternet = requestedPermissions.contains("android.permission.INTERNET")

        // Threat 1: Credential & 2FA OTP Interception + Exfiltration Vector
        val hasSmsRead = requestedPermissions.contains("android.permission.READ_SMS") ||
                requestedPermissions.contains("android.permission.RECEIVE_SMS")
        if (hasSmsRead && hasInternet && category != AppCategory.MESSAGING) {
            val isGranted = (grantedPermissions.contains("android.permission.READ_SMS") ||
                    grantedPermissions.contains("android.permission.RECEIVE_SMS")) &&
                    grantedPermissions.contains("android.permission.INTERNET")

            detected.add(
                ThreatVector(
                    id = "THREAT_OTP_EXFILTRATION",
                    title = "Credential & OTP Interception Vector",
                    description = "Application possesses both SMS reading capabilities and open Internet access outside a messaging context. This combination allows reading bank/login verification SMS codes and transmitting them off-device.",
                    participatingPermissions = listOf("READ_SMS / RECEIVE_SMS", "INTERNET"),
                    threatSeverity = RiskLevel.CRITICAL,
                    penaltyScore = if (isGranted) 30 else 20
                )
            )
        }

        // Threat 2: Surreptitious Audio/Visual Surveillance Vector
        val hasCamera = requestedPermissions.contains("android.permission.CAMERA")
        val hasMic = requestedPermissions.contains("android.permission.RECORD_AUDIO")
        val hasBgLocation = requestedPermissions.contains("android.permission.ACCESS_BACKGROUND_LOCATION")
        
        if (hasCamera && hasMic && category !in listOf(AppCategory.CAMERA, AppCategory.MESSAGING, AppCategory.SOCIAL_MEDIA, AppCategory.VIDEO_PLAYER)) {
            val isBothGranted = grantedPermissions.contains("android.permission.CAMERA") &&
                    grantedPermissions.contains("android.permission.RECORD_AUDIO")

            detected.add(
                ThreatVector(
                    id = "THREAT_AV_SURVEILLANCE",
                    title = "Surreptitious Audio/Visual Surveillance Vector",
                    description = "Application bundles concurrent Camera and Microphone access in an unexpected context. Capable of simultaneous acoustic and visual recording.",
                    participatingPermissions = listOf("CAMERA", "RECORD_AUDIO"),
                    threatSeverity = RiskLevel.HIGH,
                    penaltyScore = if (isBothGranted) 25 else 15
                )
            )
        }

        // Threat 3: Social Graph & Calling Pattern Mining Vector
        val hasContacts = requestedPermissions.contains("android.permission.READ_CONTACTS")
        val hasCallLog = requestedPermissions.contains("android.permission.READ_CALL_LOG")
        if (hasContacts && hasCallLog && hasInternet && category !in listOf(AppCategory.MESSAGING, AppCategory.SOCIAL_MEDIA)) {
            val isGranted = grantedPermissions.contains("android.permission.READ_CONTACTS") &&
                    grantedPermissions.contains("android.permission.READ_CALL_LOG")
            detected.add(
                ThreatVector(
                    id = "THREAT_SOCIAL_GRAPH_MINING",
                    title = "Social Graph & Telephony Telemetry Harvester",
                    description = "Combines address book contacts, call logs, and internet access. Exposes your personal network and communication frequencies to external profiling.",
                    participatingPermissions = listOf("READ_CONTACTS", "READ_CALL_LOG", "INTERNET"),
                    threatSeverity = RiskLevel.CRITICAL,
                    penaltyScore = if (isGranted) 25 else 18
                )
            )
        }

        // Threat 4: Autonomous 24/7 Geolocation Profiling
        if (hasBgLocation && hasInternet && category !in listOf(AppCategory.NAVIGATION_MAPS, AppCategory.FITNESS_HEALTH)) {
            val isGranted = grantedPermissions.contains("android.permission.ACCESS_BACKGROUND_LOCATION")
            detected.add(
                ThreatVector(
                    id = "THREAT_BG_LOCATION_TRACKING",
                    title = "Autonomous 24/7 Geolocation Profiling",
                    description = "Continuous background location tracking requested outside navigation/fitness domains. Allows harvesting daily physical travel routines and sensitive destinations without user interaction.",
                    participatingPermissions = listOf("ACCESS_BACKGROUND_LOCATION", "INTERNET"),
                    threatSeverity = RiskLevel.CRITICAL,
                    penaltyScore = if (isGranted) 25 else 15
                )
            )
        }

        // Threat 5: Persistent Device & User Identity Fingerprinting
        val hasPhoneState = requestedPermissions.contains("android.permission.READ_PHONE_STATE")
        if (hasPhoneState && hasContacts && hasInternet && category !in listOf(AppCategory.MESSAGING, AppCategory.SYSTEM_UTILITY)) {
            val isGranted = grantedPermissions.contains("android.permission.READ_PHONE_STATE") &&
                    grantedPermissions.contains("android.permission.READ_CONTACTS")
            detected.add(
                ThreatVector(
                    id = "THREAT_IDENTITY_FINGERPRINTING",
                    title = "Persistent Identity & Hardware Fingerprinting",
                    description = "Reads cellular hardware state alongside contacts with network egress. Can uniquely fingerprint your physical device and associate it with real-world identities across apps.",
                    participatingPermissions = listOf("READ_PHONE_STATE", "READ_CONTACTS", "INTERNET"),
                    threatSeverity = RiskLevel.HIGH,
                    penaltyScore = if (isGranted) 20 else 12
                )
            )
        }

        return detected
    }
}
