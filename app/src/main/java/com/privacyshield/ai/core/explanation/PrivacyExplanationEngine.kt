package com.privacyshield.ai.core.explanation

import com.privacyshield.ai.core.model.AppCategory
import com.privacyshield.ai.core.model.PermissionItem
import com.privacyshield.ai.core.model.RiskLevel
import com.privacyshield.ai.core.model.RiskScoreResult
import com.privacyshield.ai.core.model.ThreatVector

object PrivacyExplanationEngine {

    /**
     * Generates a deterministic, natural-language privacy explanation based on
     * contextual evidence, mismatch flags, and detected threat vectors.
     */
    fun generateExplanation(
        appName: String,
        category: AppCategory,
        riskResult: RiskScoreResult,
        permissions: List<PermissionItem>,
        threatVectors: List<ThreatVector>
    ): String {
        val unexpectedPerms = permissions.filter { !it.isExpectedForCategory }
        val grantedUnexpected = unexpectedPerms.filter { it.isGranted }
        val sb = StringBuilder()

        val hasCam = permissions.any { it.permissionString.contains("CAMERA", ignoreCase = true) }
        val camGranted = permissions.any { it.permissionString.contains("CAMERA", ignoreCase = true) && it.isGranted }
        val hasMic = permissions.any { it.permissionString.contains("RECORD_AUDIO", ignoreCase = true) }
        val micGranted = permissions.any { it.permissionString.contains("RECORD_AUDIO", ignoreCase = true) && it.isGranted }
        val hasLoc = permissions.any { it.permissionString.contains("LOCATION", ignoreCase = true) }
        val locGranted = permissions.any { it.permissionString.contains("LOCATION", ignoreCase = true) && it.isGranted }

        // Generate sensor status bullet points
        val sensorReport = mutableListOf<String>()
        if (hasCam) {
            sensorReport.add(if (camGranted) "Camera permission is requested and currently GRANTED" else "Camera permission is requested but currently DENIED")
        } else {
            sensorReport.add("Camera permission is NOT requested")
        }

        if (hasMic) {
            sensorReport.add(if (micGranted) "Microphone permission is requested and currently GRANTED" else "Microphone permission is requested but currently DENIED")
        } else {
            sensorReport.add("Microphone permission is NOT requested")
        }

        if (hasLoc) {
            sensorReport.add(if (locGranted) "Location permission is requested and currently GRANTED" else "Location permission is requested but currently DENIED")
        }

        when (riskResult.riskLevel) {
            RiskLevel.LOW -> {
                sb.append("$appName operates within normal privacy boundaries for a ${category.displayName} application. ")
                sb.append(sensorReport.joinToString(". ") + ". ")
                if (permissions.isEmpty()) {
                    sb.append("It does not request any sensitive device permissions.")
                } else {
                    sb.append("The requested permissions (${permissions.joinToString { it.simpleName }}) are directly aligned with its expected core functionality.")
                }
            }
            RiskLevel.MEDIUM -> {
                sb.append("$appName displays moderate privacy considerations (${riskResult.finalScore}/100). ")
                sb.append(sensorReport.joinToString(". ") + ". ")
                if (unexpectedPerms.isNotEmpty()) {
                    sb.append("It requests access to ${unexpectedPerms.joinToString { it.simpleName }}, which is not strictly necessary for basic ${category.displayName} functions. ")
                }
                sb.append("Consider reviewing whether you actively use features requiring these permissions.")
            }
            RiskLevel.HIGH -> {
                sb.append("High privacy risk detected for $appName (${riskResult.finalScore}/100). ")
                sb.append(sensorReport.joinToString(". ") + ". ")
                if (unexpectedPerms.isNotEmpty()) {
                    sb.append("As a ${category.displayName} application, requesting ")
                    sb.append(unexpectedPerms.joinToString { it.simpleName })
                    sb.append(" represents functional drift. ")
                }
                if (grantedUnexpected.isNotEmpty()) {
                    sb.append("These permissions are currently active, giving the application unwarranted access to sensitive personal data.")
                } else {
                    sb.append("While currently restricted, granting these permissions exposes your device to unnecessary surveillance or telemetry collection.")
                }
            }
            RiskLevel.CRITICAL -> {
                sb.append("CRITICAL PRIVACY WARNING: $appName demonstrates high-risk or suspicious permission patterns (${riskResult.finalScore}/100). ")
                sb.append(sensorReport.joinToString(". ") + ". ")
                if (threatVectors.isNotEmpty()) {
                    sb.append("Active Threat Vectors identified: ")
                    sb.append(threatVectors.joinToString("; ") { "${it.title} (${it.description})" })
                    sb.append(". ")
                }
                if (unexpectedPerms.isNotEmpty()) {
                    sb.append("This application requests high-value data channels (such as ${unexpectedPerms.take(3).joinToString { it.simpleName }}) that have no legitimate utility in a ${category.displayName}.")
                }
            }
        }

        return sb.toString()
    }
}
