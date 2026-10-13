package com.privacyshield.ai.domain.repository

import com.privacyshield.ai.core.model.ApplicationMetadata
import com.privacyshield.ai.data.local.entity.AuditHistoryEntity
import kotlinx.coroutines.flow.Flow

interface PrivacyAuditRepository {
    fun getInstalledAppsFlow(): Flow<List<ApplicationMetadata>>
    fun getAuditHistoryFlow(): Flow<List<AuditHistoryEntity>>
    suspend fun performFullScan(): List<ApplicationMetadata>
    suspend fun getAppDetails(packageName: String): ApplicationMetadata?
    suspend fun auditSinglePackage(packageName: String): ApplicationMetadata?
    suspend fun auditDemoCalculator(): ApplicationMetadata
    suspend fun getGlobalPrivacyScore(): Int
}
