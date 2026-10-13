package com.privacyshield.ai.data.repository

import com.privacyshield.ai.core.model.AppCategory
import com.privacyshield.ai.core.model.ApplicationMetadata
import com.privacyshield.ai.core.model.AuditRecommendation
import com.privacyshield.ai.core.model.PermissionItem
import com.privacyshield.ai.core.model.PermissionSensitivity
import com.privacyshield.ai.core.model.RiskLevel
import com.privacyshield.ai.core.model.RiskScoreResult
import com.privacyshield.ai.core.model.ThreatVector
import com.privacyshield.ai.data.local.PrivacyShieldDatabase
import com.privacyshield.ai.data.local.entity.AppEntity
import com.privacyshield.ai.data.local.entity.AuditHistoryEntity
import com.privacyshield.ai.data.local.entity.PermissionEntity
import com.privacyshield.ai.data.local.entity.ThreatVectorEntity
import com.privacyshield.ai.data.scanner.AndroidPackageScanner
import com.privacyshield.ai.domain.repository.PrivacyAuditRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

class PrivacyAuditRepositoryImpl(
    private val database: PrivacyShieldDatabase,
    private val scanner: AndroidPackageScanner
) : PrivacyAuditRepository {

    private val appDao = database.appDao()
    private val permDao = database.permissionDao()
    private val threatDao = database.threatVectorDao()
    private val auditDao = database.auditHistoryDao()

    override fun getInstalledAppsFlow(): Flow<List<ApplicationMetadata>> {
        return appDao.getAllAppsFlow().map { entities ->
            entities.map { mapEntityToMetadata(it) }
        }
    }

    override fun getAuditHistoryFlow(): Flow<List<AuditHistoryEntity>> {
        return auditDao.getAuditHistoryFlow()
    }

    override suspend fun performFullScan(): List<ApplicationMetadata> {
        val scannedApps = scanner.scanAllInstalledApplications(includeSystemApps = false)

        // Persist to Room DB
        val appEntities = scannedApps.map { mapMetadataToAppEntity(it) }
        appDao.clearAll()
        appDao.insertApps(appEntities)

        scannedApps.forEach { app ->
            permDao.deletePermissionsForPackage(app.packageName)
            val permEntities = app.requestedPermissions.map { perm ->
                PermissionEntity(
                    packageName = app.packageName,
                    permissionString = perm.permissionString,
                    simpleName = perm.simpleName,
                    groupName = perm.group,
                    sensitivity = perm.sensitivity.name,
                    isGranted = perm.isGranted,
                    isExpectedForCategory = perm.isExpectedForCategory,
                    dataExposed = perm.dataExposed,
                    userExplanation = perm.userExplanation,
                    privacyRiskExplanation = perm.privacyRiskExplanation,
                    mismatchPenalty = perm.mismatchPenalty
                )
            }
            permDao.insertPermissions(permEntities)

            threatDao.deleteThreatVectorsForPackage(app.packageName)
            val threatEntities = app.detectedThreatVectors.map { vector ->
                ThreatVectorEntity(
                    packageName = app.packageName,
                    vectorId = vector.id,
                    title = vector.title,
                    description = vector.description,
                    severity = vector.threatSeverity.name,
                    penaltyScore = vector.penaltyScore
                )
            }
            threatDao.insertThreatVectors(threatEntities)
        }

        // Log full scan audit event
        val avgScore = if (scannedApps.isNotEmpty()) scannedApps.map { it.riskResult.finalScore }.average().toInt() else 0
        auditDao.insertAuditLog(
            AuditHistoryEntity(
                timestamp = System.currentTimeMillis(),
                packageName = "system.all.apps",
                appName = "Full System Audit (${scannedApps.size} apps)",
                triggerType = "FULL_SCAN",
                riskScore = avgScore,
                riskLevel = RiskLevel.fromScore(avgScore).name
            )
        )

        return scannedApps
    }

    override suspend fun getAppDetails(packageName: String): ApplicationMetadata? {
        val entity = appDao.getAppByPackage(packageName) ?: return null
        return mapEntityToMetadata(entity)
    }

    override suspend fun auditSinglePackage(packageName: String): ApplicationMetadata? {
        val analyzed = scanner.analyzePackageByName(packageName) ?: return null
        persistAuditedApp(analyzed)

        auditDao.insertAuditLog(
            AuditHistoryEntity(
                timestamp = System.currentTimeMillis(),
                packageName = analyzed.packageName,
                appName = analyzed.appName,
                triggerType = "PACKAGE_AUDIT",
                riskScore = analyzed.riskResult.finalScore,
                riskLevel = analyzed.riskResult.riskLevel.name
            )
        )

        return analyzed
    }

    override suspend fun auditDemoCalculator(): ApplicationMetadata {
        val analyzed = scanner.analyzeDemoCalculator()
        persistAuditedApp(analyzed)
        auditDao.insertAuditLog(
            AuditHistoryEntity(
                timestamp = System.currentTimeMillis(),
                packageName = analyzed.packageName,
                appName = analyzed.appName,
                triggerType = "DEMO_CALCULATOR_AUDIT",
                riskScore = analyzed.riskResult.finalScore,
                riskLevel = analyzed.riskResult.riskLevel.name
            )
        )
        return analyzed
    }

    private suspend fun persistAuditedApp(analyzed: ApplicationMetadata) {
        appDao.insertApp(mapMetadataToAppEntity(analyzed))

        permDao.deletePermissionsForPackage(analyzed.packageName)
        permDao.insertPermissions(analyzed.requestedPermissions.map { perm ->
            PermissionEntity(
                packageName = analyzed.packageName,
                permissionString = perm.permissionString,
                simpleName = perm.simpleName,
                groupName = perm.group,
                sensitivity = perm.sensitivity.name,
                isGranted = perm.isGranted,
                isExpectedForCategory = perm.isExpectedForCategory,
                dataExposed = perm.dataExposed,
                userExplanation = perm.userExplanation,
                privacyRiskExplanation = perm.privacyRiskExplanation,
                mismatchPenalty = perm.mismatchPenalty
            )
        })

        threatDao.deleteThreatVectorsForPackage(analyzed.packageName)
        threatDao.insertThreatVectors(analyzed.detectedThreatVectors.map { vector ->
            ThreatVectorEntity(
                packageName = analyzed.packageName,
                vectorId = vector.id,
                title = vector.title,
                description = vector.description,
                severity = vector.threatSeverity.name,
                penaltyScore = vector.penaltyScore
            )
        })
    }

    override suspend fun getGlobalPrivacyScore(): Int {
        val apps = appDao.getAllApps()
        if (apps.isEmpty()) return 100
        val avgAppRisk = apps.map { it.riskScore }.average()
        // Health score is inverse of risk: 100 - avgRisk
        return (100 - avgAppRisk).coerceIn(0.0, 100.0).toInt()
    }

    private suspend fun mapEntityToMetadata(entity: AppEntity): ApplicationMetadata {
        val perms = permDao.getPermissionsForPackage(entity.packageName).map { p ->
            PermissionItem(
                permissionString = p.permissionString,
                simpleName = p.simpleName,
                group = p.groupName,
                sensitivity = PermissionSensitivity.valueOf(p.sensitivity),
                isGranted = p.isGranted,
                isExpectedForCategory = p.isExpectedForCategory,
                dataExposed = p.dataExposed,
                userExplanation = p.userExplanation,
                privacyRiskExplanation = p.privacyRiskExplanation,
                mismatchPenalty = p.mismatchPenalty
            )
        }

        val threats = threatDao.getThreatVectorsForPackage(entity.packageName).map { t ->
            ThreatVector(
                id = t.vectorId,
                title = t.title,
                description = t.description,
                participatingPermissions = emptyList(),
                threatSeverity = RiskLevel.valueOf(t.severity),
                penaltyScore = t.penaltyScore
            )
        }

        val riskLevel = RiskLevel.valueOf(entity.riskLevel)
        val category = try { AppCategory.valueOf(entity.category) } catch (e: Exception) { AppCategory.UNKNOWN }

        return ApplicationMetadata(
            packageName = entity.packageName,
            appName = entity.appName,
            versionName = entity.versionName,
            versionCode = entity.versionCode,
            category = category,
            isSystemApp = entity.isSystemApp,
            requestedPermissions = perms,
            detectedThreatVectors = threats,
            riskResult = RiskScoreResult(
                finalScore = entity.riskScore,
                riskLevel = riskLevel,
                baseSensitivityScore = 0,
                contextMismatchPenalty = 0,
                combinationPenalty = 0,
                densityPenalty = 0,
                dominantThreatDrivers = entity.dominantDrivers.split("|").filter { it.isNotBlank() }
            ),
            aiExplanation = entity.aiExplanation,
            recommendation = AuditRecommendation(
                primaryAction = try {
                    AuditRecommendation.ActionType.valueOf(entity.recommendationAction)
                } catch (e: Exception) {
                    AuditRecommendation.ActionType.REVIEW
                },
                headline = entity.recommendationHeadline,
                rationale = entity.recommendationRationale,
                recommendedActions = emptyList(),
                isSafeToUse = riskLevel == RiskLevel.LOW
            ),
            installTimestamp = entity.installTimestamp,
            lastAnalyzedTimestamp = entity.lastAnalyzedTimestamp
        )
    }

    private fun mapMetadataToAppEntity(meta: ApplicationMetadata): AppEntity {
        return AppEntity(
            packageName = meta.packageName,
            appName = meta.appName,
            versionName = meta.versionName,
            versionCode = meta.versionCode,
            category = meta.category.name,
            isSystemApp = meta.isSystemApp,
            riskScore = meta.riskResult.finalScore,
            riskLevel = meta.riskResult.riskLevel.name,
            dominantDrivers = meta.riskResult.dominantThreatDrivers.joinToString("|"),
            aiExplanation = meta.aiExplanation,
            recommendationAction = meta.recommendation.primaryAction.name,
            recommendationHeadline = meta.recommendation.headline,
            recommendationRationale = meta.recommendation.rationale,
            installTimestamp = meta.installTimestamp,
            lastAnalyzedTimestamp = meta.lastAnalyzedTimestamp
        )
    }
}
