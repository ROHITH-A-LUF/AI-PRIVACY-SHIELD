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

        when (riskResult.riskLevel) {
            RiskLevel.LOW -> {
                sb.append("$appName operates within normal privacy boundaries for a ${category.displayName} application. ")
                if (permissions.isEmpty()) {
                    sb.append("It does not request any sensitive device permissions.")
                } else {
                    sb.append("The requested permissions (${permissions.joinToString { it.simpleName }}) are directly aligned with its expected core functionality.")
                }
            }
            RiskLevel.MEDIUM -> {
                sb.append("$appName displays moderate privacy considerations. ")
                if (unexpectedPerms.isNotEmpty()) {
                    sb.append("It requests access to ${unexpectedPerms.joinToString { it.simpleName }}, which is not strictly necessary for basic ${category.displayName} functions. ")
                }
                sb.append("Consider reviewing whether you actively use features requiring these permissions.")
            }
            RiskLevel.HIGH -> {
                sb.append("High privacy risk detected for $appName. ")
                sb.append("As a ${category.displayName} application, requesting ")
                sb.append(unexpectedPerms.joinToString { it.simpleName })
                sb.append(" represents severe functional drift. ")
                if (grantedUnexpected.isNotEmpty()) {
                    sb.append("These permissions are currently active, giving the application unwarranted access to sensitive personal data.")
                } else {
                    sb.append("While currently restricted, granting these permissions exposes your device to unnecessary surveillance or telemetry collection.")
                }
            }
            RiskLevel.CRITICAL -> {
                sb.append("CRITICAL PRIVACY WARNING: $appName demonstrates high-risk or suspicious permission patterns. ")
                if (threatVectors.isNotEmpty()) {
                    sb.append("Active Threat Vectors identified: ")
                    sb.append(threatVectors.joinToString("; ") { "${it.title} (${it.description})" })
                    sb.append(". ")
                }
                sb.append("This application has access to high-value data channels (such as ${unexpectedPerms.take(3).joinToString { it.simpleName }}) that have no legitimate utility in a ${category.displayName}.")
            }
        }

        return sb.toString()
    }
}
