package com.privacyshield.ai.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Transaction
import com.privacyshield.ai.data.local.entity.AppEntity
import com.privacyshield.ai.data.local.entity.AuditHistoryEntity
import com.privacyshield.ai.data.local.entity.PermissionEntity
import com.privacyshield.ai.data.local.entity.ThreatVectorEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface AppDao {
    @Query("SELECT * FROM applications ORDER BY riskScore DESC")
    fun getAllAppsFlow(): Flow<List<AppEntity>>

    @Query("SELECT * FROM applications ORDER BY riskScore DESC")
    suspend fun getAllApps(): List<AppEntity>

    @Query("SELECT * FROM applications WHERE packageName = :packageName LIMIT 1")
    suspend fun getAppByPackage(packageName: String): AppEntity?

    @Query("SELECT * FROM applications WHERE riskLevel = 'CRITICAL' OR riskLevel = 'HIGH' ORDER BY riskScore DESC")
    fun getHighRiskAppsFlow(): Flow<List<AppEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertApp(app: AppEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertApps(apps: List<AppEntity>)

    @Query("DELETE FROM applications WHERE packageName = :packageName")
    suspend fun deleteApp(packageName: String)

    @Query("DELETE FROM applications")
    suspend fun clearAll()
}

@Dao
interface PermissionDao {
    @Query("SELECT * FROM permissions WHERE packageName = :packageName")
    suspend fun getPermissionsForPackage(packageName: String): List<PermissionEntity>

    @Query("SELECT * FROM permissions WHERE isGranted = 1 AND (sensitivity = 'HIGH' OR sensitivity = 'CRITICAL')")
    suspend fun getAllActiveSensitivePermissions(): List<PermissionEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertPermissions(permissions: List<PermissionEntity>)

    @Query("DELETE FROM permissions WHERE packageName = :packageName")
    suspend fun deletePermissionsForPackage(packageName: String)
}

@Dao
interface ThreatVectorDao {
    @Query("SELECT * FROM threat_vectors WHERE packageName = :packageName")
    suspend fun getThreatVectorsForPackage(packageName: String): List<ThreatVectorEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertThreatVectors(vectors: List<ThreatVectorEntity>)

    @Query("DELETE FROM threat_vectors WHERE packageName = :packageName")
    suspend fun deleteThreatVectorsForPackage(packageName: String)
}

@Dao
interface AuditHistoryDao {
    @Query("SELECT * FROM audit_history ORDER BY timestamp DESC LIMIT 50")
    fun getAuditHistoryFlow(): Flow<List<AuditHistoryEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAuditLog(log: AuditHistoryEntity)
}
