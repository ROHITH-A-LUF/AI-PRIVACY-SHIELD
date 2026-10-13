package com.privacyshield.ai.core.recommendation

import com.privacyshield.ai.core.model.AppCategory
import com.privacyshield.ai.core.model.AuditRecommendation
import com.privacyshield.ai.core.model.PermissionItem
import com.privacyshield.ai.core.model.RiskLevel
import com.privacyshield.ai.core.model.RiskScoreResult
import com.privacyshield.ai.core.model.ThreatVector

object PrivacyRecommendationEngine {

    /**
     * Synthesizes actionable, clear recommendations based on the CBPRA risk outcome.
     */
    fun generateRecommendation(
        appName: String,
        category: AppCategory,
        riskResult: RiskScoreResult,
        permissions: List<PermissionItem>,
        threatVectors: List<ThreatVector>
    ): AuditRecommendation {
        val unexpectedGranted = permissions.filter { !it.isExpectedForCategory && it.isGranted }
        val unexpectedRequested = permissions.filter { !it.isExpectedForCategory && !it.isGranted }

        return when (riskResult.riskLevel) {
            RiskLevel.LOW -> {
                AuditRecommendation(
                    primaryAction = AuditRecommendation.ActionType.ALLOW,
                    headline = "Permissions Safe to Maintain",
                    rationale = "Permissions are standard and appropriate for a ${category.displayName} app.",
                    recommendedActions = listOf(
                        "No immediate changes required.",
                        "Permissions remain within normal operating parameters."
                    ),
                    isSafeToUse = true
                )
            }
            RiskLevel.MEDIUM -> {
                AuditRecommendation(
                    primaryAction = AuditRecommendation.ActionType.ALLOW_ONCE,
                    headline = "Restrict to 'While Using App' / Allow Once",
                    rationale = "Some permissions (e.g. ${permissions.filter { !it.isExpectedForCategory }.map { it.simpleName }.joinToString()}) are only needed intermittently.",
                    recommendedActions = listOf(
                        "Change location/camera access to 'Ask Every Time' or 'Only while in use'.",
                        "Avoid granting 24/7 background access."
                    ),
                    isSafeToUse = true
                )
            }
            RiskLevel.HIGH -> {
                val targets = unexpectedGranted.map { it.simpleName }.ifEmpty { unexpectedRequested.map { it.simpleName } }
                AuditRecommendation(
                    primaryAction = AuditRecommendation.ActionType.DENY_MISMATCH,
                    headline = "Deny / Revoke Unnecessary Permissions",
                    rationale = "$appName does not require ${targets.joinToString()} to perform its core functions.",
                    recommendedActions = listOf(
                        "Open System App Settings and toggle off ${targets.joinToString()}.",
                        "If the app refuses to operate without these permissions, consider switching to an open-source or privacy-respecting alternative."
                    ),
                    isSafeToUse = false
                )
            }
            RiskLevel.CRITICAL -> {
                val criticalTargets = unexpectedGranted.map { it.simpleName }
                AuditRecommendation(
                    primaryAction = AuditRecommendation.ActionType.REVOKE_IMMEDIATELY,
                    headline = "Immediate Remediation Required",
                    rationale = "Severe security anomalies or exfiltration combinations detected (${threatVectors.joinToString { it.title }}).",
                    recommendedActions = listOf(
                        "Immediately revoke sensitive permissions (${criticalTargets.joinToString()}) in Android App Settings.",
                        "Consider uninstalling this application if you do not strictly require its functionality.",
                        "Monitor battery and data usage logs for unexpected background network traffic."
                    ),
                    isSafeToUse = false
                )
            }
        }
    }
}
