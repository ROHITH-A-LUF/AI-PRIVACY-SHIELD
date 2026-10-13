package com.privacyshield.ai.data.scanner

import android.content.Context
import android.content.pm.ApplicationInfo
import android.content.pm.PackageInfo
import android.content.pm.PackageManager
import android.os.Build
import com.privacyshield.ai.core.cbpra.CbpraRiskScoringEngine
import com.privacyshield.ai.core.cbpra.ContextPermissionMatrix
import com.privacyshield.ai.core.cbpra.ThreatVectorDetector
import com.privacyshield.ai.core.demo.DemoCalculatorProfile
import com.privacyshield.ai.core.explanation.PrivacyExplanationEngine
import com.privacyshield.ai.core.model.ApplicationMetadata
import com.privacyshield.ai.core.model.PermissionItem
import com.privacyshield.ai.core.recommendation.PrivacyRecommendationEngine
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class AndroidPackageScanner(private val context: Context) {

    private val packageManager: PackageManager = context.packageManager

    /**
     * Performs a comprehensive privacy scan of all installed packages on the Android device.
     */
    suspend fun scanAllInstalledApplications(includeSystemApps: Boolean = false): List<ApplicationMetadata> =
        withContext(Dispatchers.IO) {
            val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                PackageManager.GET_PERMISSIONS or PackageManager.GET_META_DATA
            } else {
                @Suppress("DEPRECATION")
                PackageManager.GET_PERMISSIONS or PackageManager.GET_META_DATA
            }

            val installedPackages = try {
                packageManager.getInstalledPackages(flags)
            } catch (e: Exception) {
                emptyList<PackageInfo>()
            }

            val resultList = mutableListOf<ApplicationMetadata>()

            for (pkgInfo in installedPackages) {
                val appInfo = pkgInfo.applicationInfo ?: continue
                val isSystem = (appInfo.flags and ApplicationInfo.FLAG_SYSTEM) != 0

                // Exclude system packages unless explicitly requested
                if (isSystem && !includeSystemApps) {
                    continue
                }

                // Ignore PrivacyShield AI self package
                if (pkgInfo.packageName == context.packageName) {
                    continue
                }

                val analyzed = analyzePackage(pkgInfo)
                resultList.add(analyzed)
            }

            resultList.sortedByDescending { it.riskResult.finalScore }
        }

    /**
     * Audits a single application package by PackageInfo.
     */
    fun analyzePackage(pkgInfo: PackageInfo): ApplicationMetadata {
        val appInfo = pkgInfo.applicationInfo
        val appLabel = appInfo?.let { packageManager.getApplicationLabel(it).toString() } ?: pkgInfo.packageName
        val isSystem = appInfo?.let { (it.flags and ApplicationInfo.FLAG_SYSTEM) != 0 } ?: false

        // 1. Context / Category Resolution
        val category = CategoryResolutionEngine.resolveCategory(
            packageName = pkgInfo.packageName,
            appLabel = appLabel,
            appInfo = appInfo
        )

        // 2. Permission Extraction and Granted Status Resolution
        val permissions = mutableListOf<PermissionItem>()
        val requestedPermsArray = pkgInfo.requestedPermissions
        val requestedFlagsArray = pkgInfo.requestedPermissionsFlags

        if (requestedPermsArray != null) {
            for (i in requestedPermsArray.indices) {
                val permString = requestedPermsArray[i]
                val isGranted = if (requestedFlagsArray != null && i < requestedFlagsArray.size) {
                    (requestedFlagsArray[i] and PackageInfo.REQUESTED_PERMISSION_GRANTED) != 0
                } else {
                    false
                }

                val definition = ContextPermissionMatrix.getDefinition(permString)
                val isExpected = ContextPermissionMatrix.isPermissionExpected(category, permString)
                val mismatchPenalty = if (isExpected) 0 else (definition.sensitivity.baseWeight * 1.5).toInt()

                permissions.add(
                    PermissionItem(
                        permissionString = permString,
                        simpleName = definition.simpleName,
                        group = definition.group,
                        sensitivity = definition.sensitivity,
                        isGranted = isGranted,
                        isExpectedForCategory = isExpected,
                        dataExposed = definition.dataExposed,
                        userExplanation = definition.baseExplanation,
                        privacyRiskExplanation = definition.privacyRiskExplanation,
                        mismatchPenalty = mismatchPenalty
                    )
                )
            }
        }

        // 3. Combinatorial Threat Detection
        val requestedPermSet = permissions.map { it.permissionString }.toSet()
        val grantedPermSet = permissions.filter { it.isGranted }.map { it.permissionString }.toSet()
        val threatVectors = ThreatVectorDetector.detectThreatVectors(
            category = category,
            requestedPermissions = requestedPermSet,
            grantedPermissions = grantedPermSet
        )

        // 4. CBPRA Mathematical Risk Score Computation
        val riskResult = CbpraRiskScoringEngine.calculateRiskScore(
            category = category,
            permissions = permissions,
            threatVectors = threatVectors
        )

        // 5. Intelligent Plain-Language Explanation Generation
        val explanation = PrivacyExplanationEngine.generateExplanation(
            appName = appLabel,
            category = category,
            riskResult = riskResult,
            permissions = permissions,
            threatVectors = threatVectors
        )

        // 6. Actionable Recommendation Generation
        val recommendation = PrivacyRecommendationEngine.generateRecommendation(
            appName = appLabel,
            category = category,
            riskResult = riskResult,
            permissions = permissions,
            threatVectors = threatVectors
        )

        val installTime = pkgInfo.firstInstallTime
        val lastUpdate = pkgInfo.lastUpdateTime

        return ApplicationMetadata(
            packageName = pkgInfo.packageName,
            appName = appLabel,
            versionName = pkgInfo.versionName ?: "1.0",
            versionCode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) pkgInfo.longVersionCode else @Suppress("DEPRECATION") pkgInfo.versionCode.toLong(),
            category = category,
            isSystemApp = isSystem,
            requestedPermissions = permissions,
            detectedThreatVectors = threatVectors,
            riskResult = riskResult,
            aiExplanation = explanation,
            recommendation = recommendation,
            installTimestamp = installTime,
            lastAnalyzedTimestamp = System.currentTimeMillis()
        )
    }

    /**
     * Builds a full CBPRA audit for a synthetic app profile (used when demo APK is not installed).
     */
    fun analyzeSyntheticProfile(
        packageName: String,
        appName: String,
        category: com.privacyshield.ai.core.model.AppCategory,
        permissionStrings: List<String>,
        versionName: String = "1.0.0",
        versionCode: Long = 1,
        isSystemApp: Boolean = false,
        assumeGranted: Boolean = true
    ): ApplicationMetadata {
        val permissions = permissionStrings.map { permString ->
            val definition = ContextPermissionMatrix.getDefinition(permString)
            val isExpected = ContextPermissionMatrix.isPermissionExpected(category, permString)
            val mismatchPenalty = if (isExpected) 0 else (definition.sensitivity.baseWeight * 1.5).toInt()

            PermissionItem(
                permissionString = permString,
                simpleName = definition.simpleName,
                group = definition.group,
                sensitivity = definition.sensitivity,
                isGranted = assumeGranted,
                isExpectedForCategory = isExpected,
                dataExposed = definition.dataExposed,
                userExplanation = definition.baseExplanation,
                privacyRiskExplanation = definition.privacyRiskExplanation,
                mismatchPenalty = mismatchPenalty
            )
        }

        val requestedPermSet = permissions.map { it.permissionString }.toSet()
        val grantedPermSet = permissions.filter { it.isGranted }.map { it.permissionString }.toSet()
        val threatVectors = ThreatVectorDetector.detectThreatVectors(
            category = category,
            requestedPermissions = requestedPermSet,
            grantedPermissions = grantedPermSet
        )

        val riskResult = CbpraRiskScoringEngine.calculateRiskScore(
            category = category,
            permissions = permissions,
            threatVectors = threatVectors
        )

        val explanation = PrivacyExplanationEngine.generateExplanation(
            appName = appName,
            category = category,
            riskResult = riskResult,
            permissions = permissions,
            threatVectors = threatVectors
        )

        val recommendation = PrivacyRecommendationEngine.generateRecommendation(
            appName = appName,
            category = category,
            riskResult = riskResult,
            permissions = permissions,
            threatVectors = threatVectors
        )

        return ApplicationMetadata(
            packageName = packageName,
            appName = appName,
            versionName = versionName,
            versionCode = versionCode,
            category = category,
            isSystemApp = isSystemApp,
            requestedPermissions = permissions,
            detectedThreatVectors = threatVectors,
            riskResult = riskResult,
            aiExplanation = explanation,
            recommendation = recommendation,
            installTimestamp = System.currentTimeMillis(),
            lastAnalyzedTimestamp = System.currentTimeMillis()
        )
    }

    /**
     * Audits the demo malicious calculator — uses installed APK if present, otherwise synthetic profile.
     */
    fun analyzeDemoCalculator(): ApplicationMetadata {
        val installed = analyzePackageByName(DemoCalculatorProfile.PACKAGE_NAME)
        if (installed != null) return installed

        return analyzeSyntheticProfile(
            packageName = DemoCalculatorProfile.PACKAGE_NAME,
            appName = DemoCalculatorProfile.APP_NAME,
            category = DemoCalculatorProfile.CATEGORY,
            permissionStrings = DemoCalculatorProfile.DEMO_PERMISSIONS,
            versionName = DemoCalculatorProfile.VERSION_NAME,
            versionCode = DemoCalculatorProfile.VERSION_CODE
        )
    }

    /**
     * Audits a package by its package name string (useful for install broadcast events).
     */
    fun analyzePackageByName(packageName: String): ApplicationMetadata? {
        return try {
            val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                PackageManager.GET_PERMISSIONS or PackageManager.GET_META_DATA
            } else {
                @Suppress("DEPRECATION")
                PackageManager.GET_PERMISSIONS or PackageManager.GET_META_DATA
            }
            val pkgInfo = packageManager.getPackageInfo(packageName, flags)
            analyzePackage(pkgInfo)
        } catch (e: Exception) {
            null
        }
    }
}
