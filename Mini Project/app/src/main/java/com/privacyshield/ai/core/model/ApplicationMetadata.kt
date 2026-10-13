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
)
