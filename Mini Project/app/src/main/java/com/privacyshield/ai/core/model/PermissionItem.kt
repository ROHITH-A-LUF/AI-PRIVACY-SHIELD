package com.privacyshield.ai.core.model

data class PermissionItem(
    val permissionString: String,
    val simpleName: String,
    val group: String,
    val sensitivity: PermissionSensitivity,
    val isGranted: Boolean,
    val isExpectedForCategory: Boolean,
    val dataExposed: String,
    val userExplanation: String,
    val privacyRiskExplanation: String,
    val mismatchPenalty: Int = 0
)

data class ThreatVector(
    val id: String,
    val title: String,
    val description: String,
    val participatingPermissions: List<String>,
    val threatSeverity: RiskLevel,
    val penaltyScore: Int
)

data class AuditRecommendation(
    val primaryAction: ActionType,
    val headline: String,
    val rationale: String,
    val recommendedActions: List<String>,
    val isSafeToUse: Boolean
) {
    enum class ActionType(val label: String, val badgeColor: String) {
        ALLOW("Allow", "#10B981"),
        ALLOW_ONCE("Allow Once / While Using", "#3B82F6"),
        REVIEW("Review Permissions", "#F59E0B"),
        DENY_MISMATCH("Deny Unnecessary Permissions", "#F97316"),
        REVOKE_IMMEDIATELY("Revoke & Isolate Immediately", "#EF4444")
    }
}
