package com.privacyshield.ai.core.cbpra

import com.privacyshield.ai.core.model.AppCategory
import com.privacyshield.ai.core.model.PermissionItem
import com.privacyshield.ai.core.model.RiskLevel
import com.privacyshield.ai.core.model.RiskScoreResult
import com.privacyshield.ai.core.model.ThreatVector
import kotlin.math.min
import kotlin.math.roundToInt

object CbpraRiskScoringEngine {

    private const val MISMATCH_PENALTY_MULTIPLIER = 1.5
    private const val GRANTED_FACTOR_ACTIVE = 1.0
    private const val GRANTED_FACTOR_REQUESTED_ONLY = 0.65

    /**
     * Executes the Context-Based Permission Risk Assessment (CBPRA) scoring algorithm.
     * Evaluates base sensitivity, functional domain mismatch, synergistic threat vectors,
     * and permission density to produce a deterministic, explainable risk score (0-100).
     */
    fun calculateRiskScore(
        category: AppCategory,
        permissions: List<PermissionItem>,
        threatVectors: List<ThreatVector>
    ): RiskScoreResult {
        if (permissions.isEmpty()) {
            return RiskScoreResult(
                finalScore = 0,
                riskLevel = RiskLevel.LOW,
                baseSensitivityScore = 0,
                contextMismatchPenalty = 0,
                combinationPenalty = 0,
                densityPenalty = 0,
                dominantThreatDrivers = emptyList()
            )
        }

        var totalBaseSensitivity = 0.0
        var totalMismatchPenalty = 0.0
        val dominantDrivers = mutableListOf<String>()

        permissions.forEach { perm ->
            val baseWeight = perm.sensitivity.baseWeight.toDouble()
            val isGranted = perm.isGranted
            val grantedFactor = if (isGranted) GRANTED_FACTOR_ACTIVE else GRANTED_FACTOR_REQUESTED_ONLY

            // Step 1: Base sensitivity calculation
            val scaledBase = baseWeight * grantedFactor
            totalBaseSensitivity += scaledBase

            // Step 2: Context mismatch penalty calculation
            if (!perm.isExpectedForCategory) {
                val mismatchContribution = baseWeight * MISMATCH_PENALTY_MULTIPLIER * grantedFactor
                totalMismatchPenalty += mismatchContribution
                val statusText = if (isGranted) "Active" else "Requested"
                dominantDrivers.add("Unexpected ${perm.simpleName} ($statusText) in ${category.displayName}")
            }
        }

        // Step 3: Threat Combination Multiplier
        var totalCombinationPenalty = 0
        threatVectors.forEach { vector ->
            totalCombinationPenalty += vector.penaltyScore
            dominantDrivers.add("Synergistic Threat: ${vector.title}")
        }

        // Step 4: Excessive Permission Density Factor
        val sensitiveCount = permissions.count { it.sensitivity.baseWeight >= 25 }
        val densityPenalty = when {
            sensitiveCount > 5 -> 15
            sensitiveCount > 3 -> 8
            else -> 0
        }
        if (densityPenalty > 0) {
            dominantDrivers.add("Excessive Sensitive Permission Density ($sensitiveCount sensitive permissions)")
        }

        // Aggregate and clamp to 0-100
        val rawAggregate = totalBaseSensitivity + totalMismatchPenalty + totalCombinationPenalty + densityPenalty
        val finalScore = min(100.0, rawAggregate).roundToInt()
        val riskLevel = RiskLevel.fromScore(finalScore)

        return RiskScoreResult(
            finalScore = finalScore,
            riskLevel = riskLevel,
            baseSensitivityScore = totalBaseSensitivity.roundToInt(),
            contextMismatchPenalty = totalMismatchPenalty.roundToInt(),
            combinationPenalty = totalCombinationPenalty,
            densityPenalty = densityPenalty,
            dominantThreatDrivers = dominantDrivers.take(4)
        )
    }
}
