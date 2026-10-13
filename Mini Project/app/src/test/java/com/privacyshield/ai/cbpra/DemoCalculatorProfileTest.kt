package com.privacyshield.ai.cbpra

import com.privacyshield.ai.core.cbpra.ThreatVectorDetector
import com.privacyshield.ai.core.demo.DemoCalculatorProfile
import com.privacyshield.ai.core.model.AppCategory
import com.privacyshield.ai.core.model.RiskLevel
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class DemoCalculatorProfileTest {

    @Test
    fun demoCalculatorPermissionsTriggerCriticalThreatVectors() {
        val requested = DemoCalculatorProfile.DEMO_PERMISSIONS.toSet()
        val granted = requested

        val vectors = ThreatVectorDetector.detectThreatVectors(
            category = AppCategory.CALCULATOR,
            requestedPermissions = requested,
            grantedPermissions = granted
        )

        assertTrue(vectors.any { it.id == "THREAT_OTP_EXFILTRATION" })
        assertTrue(vectors.any { it.id == "THREAT_AV_SURVEILLANCE" })
        assertEquals(RiskLevel.CRITICAL, vectors.first { it.id == "THREAT_OTP_EXFILTRATION" }.threatSeverity)
    }
}
