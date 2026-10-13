package com.privacyshield.ai.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "applications")
data class AppEntity(
    @PrimaryKey val packageName: String,
    val appName: String,
    val versionName: String,
    val versionCode: Long,
    val category: String,
    val isSystemApp: Boolean,
    val riskScore: Int,
    val riskLevel: String,
    val dominantDrivers: String, // JSON or comma-separated
    val aiExplanation: String,
    val recommendationAction: String,
    val recommendationHeadline: String,
    val recommendationRationale: String,
    val installTimestamp: Long,
    val lastAnalyzedTimestamp: Long
)

@Entity(tableName = "permissions")
data class PermissionEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val packageName: String,
    val permissionString: String,
    val simpleName: String,
    val groupName: String,
    val sensitivity: String,
    val isGranted: Boolean,
    val isExpectedForCategory: Boolean,
    val dataExposed: String,
    val userExplanation: String,
    val privacyRiskExplanation: String,
    val mismatchPenalty: Int
)

@Entity(tableName = "threat_vectors")
data class ThreatVectorEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val packageName: String,
    val vectorId: String,
    val title: String,
    val description: String,
    val severity: String,
    val penaltyScore: Int
)

@Entity(tableName = "audit_history")
data class AuditHistoryEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val timestamp: Long,
    val packageName: String,
    val appName: String,
    val triggerType: String, // FULL_SCAN, NEW_INSTALL, PERMISSION_REVOKED
    val riskScore: Int,
    val riskLevel: String
)
