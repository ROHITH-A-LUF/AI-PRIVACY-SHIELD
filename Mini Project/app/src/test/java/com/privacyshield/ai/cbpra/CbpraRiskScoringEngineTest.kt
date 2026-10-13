package com.privacyshield.ai.cbpra

import com.privacyshield.ai.core.cbpra.CbpraRiskScoringEngine
import com.privacyshield.ai.core.cbpra.ContextPermissionMatrix
import com.privacyshield.ai.core.cbpra.ThreatVectorDetector
import com.privacyshield.ai.core.model.AppCategory
import com.privacyshield.ai.core.model.PermissionItem
import com.privacyshield.ai.core.model.RiskLevel
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class CbpraRiskScoringEngineTest {

    @Test
    fun testCalculatorWithCameraAndLocationProducesHighRisk() {
        val category = AppCategory.CALCULATOR
        val perms = listOf(
            createPermissionItem(category, "android.permission.INTERNET", isGranted = true),
            createPermissionItem(category, "android.permission.CAMERA", isGranted = true),
            createPermissionItem(category, "android.permission.ACCESS_FINE_LOCATION", isGranted = true)
        )
        val threatVectors = ThreatVectorDetector.detectThreatVectors(
            category = category,
            requestedPermissions = perms.map { it.permissionString }.toSet(),
            grantedPermissions = perms.filter { it.isGranted }.map { it.permissionString }.toSet()
        )
        val result = CbpraRiskScoringEngine.calculateRiskScore(category, perms, threatVectors)

        // Camera (25 * 2.5 = 62.5) + Fine Location (25 * 2.5 = 62.5) + Internet (5 * 1.0 = 5) > 100 -> Clamped 100
        assertTrue("Score should be High or Critical", result.finalScore >= 80)
        assertEquals(RiskLevel.CRITICAL, result.riskLevel)
        assertTrue(result.contextMismatchPenalty > 50)
    }

    @Test
    fun testCameraAppWithCameraAndAudioProducesLowRisk() {
        val category = AppCategory.CAMERA
        val perms = listOf(
            createPermissionItem(category, "android.permission.CAMERA", isGranted = true),
            createPermissionItem(category, "android.permission.RECORD_AUDIO", isGranted = true),
            createPermissionItem(category, "android.permission.READ_MEDIA_IMAGES", isGranted = true)
        )
        val threatVectors = ThreatVectorDetector.detectThreatVectors(
            category = category,
            requestedPermissions = perms.map { it.permissionString }.toSet(),
            grantedPermissions = perms.filter { it.isGranted }.map { it.permissionString }.toSet()
        )
        val result = CbpraRiskScoringEngine.calculateRiskScore(category, perms, threatVectors)

        // All permissions are expected for a Camera app, mismatch penalty should be 0
        assertEquals(0, result.contextMismatchPenalty)
        assertEquals(0, result.combinationPenalty)
    }

    @Test
    fun testFlashlightWithMicrophoneProducesSevereMismatch() {
        val category = AppCategory.FLASHLIGHT
        val perms = listOf(
            createPermissionItem(category, "android.permission.CAMERA", isGranted = true), // Flashlight LED
            createPermissionItem(category, "android.permission.RECORD_AUDIO", isGranted = true), // Mismatch!
            createPermissionItem(category, "android.permission.ACCESS_FINE_LOCATION", isGranted = true) // Mismatch!
        )
        val threatVectors = ThreatVectorDetector.detectThreatVectors(
            category = category,
            requestedPermissions = perms.map { it.permissionString }.toSet(),
            grantedPermissions = perms.filter { it.isGranted }.map { it.permissionString }.toSet()
        )
        val result = CbpraRiskScoringEngine.calculateRiskScore(category, perms, threatVectors)

        assertTrue(result.finalScore >= 80)
        assertEquals(RiskLevel.CRITICAL, result.riskLevel)
        assertTrue(result.dominantThreatDrivers.any { it.contains("Microphone") })
    }

    @Test
    fun testCalculatorWithSmsAndInternetTriggersOtpExfiltrationThreat() {
        val category = AppCategory.CALCULATOR
        val perms = listOf(
            createPermissionItem(category, "android.permission.READ_SMS", isGranted = true),
            createPermissionItem(category, "android.permission.INTERNET", isGranted = true)
        )
        val threatVectors = ThreatVectorDetector.detectThreatVectors(
            category = category,
            requestedPermissions = perms.map { it.permissionString }.toSet(),
            grantedPermissions = perms.filter { it.isGranted }.map { it.permissionString }.toSet()
        )
        val result = CbpraRiskScoringEngine.calculateRiskScore(category, perms, threatVectors)

        assertTrue(threatVectors.any { it.id == "THREAT_OTP_EXFILTRATION" })
        assertTrue(result.combinationPenalty >= 30)
        assertEquals(RiskLevel.CRITICAL, result.riskLevel)
    }

    private fun createPermissionItem(category: AppCategory, permissionString: String, isGranted: Boolean): PermissionItem {
        val def = ContextPermissionMatrix.getDefinition(permissionString)
        val isExpected = ContextPermissionMatrix.isPermissionExpected(category, permissionString)
        return PermissionItem(
            permissionString = permissionString,
            simpleName = def.simpleName,
            group = def.group,
            sensitivity = def.sensitivity,
            isGranted = isGranted,
            isExpectedForCategory = isExpected,
            dataExposed = def.dataExposed,
            userExplanation = def.baseExplanation,
            privacyRiskExplanation = def.privacyRiskExplanation,
            mismatchPenalty = if (isExpected) 0 else (def.sensitivity.baseWeight * 1.5).toInt()
        )
    }
}
