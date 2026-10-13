package com.privacyshield.ai.core.model

data class RiskScoreResult(
    val finalScore: Int,
    val riskLevel: RiskLevel,
    val baseSensitivityScore: Int,
    val contextMismatchPenalty: Int,
    val combinationPenalty: Int,
    val densityPenalty: Int,
    val dominantThreatDrivers: List<String>
)

data class ApplicationMetadata(
    val packageName: String,
    val appName: String,
    val versionName: String,
    val versionCode: Long,
    val category: AppCategory,
    val isSystemApp: Boolean,
    val requestedPermissions: List<PermissionItem>,
    val detectedThreatVectors: List<ThreatVector>,
    val riskResult: RiskScoreResult,
    val aiExplanation: String,
    val recommendation: AuditRecommendation,
    val installTimestamp: Long,
    val lastAnalyzedTimestamp: Long
) {
    val grantedPermissions: List<PermissionItem>
        get() = requestedPermissions.filter { it.isGranted }

    val deniedPermissions: List<PermissionItem>
        get() = requestedPermissions.filter { !it.isGranted }

    fun isPermissionRequested(permissionString: String): Boolean =
        requestedPermissions.any { it.permissionString.equals(permissionString, ignoreCase = true) }

    fun isPermissionGranted(permissionString: String): Boolean =
        requestedPermissions.any { it.permissionString.equals(permissionString, ignoreCase = true) && it.isGranted }

    val hasCameraRequested: Boolean
        get() = requestedPermissions.any { it.permissionString.contains("CAMERA", ignoreCase = true) }

    val isCameraGranted: Boolean
        get() = requestedPermissions.any { it.permissionString.contains("CAMERA", ignoreCase = true) && it.isGranted }

    val hasMicrophoneRequested: Boolean
        get() = requestedPermissions.any { it.permissionString.contains("RECORD_AUDIO", ignoreCase = true) }

    val isMicrophoneGranted: Boolean
        get() = requestedPermissions.any { it.permissionString.contains("RECORD_AUDIO", ignoreCase = true) && it.isGranted }

    val hasLocationRequested: Boolean
        get() = requestedPermissions.any { it.permissionString.contains("LOCATION", ignoreCase = true) }

    val isLocationGranted: Boolean
        get() = requestedPermissions.any { it.permissionString.contains("LOCATION", ignoreCase = true) && it.isGranted }

    val hasInternetRequested: Boolean
        get() = requestedPermissions.any { it.permissionString.contains("INTERNET", ignoreCase = true) }
}
