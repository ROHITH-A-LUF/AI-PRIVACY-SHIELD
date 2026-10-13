package com.privacyshield.ai.core.model

enum class RiskLevel(
    val title: String,
    val scoreMin: Int,
    val scoreMax: Int,
    val hexColor: String,
    val description: String
) {
    LOW(
        title = "Low Risk",
        scoreMin = 0,
        scoreMax = 30,
        hexColor = "#10B981", // Emerald
        description = "Permissions requested align cleanly with the application's stated functionality."
    ),
    MEDIUM(
        title = "Medium Risk",
        scoreMin = 31,
        scoreMax = 60,
        hexColor = "#F59E0B", // Amber
        description = "Contains secondary permissions or moderate functional drift that should be evaluated."
    ),
    HIGH(
        title = "High Risk",
        scoreMin = 61,
        scoreMax = 80,
        hexColor = "#F97316", // Orange
        description = "Significant context mismatch detected. Application requests unnecessary sensitive boundaries."
    ),
    CRITICAL(
        title = "Critical Risk",
        scoreMin = 81,
        scoreMax = 100,
        hexColor = "#EF4444", // Red
        description = "Severe privacy invasion or dangerous permission combinations identified. High exfiltration risk."
    );

    companion object {
        fun fromScore(score: Int): RiskLevel = when {
            score <= 30 -> LOW
            score <= 60 -> MEDIUM
            score <= 80 -> HIGH
            else -> CRITICAL
        }
    }
}

enum class PermissionSensitivity(val baseWeight: Int, val tag: String) {
    LOW(baseWeight = 5, tag = "Normal"),
    MEDIUM(baseWeight = 15, tag = "Moderate"),
    HIGH(baseWeight = 25, tag = "Sensitive"),
    CRITICAL(baseWeight = 35, tag = "High Risk")
}
