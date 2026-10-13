package com.privacyshield.ai.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import com.privacyshield.ai.data.local.dao.AppDao
import com.privacyshield.ai.data.local.dao.AuditHistoryDao
import com.privacyshield.ai.data.local.dao.PermissionDao
import com.privacyshield.ai.data.local.dao.ThreatVectorDao
import com.privacyshield.ai.data.local.entity.AppEntity
import com.privacyshield.ai.data.local.entity.AuditHistoryEntity
import com.privacyshield.ai.data.local.entity.PermissionEntity
import com.privacyshield.ai.data.local.entity.ThreatVectorEntity

@Database(
    entities = [
        AppEntity::class,
        PermissionEntity::class,
        ThreatVectorEntity::class,
        AuditHistoryEntity::class
    ],
    version = 1,
    exportSchema = false
)
abstract class PrivacyShieldDatabase : RoomDatabase() {

    abstract fun appDao(): AppDao
    abstract fun permissionDao(): PermissionDao
    abstract fun threatVectorDao(): ThreatVectorDao
    abstract fun auditHistoryDao(): AuditHistoryDao

    companion object {
        @Volatile
        private var INSTANCE: PrivacyShieldDatabase? = null

        fun getInstance(context: Context): PrivacyShieldDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    PrivacyShieldDatabase::class.java,
                    "privacyshield.db"
                ).fallbackToDestructiveMigration().build()
                INSTANCE = instance
                instance
            }
        }
    }
}
