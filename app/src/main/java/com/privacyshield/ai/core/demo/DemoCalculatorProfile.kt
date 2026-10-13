package com.privacyshield.ai.core.demo

import com.privacyshield.ai.core.model.AppCategory

/**
 * Profile for the demo malicious calculator used in PrivacyShield presentations.
 * Matches the "Smart Calculator Pro" sample in the web CBPRA demo.
 */
object DemoCalculatorProfile {
    const val PACKAGE_NAME = "com.privacyshield.demo.calculator"
    const val APP_NAME = "Smart Calculator Pro"
    const val VERSION_NAME = "2.4.1"
    const val VERSION_CODE = 1L
    val CATEGORY = AppCategory.CALCULATOR

    /**
     * Permissions declared by the demo calculator that are inappropriate for a calculator app.
     * PrivacyShield should flag context mismatches and synergistic threat vectors.
     */
    val DEMO_PERMISSIONS: List<String> = listOf(
        "android.permission.INTERNET",
        "android.permission.CAMERA",
        "android.permission.RECORD_AUDIO",
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.READ_SMS"
    )
}
