package com.privacyshield.ai.domain.usecase

import com.privacyshield.ai.core.model.ApplicationMetadata
import com.privacyshield.ai.core.model.RiskLevel
import com.privacyshield.ai.domain.repository.PrivacyAuditRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

data class DashboardSummary(
    val globalHealthScore: Int,
    val totalAppsScanned: Int,
    val highRiskCount: Int,
    val mediumRiskCount: Int,
    val lowRiskCount: Int,
    val activeSensitivePermissionCount: Int,
    val appsWithDrift: List<ApplicationMetadata>
)

class GetDashboardSummaryUseCase(private val repository: PrivacyAuditRepository) {
    operator fun invoke(): Flow<DashboardSummary> {
        return repository.getInstalledAppsFlow().map { apps ->
            val highRisk = apps.count { it.riskResult.riskLevel == RiskLevel.HIGH || it.riskResult.riskLevel == RiskLevel.CRITICAL }
            val mediumRisk = apps.count { it.riskResult.riskLevel == RiskLevel.MEDIUM }
            val lowRisk = apps.count { it.riskResult.riskLevel == RiskLevel.LOW }
            val sensitivePermsCount = apps.sumOf { app ->
                app.requestedPermissions.count { it.isGranted && it.sensitivity.baseWeight >= 25 }
            }
            val appsWithDrift = apps.filter { it.riskResult.contextMismatchPenalty > 0 || it.detectedThreatVectors.isNotEmpty() }
            val globalHealth = if (apps.isNotEmpty()) {
                val avgRisk = apps.map { it.riskResult.finalScore }.average()
                (100 - avgRisk).toInt().coerceIn(0, 100)
            } else {
                100
            }

            DashboardSummary(
                globalHealthScore = globalHealth,
                totalAppsScanned = apps.size,
                highRiskCount = highRisk,
                mediumRiskCount = mediumRisk,
                lowRiskCount = lowRisk,
                activeSensitivePermissionCount = sensitivePermsCount,
                appsWithDrift = appsWithDrift
            )
        }
    }
}

class ScanInstalledApplicationsUseCase(private val repository: PrivacyAuditRepository) {
    suspend operator fun invoke(): List<ApplicationMetadata> {
        return repository.performFullScan()
    }
}

class GetAppRiskDetailUseCase(private val repository: PrivacyAuditRepository) {
    suspend operator fun invoke(packageName: String): ApplicationMetadata? {
        return repository.getAppDetails(packageName)
    }
}

class AnalyzeDemoCalculatorUseCase(private val repository: PrivacyAuditRepository) {
    suspend operator fun invoke(): ApplicationMetadata {
        return repository.auditDemoCalculator()
    }
}
