package com.privacyshield.ai.cbpra

import com.privacyshield.ai.core.cbpra.ThreatVectorDetector
import com.privacyshield.ai.core.explanation.PrivacyExplanationEngine
import com.privacyshield.ai.core.model.AppCategory
import com.privacyshield.ai.core.model.PermissionItem
import com.privacyshield.ai.core.model.PermissionSensitivity
import com.privacyshield.ai.core.model.RiskLevel
import com.privacyshield.ai.core.model.RiskScoreResult
import com.privacyshield.ai.core.recommendation.PrivacyRecommendationEngine
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class ThreatVectorAndExplanationTest {

    @Test
    fun testSurveillanceVectorDetection() {
        val requested = setOf("android.permission.CAMERA", "android.permission.RECORD_AUDIO")
        val granted = requested
        val vectors = ThreatVectorDetector.detectThreatVectors(AppCategory.CALCULATOR, requested, granted)

        assertEquals(1, vectors.size)
        assertEquals("THREAT_AV_SURVEILLANCE", vectors[0].id)
    }

    @Test
    fun testSocialGraphMiningVectorDetection() {
        val requested = setOf(
            "android.permission.READ_CONTACTS",
            "android.permission.READ_CALL_LOG",
            "android.permission.INTERNET"
        )
        val granted = requested
        val vectors = ThreatVectorDetector.detectThreatVectors(AppCategory.GAMING, requested, granted)

        assertEquals(1, vectors.size)
        assertEquals("THREAT_SOCIAL_GRAPH_MINING", vectors[0].id)
    }

    @Test
    fun testExplanationForHighRiskCalculator() {
        val perms = listOf(
            PermissionItem(
                permissionString = "android.permission.CAMERA",
                simpleName = "Camera",
                group = "Hardware",
                sensitivity = PermissionSensitivity.HIGH,
                isGranted = true,
                isExpectedForCategory = false,
                dataExposed = "Camera feed",
                userExplanation = "Captures photos",
                privacyRiskExplanation = "Visual recording"
            )
        )
        val riskResult = RiskScoreResult(
            finalScore = 75,
            riskLevel = RiskLevel.HIGH,
            baseSensitivityScore = 25,
            contextMismatchPenalty = 37,
            combinationPenalty = 0,
            densityPenalty = 0,
            dominantThreatDrivers = listOf("Unexpected Camera in Calculator")
        )

        val explanation = PrivacyExplanationEngine.generateExplanation(
            appName = "Calculator",
            category = AppCategory.CALCULATOR,
            riskResult = riskResult,
            permissions = perms,
            threatVectors = emptyList()
        )

        assertTrue(explanation.contains("High privacy risk detected"))
        assertTrue(explanation.contains("Calculator application"))
        assertTrue(explanation.contains("Camera"))
    }

    @Test
    fun testRecommendationForCriticalRiskApp() {
        val riskResult = RiskScoreResult(
            finalScore = 90,
            riskLevel = RiskLevel.CRITICAL,
            baseSensitivityScore = 35,
            contextMismatchPenalty = 50,
            combinationPenalty = 30,
            densityPenalty = 0,
            dominantThreatDrivers = listOf("OTP Exfiltration")
        )

        val rec = PrivacyRecommendationEngine.generateRecommendation(
            appName = "Suspicious Flashlight",
            category = AppCategory.FLASHLIGHT,
            riskResult = riskResult,
            permissions = emptyList(),
            threatVectors = emptyList()
        )

        assertFalse(rec.isSafeToUse)
        assertEquals("Immediate Remediation Required", rec.headline)
    }
}
